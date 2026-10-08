import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  runPythonCode,
  formatPythonCode,
  getPythonVersion,
  explainAndFixPythonError,
} from './server/pythonRunner';

dotenv.config();

const app = express();
const PORT = 3000;
const GEMINI_MODEL = 'gemini-3.8-flash';

app.use(express.json());

// Lazy / Safe Gemini AI client initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ============================================================
// STUDYAI COACH SYSTEM PROMPT
// ============================================================
export const STUDY_COACH_SYSTEM_PROMPT = `IDENTITY
- You are "StudyAI Coach", a friendly, smart study mentor for college students (Computer Science focus, but able to help with any subject).

TONE
- Warm, natural, encouraging, like a good senior or teacher. Never robotic.

ADAPTIVE RESPONSES (most important)
- Greeting ("hi", "hello", "hey"): reply with a short, friendly greeting and ask how you can help. Max 1-2 sentences. No headings, no lists.
- Casual chat / thanks / small talk: reply naturally and briefly.
- Simple question: give a direct, short answer first, then add detail only if useful.
- Concept explanation: explain simply, then go deeper, with an analogy or example.
- Math / derivations: solve step by step, using LaTeX ($...$ and $$...$$).
- Coding questions: give working code in fenced code blocks with the language tag, then a short explanation and complexity if relevant.
- Study planning: ask for missing details (subjects, exam date, daily hours) before building a plan, then give a clear schedule.
- Vague or unclear question: ask one short clarifying question.
- Never use a fixed template. Use headings, bullets or numbered steps only when the content really needs them.
- Never end every reply with "Recommended Next Actions". Suggest a next step only when it genuinely helps, and keep it to one line.
- Do not repeat the question back or pad the answer.

ACCURACY
- If unsure, say so instead of guessing. Never invent facts.
- Teach, don't just give answers: for homework-style questions, explain the reasoning so the student learns.

FORMAT
- Markdown output. LaTeX for math. Fenced code blocks for code.`;

function buildSystemInstruction(context?: any): string {
  if (!context || !context.user) {
    return STUDY_COACH_SYSTEM_PROMPT;
  }

  const studentName = context.user?.name;
  const studentMajor = context.user?.major;
  const subjects = Array.isArray(context.subjects) && context.subjects.length > 0
    ? context.subjects.map((s: any) => `${s.name}${s.exam_date ? ` (exam: ${s.exam_date})` : ''}`).join(', ')
    : '';

  const contextLines: string[] = [];
  if (studentName) contextLines.push(`- Student Name: ${studentName}${studentMajor ? ` (${studentMajor})` : ''}`);
  if (subjects) contextLines.push(`- Enrolled Subjects (reference only when relevant to study planning or their question): ${subjects}`);

  if (contextLines.length === 0) {
    return STUDY_COACH_SYSTEM_PROMPT;
  }

  return `${STUDY_COACH_SYSTEM_PROMPT}\n\nOPTIONAL STUDENT BACKGROUND (use naturally only when relevant, never recite unprompted):\n${contextLines.join('\n')}`;
}

interface RawHistoryMessage {
  id?: string;
  role: 'user' | 'assistant' | 'model';
  content: string;
}

/**
 * Builds structured multi-turn contents array (last ~20 messages) for the Gemini API.
 */
function buildConversationContents(history: RawHistoryMessage[] = [], currentMessage: string) {
  const cleanedHistory = (Array.isArray(history) ? history : [])
    .filter((msg) => msg && typeof msg.content === 'string' && msg.content.trim().length > 0)
    .filter((msg) => msg.id !== 'msg_welcome') // Exclude static UI welcome card so it doesn't bias output format
    .slice(-20);

  // If the frontend already appended the current user message to the end of `history`, remove the duplicate
  if (
    cleanedHistory.length > 0 &&
    cleanedHistory[cleanedHistory.length - 1].role === 'user' &&
    cleanedHistory[cleanedHistory.length - 1].content.trim() === currentMessage.trim()
  ) {
    cleanedHistory.pop();
  }

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const msg of cleanedHistory) {
    const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';
    const text = msg.content.trim();
    if (!text) continue;

    // Ensure strictly alternating roles if consecutive messages share the same role
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      contents.push({ role, parts: [{ text }] });
    }
  }

  // Gemini requires the first turn in `contents` to be 'user'
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  // Append the current user message
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n${currentMessage.trim()}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: currentMessage.trim() }],
    });
  }

  return contents;
}

/**
 * Generates dynamic follow-up chips ONLY when appropriate.
 * Returns an empty array [] for greetings, small talk, thanks, stress support, or short replies.
 */
function getDynamicSuggestedPrompts(userMessage: string, assistantReply: string): string[] {
  const q = (userMessage || '').trim().toLowerCase();
  const reply = (assistantReply || '').trim();

  // Hide chips for greetings, thanks, identity questions, emotional/stress chat, or short conversational turns
  const casualPattern =
    /^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening|thanks|thank you|thx|ty|ok|okay|cool|got it|awesome|bye|goodbye|who are you|what are you|how are you)[!.?]*$/i;
  const stressPattern = /\b(stressed|anxious|overwhelmed|tired|burnout|burned out|worried|nervous|panicking)\b/i;

  if (casualPattern.test(q) || stressPattern.test(q) || q.length < 6 || reply.length < 220) {
    return [];
  }

  if (/\b(derivative|integral|differentiate|limit|calculus|matrix|eigen|equation|solve|proof)\b/i.test(q)) {
    return [
      'Give me a similar practice problem to try myself',
      'Walk through the intuition behind the key step',
    ];
  }

  if (/\b(python|code|function|algorithm|dp|dynamic programming|lcs|recursion|graph|dijkstra|tree|array|complexity|big-o)\b/i.test(q)) {
    return [
      'Trace this with a small dry-run example',
      'How can we optimize the space complexity?',
    ];
  }

  if (/\b(study plan|schedule|exam|week|hours|timetable|prepare)\b/i.test(q)) {
    return [
      'Adjust this schedule for 2 hours on weekdays and 4 on weekends',
      'Quiz me on my highest-priority subject',
    ];
  }

  if (/\b(explain|what is|how does|concept|difference between)\b/i.test(q)) {
    return [
      'Test my understanding with one quick question',
      'Show a real-world Computer Science example',
    ];
  }

  return [];
}

/**
 * Maps Gemini SDK / network errors into friendly, actionable messages for students.
 */
function formatFriendlyApiError(error: any): { status: number; message: string } {
  const rawMessage = String(error?.message || error || '');
  const status = Number(error?.status || error?.statusCode || 500);

  if (!process.env.GEMINI_API_KEY?.trim() || rawMessage.toLowerCase().includes('api key')) {
    return {
      status: 503,
      message:
        'The Gemini API key is missing or invalid on the server. Please add a valid `GEMINI_API_KEY` in your `.env` file (or the Settings > Secrets panel) and restart the server.',
    };
  }

  if (status === 429 || rawMessage.includes('429') || /quota|rate limit|resource_exhausted/i.test(rawMessage)) {
    return {
      status: 429,
      message:
        "I'm getting a lot of requests right now and hit the Gemini API rate limit. Please wait about 15–30 seconds and try sending your message again!",
    };
  }

  return {
    status: 500,
    message:
      "Sorry, I ran into a temporary issue connecting to the Gemini service. Please try sending your message again in a moment.",
  };
}

// ============================================================
// AI API ROUTES
// ============================================================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY?.trim(),
  });
});

// 2A. Streaming AI Study Coach Endpoint (Server-Sent Events)
app.post('/api/ai/chat/stream', async (req, res) => {
  const { message, history = [], context } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Please enter a message.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    const errInfo = formatFriendlyApiError(new Error('Missing API key'));
    return res.status(errInfo.status).json({ error: errInfo.message });
  }

  // Configure Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const systemInstruction = buildSystemInstruction(context);
    const contents = buildConversationContents(history, message);

    const streamResponse = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    let fullReply = '';

    for await (const chunk of streamResponse) {
      const tokenText = chunk.text || '';
      if (tokenText) {
        fullReply += tokenText;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: tokenText })}\n\n`);
      }
    }

    if (!fullReply.trim()) {
      const fallbackText = "I'm here! Could you rephrase that slightly so I can give you the best answer?";
      fullReply = fallbackText;
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: fallbackText })}\n\n`);
    }

    const suggestedPrompts = getDynamicSuggestedPrompts(message, fullReply);
    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        reply: fullReply,
        suggestedPrompts,
      })}\n\n`
    );
    res.end();
  } catch (error: any) {
    console.error('Error in /api/ai/chat/stream:', error);
    const friendly = formatFriendlyApiError(error);
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: friendly.message,
      })}\n\n`
    );
    res.end();
  }
});

// 2B. Standard JSON AI Study Coach Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history = [], context } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please enter a message.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const errInfo = formatFriendlyApiError(new Error('Missing API key'));
      return res.status(errInfo.status).json({
        error: errInfo.message,
        reply: errInfo.message,
        suggestedPrompts: [],
      });
    }

    const systemInstruction = buildSystemInstruction(context);
    const contents = buildConversationContents(history, message);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const replyText =
      response.text?.trim() ||
      "I'm here! Could you rephrase that slightly so I can help you out?";

    const suggestedPrompts = getDynamicSuggestedPrompts(message, replyText);

    res.json({
      reply: replyText,
      suggestedPrompts,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    const friendly = formatFriendlyApiError(error);
    res.status(friendly.status).json({
      error: friendly.message,
      reply: friendly.message,
      suggestedPrompts: [],
    });
  }
});

// 3. Dynamic AI Study Recommendations
app.post('/api/ai/generate-recommendations', async (req, res) => {
  try {
    const { subjects, tasks, progress, user } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        recommendations: [
          {
            id: Date.now(),
            title: 'Focus on Upcoming High-Priority Deadlines',
            text: `You have ${tasks?.filter((t: any) => t.status !== 'completed').length || 0} pending tasks across ${subjects?.length || 0} subjects. Dedicate high-energy morning hours to core problem sets.`,
            details: 'Try timeboxing 90-minute blocks with 10-minute active walks.',
            category: 'urgent',
            generated_date: new Date().toISOString(),
            action_label: 'View Tasks',
            action_page: 'tasks',
          },
          {
            id: Date.now() + 1,
            title: 'Study Velocity & Recovery',
            text: 'Consistent daily intervals of 2-3 focused hours yield 40% higher long-term retention than weekend cramming.',
            details: 'Track your daily sessions in the Progress Tracker.',
            category: 'strategy',
            generated_date: new Date().toISOString(),
            action_label: 'Log Progress',
            action_page: 'progress',
          },
        ],
      });
    }

    const prompt = `Analyze this student's academic status and generate 3 to 4 personalized, high-value study recommendations:
Student: ${user?.name} (${user?.major || 'STEM'})
Subjects: ${JSON.stringify(subjects?.map((s: any) => ({ name: s.name, exam_date: s.exam_date, priority: s.priority })))}
Pending Tasks: ${JSON.stringify(tasks?.filter((t: any) => t.status !== 'completed').map((t: any) => ({ name: t.task_name, subject: t.subject_id, due: t.due_date, est_hours: t.estimated_hours })))}
Recent Study Logs: ${JSON.stringify((progress || []).slice(-5).map((p: any) => ({ date: p.date, hours: p.hours, topics: p.topics })))}

Return a JSON array of recommendation objects with this schema.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              text: { type: Type.STRING },
              details: { type: Type.STRING },
              category: {
                type: Type.STRING,
                enum: ['urgent', 'strategy', 'praise', 'schedule', 'wellness'],
              },
              action_label: { type: Type.STRING },
              action_page: { type: Type.STRING },
            },
            required: ['title', 'text', 'category'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    const formatted = parsed.map((item: any, idx: number) => ({
      id: Date.now() + idx,
      ...item,
      generated_date: new Date().toISOString(),
    }));

    res.json({ recommendations: formatted });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. AI Study Plan Generator
app.post('/api/ai/generate-plan', async (req, res) => {
  try {
    const { subjectName, examDate, targetHours, syllabus, currentLevel } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        plan: {
          plan_name: `Comprehensive Mastery Plan: ${subjectName}`,
          start_date: new Date().toISOString().split('T')[0],
          end_date: examDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          total_hours: targetHours || 25,
          notes: 'Auto-generated progressive milestone schedule covering foundational theory and active recall practice.',
          daily_breakdown: [
            { day: 1, date: new Date().toISOString().split('T')[0], topic: 'Core Foundations & Definitions', target_hours: 2, completed: false },
            { day: 2, date: new Date(Date.now() + 86400000).toISOString().split('T')[0], topic: 'Key Theorems & Proofs / Paradigms', target_hours: 2.5, completed: false },
            { day: 3, date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], topic: 'Intermediate Problem Solving', target_hours: 3, completed: false },
            { day: 4, date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], topic: 'Practice Exam & Error Analysis', target_hours: 3, completed: false },
          ],
        },
      });
    }

    const prompt = `Create a structured study plan for a university student.
Subject: ${subjectName}
Exam Date: ${examDate || 'In 3 weeks'}
Target Total Study Hours: ${targetHours || 30}
Syllabus / Focus Topics: ${syllabus || 'Core curriculum fundamentals, key problem sets, past exam review'}
Student's Current Mastery Level: ${currentLevel || 'Intermediate'}

Generate a structured plan with 5-8 chronological day milestones covering spaced repetition, problem solving, and mock testing.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plan_name: { type: Type.STRING },
            notes: { type: Type.STRING },
            total_hours: { type: Type.NUMBER },
            daily_breakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  topic: { type: Type.STRING },
                  target_hours: { type: Type.NUMBER },
                  suggested_technique: { type: Type.STRING },
                },
                required: ['day', 'topic', 'target_hours'],
              },
            },
          },
          required: ['plan_name', 'total_hours', 'daily_breakdown'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const today = new Date();
    const formattedBreakdown = (parsed.daily_breakdown || []).map((item: any, i: number) => {
      const d = new Date(today.getTime() + (i * 2 + 1) * 86400000);
      return {
        day: item.day || i + 1,
        date: d.toISOString().split('T')[0],
        topic: item.topic,
        target_hours: item.target_hours || 2,
        completed: false,
      };
    });

    const finalPlan = {
      plan_name: parsed.plan_name || `Study Plan: ${subjectName}`,
      start_date: today.toISOString().split('T')[0],
      end_date: examDate || new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0],
      total_hours: parsed.total_hours || targetHours || 25,
      notes: parsed.notes || 'Curated study roadmap with spaced repetition.',
      daily_breakdown: formattedBreakdown,
    };

    res.json({ plan: finalPlan });
  } catch (error: any) {
    console.error('Error in /api/ai/generate-plan:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. AI Note Summarizer & Key Takeaways
app.post('/api/ai/summarize-note', async (req, res) => {
  try {
    const { title, content, subject } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        summary: `Summary of ${title}: Highlights key theoretical definitions, formulas, and operational techniques in ${subject || 'this course'}.`,
        key_takeaways: [
          'Review the mathematical definitions and boundary conditions',
          'Practice applying the method to edge case problem sets',
          'Use active recall to test memory of key derivations',
        ],
      });
    }

    const prompt = `Analyze this student note:
Title: ${title}
Subject: ${subject || 'General'}
Content:
${content}

Provide:
1. A concise executive summary (2-3 sentences).
2. Exactly 3 to 5 key actionable takeaways / flashcard facts.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            key_takeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['summary', 'key_takeaways'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/summarize-note:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. AI Code Assistant & Reviewer
app.post('/api/ai/code-assist', async (req, res) => {
  try {
    const { code, language, problemTitle, mode } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        analysis: `### Code Analysis (${language})\n\n**Structure**: Code is well organized.\n- **Time Complexity**: Expected $O(N)$ or $O(N \\log N)$\n- **Space Complexity**: $O(N)$ auxiliary\n\n*Tip*: Test with boundary inputs (empty list, single element, negative integers).`,
      });
    }

    const prompt = `Analyze this code snippet written in ${language} for the problem "${problemTitle || 'General Code'}":
Mode requested: ${mode || 'review'}

Code:
\`\`\`${language}
${code}
\`\`\`

Provide:
1. Direct evaluation & correctness check
2. Big-O Time and Space complexity analysis with proof
3. Edge case considerations (null, empty, negative numbers, overflow)
4. Concrete suggestions for optimization or clean architectural improvements.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: 'You are a staff software engineer and competitive programming coach. Be rigorous, crisp, and pedagogical.',
        temperature: 0.4,
      },
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error('Error in /api/ai/code-assist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper for generating dynamic fallback quiz questions
function generateDynamicFallbackQuiz(
  subject: string = 'Computer Science',
  topic: string = 'Core Principles',
  difficulty: string = 'Medium',
  count: number = 4,
  questionType: string = 'mixed'
): any[] {
  const cleanSubject = (subject || 'General STEM').trim();
  const cleanTopic = (topic || 'Core Theory').trim();
  const safeCount = Math.max(1, Math.min(20, Number(count) || 4));

  const sampleBank = [
    {
      type: 'mcq',
      question: `In ${cleanSubject} (${cleanTopic}), what is the primary operational mechanism of this concept under standard boundary conditions?`,
      options: [
        'Iterative relaxation and divide-and-conquer partitioning',
        'Direct constant-time asymptotic hash lookups',
        'State-space pruning via dynamic programming memoization',
        'Greedy local optimization with monotone invariant preservation',
      ],
      correctIndex: 2,
      correctAnswer: 'State-space pruning via dynamic programming memoization',
      acceptableAnswers: ['dynamic programming', 'memoization', 'pruning'],
      explanation: `In ${cleanTopic}, breaking problems down into overlapping subproblems and memoizing states allows reducing exponential complexity to polynomial time.`,
      hint: 'Think about how caching previously computed subproblems saves redundant computations.',
      topic: cleanTopic,
    },
    {
      type: 'true_false',
      question: `True or False: In ${cleanSubject}, applying ${cleanTopic} always guarantees monotonic convergence without requiring non-negative edge or state costs.`,
      options: ['True', 'False'],
      correctIndex: 1,
      correctAnswer: 'False',
      acceptableAnswers: ['false', 'f'],
      explanation: `False. Most standard greedy and relaxation algorithms in ${cleanTopic} require non-negative cost assumptions (e.g. Dijkstra requires non-negative weights).`,
      hint: 'Consider whether negative weights or edge cycles break the invariant.',
      topic: cleanTopic,
    },
    {
      type: 'short_answer',
      question: `What is the tight asymptotic time complexity (Big-O notation) of optimal search or traversal in ${cleanTopic}?`,
      options: [],
      correctAnswer: 'O(log N)',
      acceptableAnswers: ['O(log n)', 'O(logn)', 'log n', 'O(N log N)', 'O(N)', 'linearithmic', 'logarithmic'],
      explanation: `Binary partition methods in ${cleanTopic} divide the search space in half at each step, yielding logarithmic $O(\\log N)$ time.`,
      hint: 'State the complexity using standard Big-O notation, e.g. O(log N) or O(N).',
      topic: cleanTopic,
    },
    {
      type: 'fill_blank',
      question: `In ${cleanSubject}, the principle that guarantees a transaction or process completes entirely or leaves state unchanged is called ________.`,
      options: [],
      correctAnswer: 'Atomicity',
      acceptableAnswers: ['atomicity', 'atomic', 'all or nothing'],
      explanation: 'Atomicity (the A in ACID properties) enforces all-or-nothing execution guarantees.',
      hint: 'The term starts with the letter A.',
      topic: cleanTopic,
    },
    {
      type: 'mcq',
      question: `Which data structure provides optimal worst-case amortized performance for priority operations in ${cleanTopic}?`,
      options: ['Binary Search Tree (Unbalanced)', 'Binary Min-Heap', 'Singly Linked List', 'Static Array'],
      correctIndex: 1,
      correctAnswer: 'Binary Min-Heap',
      acceptableAnswers: ['binary min-heap', 'min-heap', 'heap', 'priority queue'],
      explanation: 'A Binary Min-Heap supports $O(1)$ peek minimum and $O(\\log N)$ insertion and extraction.',
      hint: 'It is a complete binary tree satisfying the heap-order property.',
      topic: cleanTopic,
    },
    {
      type: 'mcq',
      question: `What is the key advantage of active recall over passive re-reading in ${cleanSubject}?`,
      options: [
        'Strengthens neural retrieval pathways and long-term consolidation',
        'Requires zero cognitive effort during study sessions',
        'Guarantees immediate 100% test scores without review',
        'Replaces the need for understanding conceptual fundamentals',
      ],
      correctIndex: 0,
      correctAnswer: 'Strengthens neural retrieval pathways and long-term consolidation',
      acceptableAnswers: ['strengthens retrieval pathways', 'retrieval practice'],
      explanation: 'Testing memory forces the brain to retrieve information, strengthening synaptic connections far more than passive re-reading.',
      hint: 'Focus on how the testing effect enhances long-term retention.',
      topic: 'Cognitive Science',
    },
  ];

  const results = [];
  for (let i = 0; i < safeCount; i++) {
    const template = sampleBank[i % sampleBank.length];
    let type = template.type;
    if (questionType === 'mcq') type = 'mcq';
    else if (questionType === 'true_false') type = 'true_false';
    else if (questionType === 'short_answer') type = 'short_answer';
    else if (questionType === 'fill_blank') type = 'fill_blank';

    let options = template.options;
    let correctIndex = template.correctIndex;
    if (type === 'true_false') {
      options = ['True', 'False'];
      correctIndex = i % 2 === 0 ? 0 : 1;
    } else if (type === 'short_answer' || type === 'fill_blank') {
      options = [];
    } else if (type === 'mcq' && (!options || options.length < 4)) {
      options = [
        `Option A: Primary ${cleanTopic} configuration`,
        `Option B: Secondary ${cleanTopic} invariant`,
        `Option C: Asymptotic relaxation method`,
        `Option D: None of the above`,
      ];
      correctIndex = 0;
    }

    results.push({
      id: `q_${Date.now()}_${i + 1}`,
      type,
      question: `[${cleanSubject} - ${cleanTopic} Q${i + 1}] ${template.question}`,
      options,
      correctIndex,
      correctAnswer: template.correctAnswer,
      acceptableAnswers: template.acceptableAnswers,
      explanation: template.explanation,
      hint: template.hint,
      topic: cleanTopic,
    });
  }

  return results;
}

// 7. Interactive Dynamic Quiz Generator (/api/quiz/generate & /api/ai/generate-quiz)
const handleQuizGeneration = async (req: express.Request, res: express.Response) => {
  try {
    const { subject, topic, difficulty = 'Medium', questionCount = 5, questionType = 'mixed' } = req.body;
    const cleanCount = Math.max(1, Math.min(20, parseInt(questionCount, 10) || 5));
    const cleanSubject = subject || 'Computer Science';
    const cleanTopic = topic || 'Core Principles';
    const cleanDifficulty = difficulty || 'Medium';
    const cleanType = questionType || 'mixed';

    const ai = getGeminiClient();

    if (!ai) {
      const fallbackQuestions = generateDynamicFallbackQuiz(cleanSubject, cleanTopic, cleanDifficulty, cleanCount, cleanType);
      return res.json({ questions: fallbackQuestions });
    }

    const typeGuidance = cleanType === 'mcq'
      ? 'All questions MUST be multiple choice (type: "mcq") with exactly 4 distinct options.'
      : cleanType === 'true_false'
      ? 'All questions MUST be True/False (type: "true_false") with options: ["True", "False"].'
      : cleanType === 'short_answer'
      ? 'All questions MUST be short answer (type: "short_answer") requiring a concise 1-3 word or formula answer with no multiple-choice options.'
      : cleanType === 'fill_blank'
      ? 'All questions MUST be fill-in-the-blank (type: "fill_blank") with a "________" blank requiring an exact term.'
      : 'Generate a rich balanced mix of "mcq", "true_false", and "short_answer" / "fill_blank" questions.';

    const prompt = `Generate exactly ${cleanCount} rigorous, high-yield active recall quiz questions for a university student.

SUBJECT: ${cleanSubject}
SPECIFIC TOPIC: ${cleanTopic}
DIFFICULTY LEVEL: ${cleanDifficulty} (Adjust depth, edge cases, and rigor accordingly)
QUESTION FORMAT REQUIREMENT: ${typeGuidance}

DETAILED SPECIFICATIONS:
1. Every question must test deep conceptual understanding, analytical derivation, or problem-solving application—NOT superficial trivia.
2. For "mcq" questions: provide exactly 4 realistic, challenging options. The "correctIndex" is the 0-based index of the correct answer.
3. For "true_false" questions: options MUST be ["True", "False"]. "correctIndex" is 0 for True, 1 for False.
4. For "short_answer" and "fill_blank" questions: options should be empty []. "correctAnswer" MUST contain the canonical expected term/formula, and "acceptableAnswers" should list common valid synonyms, acronyms, or case variations (e.g. ["O(N log N)", "O(n log n)", "linearithmic"]).
5. Provide a rich, pedagogical "explanation" (2-4 sentences) explaining WHY the answer is correct and WHY common misconceptions fail.
6. Provide a concise 1-sentence "hint".`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: {
                type: Type.STRING,
                enum: ['mcq', 'true_false', 'short_answer', 'fill_blank'],
              },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctIndex: { type: Type.INTEGER },
              correctAnswer: { type: Type.STRING },
              acceptableAnswers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              explanation: { type: Type.STRING },
              hint: { type: Type.STRING },
              topic: { type: Type.STRING },
            },
            required: ['question', 'type', 'explanation'],
          },
        },
      },
    });

    let parsed = JSON.parse(response.text || '[]');
    if (!Array.isArray(parsed) || parsed.length === 0) {
      parsed = generateDynamicFallbackQuiz(cleanSubject, cleanTopic, cleanDifficulty, cleanCount, cleanType);
    }

    const formatted = parsed.map((q: any, i: number) => ({
      id: q.id || `q_${Date.now()}_${i + 1}`,
      type: q.type || (q.options && q.options.length > 0 ? (q.options.length === 2 ? 'true_false' : 'mcq') : 'short_answer'),
      question: q.question,
      options: q.options || (q.type === 'true_false' ? ['True', 'False'] : []),
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      correctAnswer: q.correctAnswer || (q.options && typeof q.correctIndex === 'number' ? q.options[q.correctIndex] : ''),
      acceptableAnswers: q.acceptableAnswers || [],
      explanation: q.explanation || 'Review the core definitions and theorems for this topic.',
      hint: q.hint || `Focus on fundamental principles of ${cleanTopic}.`,
      topic: q.topic || cleanTopic,
    }));

    res.json({ questions: formatted });
  } catch (error: any) {
    console.error('Error in quiz generation:', error);
    const fallback = generateDynamicFallbackQuiz(
      req.body?.subject,
      req.body?.topic,
      req.body?.difficulty,
      req.body?.questionCount,
      req.body?.questionType
    );
    res.json({ questions: fallback });
  }
};

app.post('/api/quiz/generate', handleQuizGeneration);
app.post('/api/ai/generate-quiz', handleQuizGeneration);

// 8. Quiz Answer Evaluation for Short Answers
app.post('/api/quiz/evaluate-answer', async (req, res) => {
  try {
    const { question, userAnswer, correctAnswer, acceptableAnswers = [] } = req.body;
    const cleanUser = (userAnswer || '').trim().toLowerCase();
    const cleanCorrect = (correctAnswer || '').trim().toLowerCase();

    if (!cleanUser) {
      return res.json({ isCorrect: false, feedback: 'No answer provided.', score: 0 });
    }

    const allValid = [cleanCorrect, ...(acceptableAnswers || []).map((a: string) => a.trim().toLowerCase())];
    const isExactMatch = allValid.some((v) => cleanUser === v || cleanUser.includes(v) || v.includes(cleanUser));

    if (isExactMatch) {
      return res.json({ isCorrect: true, feedback: 'Accurate answer! Full marks awarded.', score: 1 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        isCorrect: false,
        feedback: `Expected: "${correctAnswer}". Your answer was "${userAnswer}".`,
        score: 0,
      });
    }

    const prompt = `Evaluate if the student's answer to this question is conceptually correct:
Question: ${question}
Expected Answer: ${correctAnswer}
Acceptable Variations: ${allValid.join(', ')}
Student's Answer: ${userAnswer}

Respond with JSON: {"isCorrect": boolean, "feedback": "brief 1-sentence evaluation"}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"isCorrect": false, "feedback": "Incorrect"}');
    res.json({
      isCorrect: !!parsed.isCorrect,
      feedback: parsed.feedback || (parsed.isCorrect ? 'Correct!' : `Expected: "${correctAnswer}"`),
      score: parsed.isCorrect ? 1 : 0,
    });
  } catch (err: any) {
    res.json({ isCorrect: false, feedback: `Evaluation completed.`, score: 0 });
  }
});

// ============================================================
// REAL PYTHON 3.12 EXECUTION & COMPILER API
// ============================================================

app.get('/api/python/version', (req, res) => {
  try {
    const version = getPythonVersion();
    res.json({
      success: true,
      python_version: version,
      runtime: 'CPython',
      platform: process.platform,
      arch: process.arch,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/python/execute', async (req, res) => {
  try {
    const { code, input = '', timeout = 5000, filename = 'main.py' } = req.body;

    if (typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        stdout: '',
        stderr: 'BadRequest: "code" string is required.',
        exit_code: 1,
        execution_time: 0,
        python_version: getPythonVersion(),
        timed_out: false,
      });
    }

    const result = await runPythonCode(code, input, Math.min(10000, Math.max(1000, timeout)), filename);
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/python/execute:', error);
    res.status(500).json({
      success: false,
      stdout: '',
      stderr: `Server Execution Error: ${error.message}`,
      exit_code: 1,
      execution_time: 0,
      python_version: getPythonVersion(),
      timed_out: false,
    });
  }
});

app.post('/api/python/format', async (req, res) => {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }
    const result = await formatPythonCode(code);
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/python/format:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/python/ai-debug', async (req, res) => {
  try {
    const { code, error, filename = 'main.py' } = req.body;
    const ai = getGeminiClient();

    const diagnosis = await explainAndFixPythonError(ai, code || '', error || '', filename);
    res.json(diagnosis);
  } catch (err: any) {
    console.error('Error in /api/python/ai-debug:', err);
    res.status(500).json({
      errorType: 'DiagnosisError',
      lineNumber: null,
      explanation: err.message,
      suggestedFix: 'Check syntax and review line by line.',
      correctedCode: req.body.code || '',
    });
  }
});

// ============================================================
// VITE DEV / PRODUCTION MIDDLEWARE
// ============================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Study Planner server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();

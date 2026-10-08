import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Flag,
  Lightbulb,
  TrendingUp,
  Flame,
  Zap,
  ListOrdered,
  Check,
  AlertTriangle,
  Play,
  Plus,
  BarChart3,
  Bot,
} from 'lucide-react';
import {
  Subject,
  QuizQuestion,
  QuizDifficulty,
  QuizQuestionType,
  QuizSessionResult,
  QuizUserAnswer,
  User,
} from '../types';

interface ActiveRecallQuizProps {
  user: User;
  subjects: Subject[];
  initialSubject?: string;
  initialTopic?: string;
  weakTopics?: string[];
  onAddWeakTopic?: (topic: string) => void;
  onRemoveWeakTopic?: (topic: string) => void;
  quizHistory: QuizSessionResult[];
  onSaveQuizResult: (result: QuizSessionResult) => void;
  onLogStudyProgress?: (log: { subject_id: number | null; hours: number; topics: string; notes: string }) => void;
  onNavigateToCoachWithPrompt?: (prompt: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ActiveRecallQuiz: React.FC<ActiveRecallQuizProps> = ({
  user,
  subjects,
  initialSubject,
  initialTopic,
  weakTopics = [],
  onAddWeakTopic,
  onRemoveWeakTopic,
  quizHistory = [],
  onSaveQuizResult,
  onLogStudyProgress,
  onNavigateToCoachWithPrompt,
  onShowToast,
}) => {
  // Quiz View Phase: 'setup' | 'taking' | 'results'
  const [phase, setPhase] = useState<'setup' | 'taking' | 'results'>('setup');

  // Setup State
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubject || subjects[0]?.name || 'Computer Science'
  );
  const [customSubject, setCustomSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>(
    initialTopic || 'Dynamic Programming & Graph Algorithms'
  );
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<QuizQuestionType>('mixed');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Quiz State
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, QuizUserAnswer>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<boolean>(false);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Results State
  const [latestResult, setLatestResult] = useState<QuizSessionResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct'>('all');
  const [isLoggingProgress, setIsLoggingProgress] = useState(false);

  // Update initial subject/topic if props change
  useEffect(() => {
    if (initialSubject) setSelectedSubject(initialSubject);
    if (initialTopic) setSelectedTopic(initialTopic);
  }, [initialSubject, initialTopic]);

  // Live Timer during test-taking
  useEffect(() => {
    if (phase === 'taking') {
      setTimeElapsed(0);
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Topic suggestions based on chosen subject
  const getSubjectTopicSuggestions = (subj: string) => {
    const s = subj.toLowerCase();
    if (s.includes('cs') || s.includes('computer') || s.includes('data') || s.includes('algo')) {
      return [
        'Binary Search Trees & AVL Balancing',
        'Dynamic Programming Memoization',
        'Dijkstra & Shortest Path Trees',
        'B+ Trees & Database Indexing',
        'OS Virtual Memory & Page Replacement',
      ];
    }
    if (s.includes('math') || s.includes('calculus') || s.includes('linear')) {
      return [
        'Eigenvalues and Diagonalization',
        'Multivariable Chain Rule & Gradients',
        'Integration by Parts & Substitution',
        'Bayes Theorem and Conditional Probability',
      ];
    }
    if (s.includes('physic') || s.includes('mechanic')) {
      return [
        'Rotational Dynamics & Angular Momentum',
        'Maxwell Equations & Wave Propagation',
        'Thermodynamic Heat Engines & Carnot Cycle',
      ];
    }
    return [
      'Core Theoretical Foundations',
      'Key Formulae and Derivations',
      'Analytical Problem Solving & Edge Cases',
    ];
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Start / Generate Quiz
  const handleGenerateQuiz = async (
    customParams?: { subject?: string; topic?: string; difficulty?: QuizDifficulty; count?: number; type?: QuizQuestionType }
  ) => {
    const subj = customParams?.subject || (selectedSubject === 'custom' ? customSubject : selectedSubject) || 'General STEM';
    const top = customParams?.topic || selectedTopic || 'Core Principles';
    const diff = customParams?.difficulty || difficulty;
    const cnt = customParams?.count || questionCount;
    const qType = customParams?.type || questionType;

    if (!top.trim()) {
      onShowToast('Please enter a specific topic or chapter name', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subj,
          topic: top,
          difficulty: diff,
          questionCount: cnt,
          questionType: qType,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate quiz');

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions returned');
      }

      setActiveQuestions(data.questions);
      setCurrentIndex(0);
      setUserAnswers({});
      setFlaggedQuestions({});
      setShowHint(false);
      setPhase('taking');
      onShowToast(`Generated ${data.questions.length} active recall questions!`, 'success');
    } catch (err: any) {
      console.error('Quiz generator error:', err);
      onShowToast('Could not reach AI generator, using smart fallback', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  // Record answer for current question
  const handleSelectMCQ = (optionIndex: number) => {
    const currentQ = activeQuestions[currentIndex];
    if (!currentQ) return;

    const isCorrect = optionIndex === currentQ.correctIndex;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        selectedOptionIndex: optionIndex,
        textAnswer: currentQ.options ? currentQ.options[optionIndex] : '',
        isCorrect,
        score: isCorrect ? 1 : 0,
      },
    }));
  };

  const handleSelectTrueFalse = (boolVal: boolean) => {
    const currentQ = activeQuestions[currentIndex];
    if (!currentQ) return;

    const chosenIdx = boolVal ? 0 : 1;
    const isCorrect = chosenIdx === currentQ.correctIndex;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        selectedOptionIndex: chosenIdx,
        textAnswer: boolVal ? 'True' : 'False',
        isCorrect,
        score: isCorrect ? 1 : 0,
      },
    }));
  };

  const handleTextAnswerChange = (val: string) => {
    const currentQ = activeQuestions[currentIndex];
    if (!currentQ) return;

    const cleanInput = val.trim().toLowerCase();
    const cleanCorrect = (currentQ.correctAnswer || '').trim().toLowerCase();
    const acceptable = (currentQ.acceptableAnswers || []).map((a) => a.trim().toLowerCase());

    const isCorrect =
      cleanInput.length > 0 &&
      (cleanInput === cleanCorrect ||
        acceptable.includes(cleanInput) ||
        (cleanCorrect.length > 3 && cleanInput.includes(cleanCorrect)));

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        textAnswer: val,
        isCorrect,
        score: isCorrect ? 1 : 0,
      },
    }));
  };

  const toggleFlagCurrent = () => {
    const currentQ = activeQuestions[currentIndex];
    if (!currentQ) return;
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  // Submit and Calculate Result
  const handleSubmitQuiz = () => {
    const total = activeQuestions.length;
    let correctCount = 0;
    const finalAnswers: Record<string, QuizUserAnswer> = {};
    const weakTopicsList: string[] = [];

    activeQuestions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (ans && ans.isCorrect) {
        correctCount += 1;
        finalAnswers[q.id] = ans;
      } else {
        finalAnswers[q.id] = ans || {
          questionId: q.id,
          isCorrect: false,
          score: 0,
          textAnswer: 'Unanswered',
        };
        if (q.topic && !weakTopicsList.includes(q.topic)) {
          weakTopicsList.push(q.topic);
        }
      }
    });

    const percentage = Math.round((correctCount / total) * 100);
    const resultObj: QuizSessionResult = {
      id: `quiz_${Date.now()}`,
      timestamp: new Date().toISOString(),
      subject: selectedSubject === 'custom' ? customSubject : selectedSubject,
      topic: selectedTopic,
      difficulty,
      questionType,
      totalQuestions: total,
      score: correctCount,
      percentage,
      timeSpentSeconds: timeElapsed,
      questions: activeQuestions,
      userAnswers: finalAnswers,
      weakTopicsIdentified: weakTopicsList,
    };

    setLatestResult(resultObj);
    onSaveQuizResult(resultObj);
    setPhase('results');

    // Trigger celebration confetti if score is >= 80%
    if (percentage >= 80) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onShowToast(`Outstanding performance! You scored ${correctCount}/${total} (${percentage}%) 🎉`, 'success');
    } else {
      onShowToast(`Quiz completed! You scored ${correctCount}/${total} (${percentage}%)`, 'info');
    }
  };

  // Log study session from quiz results
  const handleLogResultToProgress = () => {
    if (!latestResult || !onLogStudyProgress) return;
    setIsLoggingProgress(true);
    const targetSubject = subjects.find(
      (s) => s.name.toLowerCase() === latestResult.subject.toLowerCase()
    );

    const hours = Number((Math.max(1, latestResult.timeSpentSeconds) / 3600).toFixed(2));
    onLogStudyProgress({
      subject_id: targetSubject ? targetSubject.id : null,
      hours: Math.max(0.25, hours),
      topics: `Active Recall Quiz: ${latestResult.topic} (${latestResult.score}/${latestResult.totalQuestions} - ${latestResult.percentage}%)`,
      notes: `Tested on ${latestResult.totalQuestions} questions with difficulty ${latestResult.difficulty}. Time taken: ${formatTime(latestResult.timeSpentSeconds)}.`,
    });

    onShowToast('Saved session to Progress Analytics!', 'success');
    setIsLoggingProgress(false);
  };

  // Ask AI coach to explain
  const handleAskCoachAboutQuestion = (q: QuizQuestion) => {
    if (!onNavigateToCoachWithPrompt) return;
    const prompt = `Can you explain why the correct answer to this question is "${q.correctAnswer || (q.options && typeof q.correctIndex === 'number' ? q.options[q.correctIndex] : '')}"?\n\nQuestion: ${q.question}\n\nPlease break down the concept step by step and explain why my previous attempt failed.`;
    onNavigateToCoachWithPrompt(prompt);
  };

  const currentQ = activeQuestions[currentIndex];
  const currentAnswer = currentQ ? userAnswers[currentQ.id] : undefined;
  const isFlagged = currentQ ? !!flaggedQuestions[currentQ.id] : false;
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          PHASE 1: QUIZ SETUP & CONFIGURATION PANEL
      ========================================================================= */}
      {phase === 'setup' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-10 h-10 rounded-xl ai-gradient flex items-center justify-center text-white vibrant-shadow-sm">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-[#0F172A] text-lg tracking-tight">Active Recall Quiz Studio</h2>
                      <span className="text-xs font-semibold text-[#06B6D4]">
                        · AI Generator
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] font-medium">
                      Configure your subject, topic, question count, and difficulty to test long-term retention.
                    </p>
                  </div>
                </div>
              </div>

              {quizHistory.length > 0 && (
                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2 text-xs tabular-nums">
                  <Award className="w-4 h-4 text-[#7C3AED]" />
                  <div>
                    <span className="font-bold text-[#0F172A]">{quizHistory.length} Quizzes Taken</span>
                    <span className="text-[#3B82F6] font-semibold block text-[11px]">
                      Avg Score: {Math.round(quizHistory.reduce((s, q) => s + q.percentage, 0) / quizHistory.length)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Weak Topics Alert Banner */}
          {weakTopics.length > 0 && (
            <div className="bg-amber-50/70 border border-[#F59E0B]/40 rounded-2xl p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                      Targeted Spaced Repetition on Identified Weak Topics
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {weakTopics.map((topic, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedTopic(topic);
                            onShowToast(`Selected "${topic}" for quiz`, 'info');
                          }}
                          className="text-[11px] font-semibold bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#F59E0B]/40 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateQuiz({ topic: weakTopics[0], difficulty: 'Medium', count: 5 })}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Launch Weak Topics Quiz
                </button>
              </div>
            </div>
          )}

          {/* Setup Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E5E7EB] space-y-5">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                Configure Quiz Parameters
              </h3>

              {/* 1. Subject Selector */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-2">
                  1. Target Subject
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {subjects.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubject(sub.name)}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedSubject === sub.name
                          ? 'border-[#7C3AED] bg-[#F5F3FF] text-[#0F172A] font-bold'
                          : 'border-[#E5E7EB] hover:border-[#7C3AED]/40 text-[#0F172A] bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{sub.name}</div>
                      <div className="text-[10px] text-[#64748B] font-medium capitalize mt-0.5">{sub.priority} priority</div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedSubject('custom')}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedSubject === 'custom'
                        ? 'border-[#7C3AED] bg-[#F5F3FF] text-[#0F172A] font-bold'
                        : 'border-[#E5E7EB] hover:border-[#7C3AED]/40 text-[#0F172A] bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold">Custom Subject...</div>
                    <div className="text-[10px] text-[#64748B] font-medium mt-0.5">Type any topic</div>
                  </button>
                </div>

                {selectedSubject === 'custom' && (
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g. Organic Chemistry, Microeconomics, Quantum Physics"
                    className="mt-2.5 w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]"
                  />
                )}
              </div>

              {/* 2. Specific Topic / Chapter */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                  2. Specific Topic / Subtopic / Chapter
                </label>
                <input
                  type="text"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  placeholder="e.g. Binary Search Trees, Matrix Multiplication, Neural Networks"
                  className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]"
                />

                {/* Topic Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] font-semibold text-[#64748B] self-center">
                    Suggestions:
                  </span>
                  {getSubjectTopicSuggestions(selectedSubject).map((sugg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTopic(sugg)}
                      className="text-[11px] bg-[#F8FAFC] hover:bg-[#F5F3FF] text-[#0F172A] hover:text-[#7C3AED] border border-[#E5E7EB] px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Question Count & Difficulty & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Question Count */}
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-2">
                    Question Count
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[2, 3, 5, 10, 15].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer tabular-nums ${
                          questionCount === cnt
                            ? 'bg-[#7C3AED] text-white'
                            : 'bg-[#F8FAFC] border border-[#E5E7EB] hover:bg-slate-100 text-[#0F172A]'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex items-center gap-1.5">
                    {(['Easy', 'Medium', 'Hard', 'Master'] as QuizDifficulty[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          difficulty === lvl
                            ? 'bg-[#7C3AED] text-white'
                            : 'bg-[#F8FAFC] border border-[#E5E7EB] hover:bg-slate-100 text-[#0F172A]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Format Type */}
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-2">
                    Question Format
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as QuizQuestionType)}
                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    <option value="mixed">Mixed Blend (MCQ + T/F + Short)</option>
                    <option value="mcq">Multiple Choice (4 Options)</option>
                    <option value="true_false">True / False Invariants</option>
                    <option value="short_answer">Short Answer / Formulae</option>
                    <option value="fill_blank">Fill in the Blank</option>
                  </select>
                </div>
              </div>

              {/* Launch Button */}
              <div className="pt-3">
                <button
                  onClick={() => handleGenerateQuiz()}
                  disabled={isGenerating}
                  className="w-full py-3.5 rounded-xl ai-gradient text-white font-bold text-sm hover:opacity-95 transition-all vibrant-shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-white" />
                      Generating Rigorous Practice Questions...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Generate {questionCount} Active Recall Questions ({difficulty})
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Past Attempts & Analytics Column */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] space-y-4">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#3B82F6]" />
                  Recent Quiz Performance
                </span>
                <span className="text-[11px] text-[#64748B] font-medium">History</span>
              </h3>

              {quizHistory.length === 0 ? (
                <div className="text-center py-8 text-[#64748B]">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 text-[#64748B]/40" />
                  <p className="text-xs font-semibold text-[#0F172A]">No quiz attempts yet</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Generate your first quiz to start tracking retention!</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {quizHistory.slice(0, 5).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] hover:border-[#7C3AED]/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#0F172A] truncate">{attempt.topic}</h4>
                          <span className="text-[10px] text-[#64748B] font-medium block tabular-nums">
                            {attempt.subject} · {new Date(attempt.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-extrabold tabular-nums ${
                            attempt.percentage >= 80
                              ? 'text-[#10B981]'
                              : attempt.percentage >= 60
                              ? 'text-[#F59E0B]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E5E7EB] text-[11px] tabular-nums">
                        <span className="text-[#64748B]">{formatTime(attempt.timeSpentSeconds)}</span>
                        <button
                          onClick={() => {
                            setActiveQuestions(attempt.questions);
                            setUserAnswers({});
                            setFlaggedQuestions({});
                            setCurrentIndex(0);
                            setPhase('taking');
                            onShowToast(`Retaking quiz on "${attempt.topic}"`, 'info');
                          }}
                          className="font-bold text-[#7C3AED] hover:text-[#5B21B6] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Retake
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 2: ACTIVE TEST-TAKING EXPERIENCE
      ========================================================================= */}
      {phase === 'taking' && currentQ && (
        <div className="space-y-5 max-w-4xl mx-auto">
          {/* Top Test Header Bar */}
          <div className="bg-white rounded-3xl p-4 md:p-5 border border-violet-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPhase('setup')}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Exit Quiz"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{selectedTopic}</h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {selectedSubject === 'custom' ? customSubject : selectedSubject} • {difficulty} Level
                </span>
              </div>
            </div>

            {/* Timer & Question Progress Matrix */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-900 border border-violet-100 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
                <span>{formatTime(timeElapsed)}</span>
              </div>

              <button
                onClick={toggleFlagCurrent}
                className={`p-2 rounded-xl border transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                  isFlagged
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
                title="Flag question for review"
              >
                <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-600 text-amber-600' : ''}`} />
                <span className="hidden sm:inline">{isFlagged ? 'Flagged' : 'Flag'}</span>
              </button>
            </div>
          </div>

          {/* Question Index Progress Navigation Bar */}
          <div className="bg-white rounded-2xl p-3 border border-violet-100 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {activeQuestions.map((q, idx) => {
                const isAnswered = !!userAnswers[q.id];
                const isCurrent = idx === currentIndex;
                const isQFlagged = !!flaggedQuestions[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowHint(false);
                    }}
                    className={`relative w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'vibrant-gradient text-white shadow-xs scale-105'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                    {isQFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-semibold text-slate-500 shrink-0">
              Answered <span className="font-bold text-violet-700">{answeredCount}</span> of {activeQuestions.length}
            </div>
          </div>

          {/* Primary Question Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-violet-100 shadow-sm space-y-6">
            {/* Question Header Meta */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800">
                Question {currentIndex + 1} of {activeQuestions.length}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                {currentQ.type === 'mcq'
                  ? 'Multiple Choice'
                  : currentQ.type === 'true_false'
                  ? 'True / False'
                  : currentQ.type === 'fill_blank'
                  ? 'Fill in Blank'
                  : 'Short Answer'}
              </span>
            </div>

            {/* Question Text */}
            <div className="prose prose-sm max-w-none text-slate-900 font-semibold text-base leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentQ.question}</ReactMarkdown>
            </div>

            {/* Interactive Response Controls */}
            {currentQ.type === 'mcq' && currentQ.options && (
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = currentAnswer?.selectedOptionIndex === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectMCQ(optIdx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/90 text-violet-950 font-bold shadow-xs'
                          : 'border-slate-200/90 hover:border-violet-300 hover:bg-slate-50/80 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectTrueFalse(true)}
                  className={`p-6 rounded-2xl border text-center transition-all cursor-pointer ${
                    currentAnswer?.selectedOptionIndex === 0
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span className="block text-xl font-black mb-1">True</span>
                  <span className="text-xs text-slate-500 font-medium">Statement is theoretically sound</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTrueFalse(false)}
                  className={`p-6 rounded-2xl border text-center transition-all cursor-pointer ${
                    currentAnswer?.selectedOptionIndex === 1
                      ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-rose-300 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span className="block text-xl font-black mb-1">False</span>
                  <span className="text-xs text-slate-500 font-medium">Violates boundary or cost invariants</span>
                </button>
              </div>
            )}

            {(currentQ.type === 'short_answer' || currentQ.type === 'fill_blank') && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Answer:
                </label>
                <input
                  type="text"
                  value={currentAnswer?.textAnswer || ''}
                  onChange={(e) => handleTextAnswerChange(e.target.value)}
                  placeholder="Type your concise answer or formula..."
                  className="w-full bg-slate-50 border border-violet-200 rounded-2xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-violet-500/20"
                />
                <p className="text-[11px] text-slate-400">
                  Tip: Standard Big-O notations, scientific terms, and common synonyms are accepted.
                </p>
              </div>
            )}

            {/* Expandable Hint Section */}
            {currentQ.hint && (
              <div className="pt-2">
                {showHint ? (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5 animate-fade-in">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Hint:</span>
                      <p>{currentQ.hint}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-700 font-semibold cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    Need a hint?
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Test Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                  setShowHint(false);
                }
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            {currentIndex < activeQuestions.length - 1 ? (
              <button
                onClick={() => {
                  setCurrentIndex(currentIndex + 1);
                  setShowHint(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                Next Question <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="px-6 py-2.5 rounded-xl vibrant-gradient text-white font-bold text-xs vibrant-shadow transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Finish & Submit Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 3: COMPREHENSIVE QUIZ RESULTS & DEEP REVIEW
      ========================================================================= */}
      {phase === 'results' && latestResult && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Hero Score Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-violet-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2 ${
                    latestResult.percentage >= 80
                      ? 'bg-emerald-100 text-emerald-800'
                      : latestResult.percentage >= 60
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  {latestResult.percentage >= 90
                    ? 'Mastery Level (90%+)'
                    : latestResult.percentage >= 70
                    ? 'Proficient Level (70-89%)'
                    : 'Needs Focused Review'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {latestResult.percentage >= 80
                    ? 'Great Retrieval Recall!'
                    : 'Study Session Completed!'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {latestResult.topic} • {latestResult.subject} ({latestResult.difficulty} Difficulty)
                </p>
              </div>

              {/* Large Score Metric */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-black text-violet-700 tracking-tight">
                    {latestResult.score}/{latestResult.totalQuestions}
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    {latestResult.percentage}% Correct
                  </div>
                </div>

                <div className="h-10 w-px bg-slate-200" />

                <div className="text-center">
                  <div className="text-2xl font-black text-slate-800">
                    {formatTime(latestResult.timeSpentSeconds)}
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Time Taken
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveQuestions(latestResult.questions);
                  setUserAnswers({});
                  setFlaggedQuestions({});
                  setCurrentIndex(0);
                  setPhase('taking');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake This Quiz
              </button>

              <button
                onClick={() => setPhase('setup')}
                className="px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-900 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-violet-600" /> New Quiz Setup
              </button>

              {onLogStudyProgress && (
                <button
                  onClick={handleLogResultToProgress}
                  disabled={isLoggingProgress}
                  className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Save to Progress Analytics
                </button>
              )}

              {latestResult.weakTopicsIdentified && latestResult.weakTopicsIdentified.length > 0 && onAddWeakTopic && (
                <button
                  onClick={() => {
                    latestResult.weakTopicsIdentified?.forEach((t) => onAddWeakTopic(t));
                    onShowToast('Added missed topics to your Weak Topics list!', 'success');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  Log Weak Topics
                </button>
              )}
            </div>
          </div>

          {/* Question Breakdown Filter Tabs */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  reviewFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Questions ({latestResult.totalQuestions})
              </button>
              <button
                onClick={() => setReviewFilter('incorrect')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  reviewFilter === 'incorrect'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                }`}
              >
                Missed / Incorrect ({latestResult.totalQuestions - latestResult.score})
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  reviewFilter === 'correct'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                Correct ({latestResult.score})
              </button>
            </div>
          </div>

          {/* Detailed Question Review Cards */}
          <div className="space-y-4">
            {latestResult.questions
              .filter((q) => {
                const isCorrect = latestResult.userAnswers[q.id]?.isCorrect;
                if (reviewFilter === 'incorrect') return !isCorrect;
                if (reviewFilter === 'correct') return isCorrect;
                return true;
              })
              .map((q, idx) => {
                const userAns = latestResult.userAnswers[q.id];
                const isCorrect = !!userAns?.isCorrect;
                const correctOptionStr =
                  q.correctAnswer || (q.options && typeof q.correctIndex === 'number' ? q.options[q.correctIndex] : '');

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-3xl p-6 border shadow-2xs space-y-4 ${
                      isCorrect ? 'border-emerald-200' : 'border-rose-200'
                    }`}
                  >
                    {/* Review Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-800">Question {idx + 1}</span>
                      </div>

                      {onNavigateToCoachWithPrompt && (
                        <button
                          onClick={() => handleAskCoachAboutQuestion(q)}
                          className="text-[11px] font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Bot className="w-3 h-3 text-violet-600" />
                          Ask AI Coach to Explain
                        </button>
                      )}
                    </div>

                    {/* Question Statement */}
                    <div className="prose prose-sm max-w-none text-slate-900 font-semibold text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question}</ReactMarkdown>
                    </div>

                    {/* Given vs Correct Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div
                        className={`p-3 rounded-2xl border ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50/70 border-rose-200 text-rose-950'
                        }`}
                      >
                        <span className="font-bold text-[10px] uppercase tracking-wider block mb-0.5">
                          Your Answer:
                        </span>
                        <span className="font-semibold">{userAns?.textAnswer || 'None provided'}</span>
                      </div>

                      <div className="p-3 rounded-2xl border bg-violet-50/70 border-violet-200 text-violet-950">
                        <span className="font-bold text-[10px] uppercase tracking-wider block mb-0.5">
                          Correct Answer:
                        </span>
                        <span className="font-semibold">{correctOptionStr}</span>
                      </div>
                    </div>

                    {/* Pedagogical Explanation */}
                    {q.explanation && (
                      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          Explanation & Theoretical Proof:
                        </span>
                        <div className="prose prose-xs max-w-none text-slate-600">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.explanation}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

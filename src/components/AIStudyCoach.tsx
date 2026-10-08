import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  Zap,
  Download,
} from 'lucide-react';
import {
  Subject,
  Task,
  ProgressLog,
  AIChatMessage,
  User,
} from '../types';

interface AIStudyCoachProps {
  user: User;
  subjects: Subject[];
  tasks: Task[];
  progress: ProgressLog[];
  weakTopics?: string[];
  chatHistory: AIChatMessage[];
  onUpdateChatHistory: (messages: AIChatMessage[]) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onNavigateToQuiz?: (subject?: string, topic?: string) => void;
}

export const AIStudyCoach: React.FC<AIStudyCoachProps> = ({
  user,
  subjects,
  tasks,
  progress,
  weakTopics = [],
  chatHistory,
  onUpdateChatHistory,
  onShowToast,
  onNavigateToQuiz,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize a warm, natural welcome message if history is empty
  useEffect(() => {
    if (chatHistory.length === 0) {
      const welcome: AIChatMessage = {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Hey **${user.name}**! I'm **StudyAI Coach**, your study mentor. Whether you want to walk through an algorithm, solve a math derivation, or plan out your exam prep, just ask—what are you working on today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: [],
      };
      onUpdateChatHistory([welcome]);
    }
  }, [chatHistory.length, user.name, onUpdateChatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading, streamingContent]);

  const handleSendMessage = async (customText?: string) => {
    const text = (customText ?? inputQuery).trim();
    if (!text || isLoading) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: AIChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp,
    };

    // Show user's message immediately
    const previousMessages = chatHistory.filter((m) => m.id !== 'msg_welcome').slice(-20);
    const updatedHistoryWithUser = [...chatHistory, userMessage];
    onUpdateChatHistory(updatedHistoryWithUser);
    setInputQuery('');
    setIsLoading(true);
    setStreamingContent('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const activeSubjectObj =
      selectedSubjectFilter !== 'all'
        ? subjects.find((s) => s.name === selectedSubjectFilter)
        : undefined;

    const requestPayload = {
      message: text,
      history: previousMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      })),
      context: {
        user,
        subjects: activeSubjectObj ? [activeSubjectObj] : subjects,
        tasksPendingCount: tasks.filter((t) => t.status !== 'completed').length,
        weeklyHours: progress.slice(-7).reduce((s, p) => s + (p.hours || 0), 0),
        weakTopics,
      },
    };

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok || !response.body) {
        let errText = `Request failed with status ${response.status}.`;
        try {
          const errJson = await response.json();
          if (errJson?.error) errText = errJson.error;
        } catch {
          // ignore JSON parse error
        }
        throw new Error(errText);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';
      let finalSuggestedPrompts: string[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.replace(/^data:\s*/, '');
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'chunk' && typeof parsed.text === 'string') {
              accumulatedText += parsed.text;
              setStreamingContent(accumulatedText);
            } else if (parsed.type === 'done') {
              if (typeof parsed.reply === 'string' && parsed.reply.trim()) {
                accumulatedText = parsed.reply;
              }
              if (Array.isArray(parsed.suggestedPrompts)) {
                finalSuggestedPrompts = parsed.suggestedPrompts;
              }
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error || 'An error occurred while generating the response.');
            }
          } catch (innerErr: any) {
            if (innerErr?.message && !innerErr.message.includes('JSON')) {
              throw innerErr;
            }
          }
        }
      }

      const finalReply =
        accumulatedText.trim() ||
        "I'm here! Could you rephrase your question slightly so I can help?";

      const assistantMessage: AIChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: finalReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: finalSuggestedPrompts.length > 0 ? finalSuggestedPrompts : undefined,
      };

      onUpdateChatHistory([...updatedHistoryWithUser, assistantMessage]);
    } catch (err: any) {
      console.error('Error in AI Coach chat:', err);
      const friendlyError =
        err?.message ||
        "Sorry, I couldn't reach the AI service right now. Please check your connection or API key and try again.";

      const errorMessage: AIChatMessage = {
        id: `ai_err_${Date.now()}`,
        role: 'assistant',
        content: friendlyError,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onUpdateChatHistory([...updatedHistoryWithUser, errorMessage]);
      onShowToast('Could not complete AI request', 'warning');
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleCopy = (content: string, key: string) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(key);
    onShowToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    onUpdateChatHistory([]);
    onShowToast('Conversation history reset', 'info');
  };

  const handleExportChat = () => {
    const textContent = chatHistory
      .map((m) => `[${m.timestamp}] ${m.role === 'user' ? user.name : 'StudyAI Coach'}:\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([textContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyAI_Notes_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Exported study conversation to Markdown!', 'success');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputQuery(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const renderMarkdownContent = (content: string, msgId: string, isUser: boolean) => (
    <div className={`prose prose-sm max-w-none break-words ${isUser ? 'text-white prose-invert' : 'text-[#0F172A]'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
          h1: ({ children }) => <h1 className="text-base font-bold my-2.5 text-inherit">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold my-2 text-inherit">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-bold my-1.5 text-inherit">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#7C3AED] pl-3 italic my-2 text-[#64748B]">
              {children}
            </blockquote>
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isBlock = !inline && (match || codeString.includes('\n'));

            if (isBlock) {
              const copyKey = `code_${msgId}_${codeString.slice(0, 16)}`;
              return (
                <div className="my-3 rounded-xl overflow-hidden border border-[#0F172A] bg-[#0F172A] text-slate-100 text-xs">
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800 border-b border-slate-700">
                    <span className="font-mono text-[11px] text-[#06B6D4] font-semibold uppercase">
                      {match ? match[1] : 'code'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeString, copyKey)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedIndex === copyKey ? (
                        <>
                          <Check className="w-3 h-3 text-[#10B981]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 overflow-x-auto font-mono text-[11px] leading-relaxed text-emerald-300">
                    <code {...props}>{children}</code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className={`px-1.5 py-0.5 rounded-md font-mono text-xs ${
                  isUser ? 'bg-white/20 text-white' : 'bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE]'
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 border-b border-[#E5E7EB] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl ai-gradient flex items-center justify-center text-white vibrant-shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[#0F172A] text-base tracking-tight">StudyAI Coach</h2>
              <span className="text-xs font-semibold text-[#10B981]">
                · Live Mentor
              </span>
            </div>
            <p className="text-xs text-[#64748B] font-medium">
              Natural Study Mentor · Math & Code Explanations · Exam Planning
            </p>
          </div>
        </div>

        {/* Action Controls & Subject Filter */}
        <div className="flex items-center gap-2">
          {subjects.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs text-[#0F172A]">
              <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="bg-transparent font-semibold text-[#0F172A] outline-hidden cursor-pointer text-xs"
              >
                <option value="all">All Subjects Context</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportChat}
            disabled={chatHistory.length === 0}
            title="Export Notes as Markdown"
            className="p-2 rounded-xl text-[#64748B] hover:text-[#7C3AED] hover:bg-white transition-colors border border-[#E5E7EB] bg-white disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={chatHistory.length <= 1}
            title="Reset Conversation"
            className="p-2 rounded-xl text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition-colors border border-[#E5E7EB] bg-white disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 bg-[#F8FAFC]">
        {chatHistory.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 text-xs font-bold ${
                  isUser ? 'bg-[#0F172A]' : 'ai-gradient'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`group relative rounded-2xl p-4 md:p-5 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#7C3AED] text-white rounded-tr-none'
                    : 'bg-white border border-[#E5E7EB] text-[#0F172A] rounded-tl-none'
                }`}
              >
                {/* Header info */}
                <div
                  className={`flex items-center justify-between gap-4 mb-2 pb-1.5 border-b text-[11px] font-semibold ${
                    isUser ? 'border-white/20 text-white/80' : 'border-[#E5E7EB] text-[#64748B]'
                  }`}
                >
                  <span>{isUser ? user.name : 'StudyAI Coach'}</span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#64748B] hover:text-[#7C3AED] cursor-pointer"
                        title="Copy message"
                      >
                        {copiedIndex === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-[#10B981]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Rendered Markdown + LaTeX + Code */}
                {renderMarkdownContent(msg.content, msg.id, isUser)}

                {/* Dynamic Suggested Follow-Up Chips (only shown when non-empty) */}
                {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex flex-wrap gap-1.5">
                    {msg.suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F8FAFC] hover:bg-[#F5F3FF] text-[#0F172A] hover:text-[#7C3AED] border border-[#E5E7EB] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-[#7C3AED] shrink-0" />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Streaming / Typing Indicator Bubble */}
        {isLoading && (
          <div className="flex gap-3.5 max-w-3xl mr-auto">
            <div className="w-8 h-8 rounded-xl ai-gradient flex items-center justify-center text-white shrink-0 text-xs font-bold">
              <Bot className="w-4 h-4" />
            </div>
            {streamingContent ? (
              <div className="bg-white border border-[#E5E7EB] text-[#0F172A] rounded-2xl rounded-tl-none p-4 md:p-5 text-sm leading-relaxed">
                <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-[#E5E7EB] text-[11px] font-semibold text-[#64748B]">
                  <span>StudyAI Coach</span>
                  <span className="text-[#7C3AED] animate-pulse">Typing...</span>
                </div>
                {renderMarkdownContent(streamingContent, 'streaming_msg', false)}
              </div>
            ) : (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl rounded-tl-none px-4 py-3.5 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-[#7C3AED] animate-spin" />
                <span className="text-xs font-semibold text-[#64748B]">
                  StudyAI Coach is thinking...
                </span>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick-Prompt Chips Bar */}
      <div className="px-4 py-2 bg-white border-t border-[#E5E7EB] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] font-bold text-[#64748B] shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-[#7C3AED]" /> Quick Prompts:
        </span>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendMessage('Find the derivative of x^2 sin(x) step by step')}
          className="shrink-0 px-2.5 py-1 rounded-lg text-xs bg-[#F8FAFC] hover:bg-[#F5F3FF] text-[#0F172A] hover:text-[#7C3AED] border border-[#E5E7EB] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          Calculus Derivative
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendMessage('Write Python code for Longest Common Subsequence (LCS) using dynamic programming')}
          className="shrink-0 px-2.5 py-1 rounded-lg text-xs bg-[#F8FAFC] hover:bg-[#F5F3FF] text-[#0F172A] hover:text-[#7C3AED] border border-[#E5E7EB] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          Python DP LCS
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSendMessage('Can you help me make a weekly study plan for my upcoming exams?')}
          className="shrink-0 px-2.5 py-1 rounded-lg text-xs bg-[#F8FAFC] hover:bg-[#F5F3FF] text-[#0F172A] hover:text-[#7C3AED] border border-[#E5E7EB] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          Weekly Study Plan
        </button>
        {onNavigateToQuiz && (
          <button
            type="button"
            onClick={() => onNavigateToQuiz(selectedSubjectFilter !== 'all' ? selectedSubjectFilter : undefined)}
            className="shrink-0 px-2.5 py-1 rounded-lg text-xs bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#3B82F6] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <HelpCircle className="w-3 h-3 text-[#3B82F6]" />
            Switch to Active Recall Quiz
          </button>
        )}
      </div>

      {/* Input Composer */}
      <div className="p-3 md:p-4 border-t border-[#E5E7EB] bg-white shrink-0">
        <div className="relative flex items-end gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-[#7C3AED]/20 focus-within:border-[#7C3AED] transition-all">
          <textarea
            ref={textareaRef}
            value={inputQuery}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Message StudyAI Coach... (Enter to send, Shift+Enter for new line)"
            className="w-full bg-transparent px-3 py-2 text-sm text-[#0F172A] placeholder-[#64748B] focus:outline-hidden resize-none max-h-40 font-medium"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isLoading}
            className="p-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 flex items-center justify-center cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-2 text-[11px] text-[#64748B]">
          <span>Markdown, LaTeX Math ($...$ & $$...$$), and Code Blocks supported</span>
          <span>Enter to send · Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
};

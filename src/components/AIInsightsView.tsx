import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  HelpCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import {
  Subject,
  Task,
  ProgressLog,
  AIRecommendation,
  AIChatMessage,
  QuizSessionResult,
  User as UserType,
} from '../types';
import { AIStudyCoach } from './AIStudyCoach';
import { ActiveRecallQuiz } from './ActiveRecallQuiz';

interface AIInsightsViewProps {
  user: UserType;
  subjects: Subject[];
  tasks: Task[];
  progress: ProgressLog[];
  recommendations: AIRecommendation[];
  chatHistory: AIChatMessage[];
  onUpdateChatHistory: (messages: AIChatMessage[]) => void;
  quizHistory: QuizSessionResult[];
  onSaveQuizResult: (result: QuizSessionResult) => void;
  weakTopics?: string[];
  onAddWeakTopic?: (topic: string) => void;
  onRemoveWeakTopic?: (topic: string) => void;
  onRefreshRecommendations: () => Promise<void>;
  onLogStudyProgress?: (log: { subject_id: number | null; hours: number; topics: string; notes: string }) => void;
  onNavigateToPage: (page: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  initialTab?: 'coach' | 'quiz' | 'recommendations';
  initialQuizSubject?: string;
  initialQuizTopic?: string;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  user,
  subjects,
  tasks,
  progress,
  recommendations,
  chatHistory,
  onUpdateChatHistory,
  quizHistory,
  onSaveQuizResult,
  weakTopics = [],
  onAddWeakTopic,
  onRemoveWeakTopic,
  onRefreshRecommendations,
  onLogStudyProgress,
  onNavigateToPage,
  onShowToast,
  initialTab = 'coach',
  initialQuizSubject,
  initialQuizTopic,
}) => {
  const [activeTab, setActiveTab] = useState<'coach' | 'quiz' | 'recommendations'>(initialTab);
  const [isRefreshingRecs, setIsRefreshingRecs] = useState(false);
  const [targetQuizSubject, setTargetQuizSubject] = useState<string | undefined>(initialQuizSubject);
  const [targetQuizTopic, setTargetQuizTopic] = useState<string | undefined>(initialQuizTopic);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialQuizSubject) setTargetQuizSubject(initialQuizSubject);
    if (initialQuizTopic) setTargetQuizTopic(initialQuizTopic);
  }, [initialQuizSubject, initialQuizTopic]);

  const handleRefreshRecs = async () => {
    setIsRefreshingRecs(true);
    try {
      await onRefreshRecommendations();
      onShowToast('Refreshed smart recommendations with Gemini AI!', 'success');
    } catch (e: any) {
      onShowToast('Could not refresh recommendations', 'error');
    } finally {
      setIsRefreshingRecs(false);
    }
  };

  const handleNavigateToCoachWithPrompt = (prompt: string) => {
    setActiveTab('coach');
    const userMsg: AIChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onUpdateChatHistory([...chatHistory, userMsg]);
  };

  const handleNavigateToQuizFromCoach = (subject?: string, topic?: string) => {
    if (subject) setTargetQuizSubject(subject);
    if (topic) setTargetQuizTopic(topic);
    setActiveTab('quiz');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Main Navigation Tabs */}
      <div className="bg-white rounded-2xl p-3 border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab('coach')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'coach'
                ? 'ai-gradient text-white vibrant-shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI Study Coach
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'ai-gradient text-white vibrant-shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Active Recall Quiz
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'recommendations'
                ? 'ai-gradient text-white vibrant-shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Diagnostics & Strategy
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#06B6D4]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini Academic Intelligence</span>
        </div>
      </div>

      {/* Tab 1: AI Study Coach */}
      {activeTab === 'coach' && (
        <AIStudyCoach
          user={user}
          subjects={subjects}
          tasks={tasks}
          progress={progress}
          weakTopics={weakTopics}
          chatHistory={chatHistory}
          onUpdateChatHistory={onUpdateChatHistory}
          onShowToast={onShowToast}
          onNavigateToQuiz={handleNavigateToQuizFromCoach}
        />
      )}

      {/* Tab 2: Active Recall Quiz Studio */}
      {activeTab === 'quiz' && (
        <ActiveRecallQuiz
          user={user}
          subjects={subjects}
          initialSubject={targetQuizSubject}
          initialTopic={targetQuizTopic}
          weakTopics={weakTopics}
          onAddWeakTopic={onAddWeakTopic}
          onRemoveWeakTopic={onRemoveWeakTopic}
          quizHistory={quizHistory}
          onSaveQuizResult={onSaveQuizResult}
          onLogStudyProgress={onLogStudyProgress}
          onNavigateToCoachWithPrompt={handleNavigateToCoachWithPrompt}
          onShowToast={onShowToast}
        />
      )}

      {/* Tab 3: Recommendations & Diagnostics */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  Academic Diagnostics & Smart Recommendations
                </h2>
                <p className="text-xs text-[#64748B] font-medium mt-0.5">
                  AI-synthesized priority roadmap based on your active syllabi, pending assignments, and study velocity.
                </p>
              </div>

              <button
                onClick={handleRefreshRecs}
                disabled={isRefreshingRecs}
                className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRecs ? 'animate-spin' : ''}`} />
                {isRefreshingRecs ? 'Analyzing Curriculum...' : 'Refresh AI Analysis'}
              </button>
            </div>
          </div>

          {/* Recommendations Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const isUrgent = rec.category === 'urgent';
              const isPraise = rec.category === 'praise';

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl p-6 border border-[#E5E7EB] space-y-3 transition-all hover:border-[#7C3AED]/40"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                    <span
                      className={`capitalize ${
                        isUrgent
                          ? 'text-[#F59E0B]'
                          : isPraise
                          ? 'text-[#10B981]'
                          : 'text-[#7C3AED]'
                      }`}
                    >
                      {rec.category}
                    </span>
                    <span className="text-[#64748B] tabular-nums">
                      {new Date(rec.generated_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#0F172A] leading-snug">{rec.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{rec.text}</p>

                  {rec.details && (
                    <div className="pt-2 border-t border-[#E5E7EB] text-xs text-[#0F172A] font-medium">
                      {rec.details}
                    </div>
                  )}

                  {rec.action_label && rec.action_page && (
                    <div className="pt-1">
                      <button
                        onClick={() => onNavigateToPage(rec.action_page!)}
                        className="text-xs font-bold text-[#7C3AED] hover:text-[#5B21B6] inline-flex items-center gap-1 group cursor-pointer"
                      >
                        <span>{rec.action_label}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
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

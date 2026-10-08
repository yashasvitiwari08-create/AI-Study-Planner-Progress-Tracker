import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Timer,
  BookOpen,
  CheckSquare,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';
import { PageId } from './Sidebar';

interface NavbarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenQuickAdd: (type: 'task' | 'subject' | 'plan' | 'progress') => void;
  timerState?: {
    isRunning: boolean;
    timeLeft: number;
    mode: 'focus' | 'break';
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  onOpenQuickAdd,
  timerState,
}) => {
  const [currentDate, setCurrentDate] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateTime();
  }, []);

  const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard Overview', subtitle: 'Academic metrics, analytics & smart recommendations' },
    planner: { title: 'Study Planner', subtitle: 'Milestones, study roadmaps & exam timelines' },
    subjects: { title: 'Course Subjects', subtitle: 'Syllabus, exam countdowns & grade targets' },
    tasks: { title: 'Task Manager', subtitle: 'Actionable assignments, problem sets & subtasks' },
    focus: { title: 'Focus Pomodoro', subtitle: 'Timed deep-work intervals & ambient soundscapes' },
    notes: { title: 'Notes & Active Recall', subtitle: 'Markdown notes with AI summarization & quiz generation' },
    coding: { title: 'Coding Workspace', subtitle: 'DSA practice, live simulation & AI code assistant' },
    progress: { title: 'Progress Analytics', subtitle: 'Study velocity, streak log & subject mastery' },
    ai: { title: 'AI Diagnostics & Strategy', subtitle: 'Gemini-powered study strategies, diagnostics & analytics' },
    coach: { title: 'AI Study Coach', subtitle: 'Interactive academic mentor, Socratic tutor & schedule optimizer' },
    quiz: { title: 'Active Recall Quiz Studio', subtitle: 'Dynamic AI question generation & spaced repetition' },
  };

  const current = pageTitles[activePage] || { title: 'StudyAI', subtitle: 'Planner & Tracker' };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Zone 1: Title / Contextual Breadcrumb */}
      <div>
        <h1 id="navbar-page-title" className="text-base font-bold text-[#0F172A] tracking-tight leading-tight">
          {current.title}
        </h1>
        <p className="text-xs text-[#64748B] font-medium hidden sm:block">{current.subtitle}</p>
      </div>

      {/* Zone 2: Date & Live Status */}
      <div className="hidden md:flex items-center gap-3 text-xs text-[#64748B] font-medium">
        <span>{currentDate}</span>
        {timerState?.isRunning && (
          <>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => onNavigate('focus')}
              className="flex items-center gap-1.5 text-[#7C3AED] font-semibold hover:underline cursor-pointer tabular-nums"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{timerState.mode === 'focus' ? 'Focus' : 'Break'} {formatTimer(timerState.timeLeft)}</span>
            </button>
          </>
        )}
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5">
        {/* Ask AI quick button — Signature Purple -> Blue -> Cyan AI gradient */}
        <button
          id="nav-ask-ai-btn"
          onClick={() => onNavigate('ai')}
          className="group relative flex items-center gap-1.5 px-4 py-2 rounded-xl ai-gradient text-white text-xs font-bold hover:opacity-95 vibrant-shadow-sm transition-all cursor-pointer whitespace-nowrap"
          title="Open AI Academic Tutor & Problem Solver"
        >
          <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
          <span id="nav-ask-ai-text" className="tracking-tight">
            Ask AI Tutor
          </span>
        </button>

        {/* Quick Add Menu — Primary Purple #7C3AED */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl vibrant-shadow-lg border border-[#E5E7EB] py-1.5 z-50">
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    onOpenQuickAdd('task');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED]">
                    <CheckSquare className="w-3.5 h-3.5" />
                  </div>
                  <span>Add Task</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    onOpenQuickAdd('subject');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span>Add Subject</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    onOpenQuickAdd('plan');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#ECFEFF] flex items-center justify-center text-[#06B6D4]">
                    <CalendarDays className="w-3.5 h-3.5" />
                  </div>
                  <span>Create Study Plan</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    onOpenQuickAdd('progress');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED]">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span>Log Study Hours</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

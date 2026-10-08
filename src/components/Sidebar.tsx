import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  CheckSquare,
  Timer,
  FileText,
  Code2,
  TrendingUp,
  Sparkles,
  Flame,
  Settings,
  GraduationCap,
} from 'lucide-react';
import { User, Task, Subject } from '../types';

export type PageId =
  | 'dashboard'
  | 'planner'
  | 'subjects'
  | 'tasks'
  | 'focus'
  | 'notes'
  | 'coding'
  | 'progress'
  | 'ai'
  | 'coach'
  | 'quiz';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  user: User;
  tasks: Task[];
  subjects: Subject[];
  streak: number;
  isTimerRunning?: boolean;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  user,
  tasks,
  subjects,
  streak,
  isTimerRunning,
  onOpenSettings,
}) => {
  const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;
  const activeSubjects = subjects.length;

  const coreNavItems: { id: PageId; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'planner',
      label: 'Study Planner',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'subjects',
      label: 'Subjects',
      icon: <BookOpen className="w-4 h-4" />,
      badge: activeSubjects > 0 ? activeSubjects : undefined,
      badgeColor: 'text-[#64748B] font-mono tabular-nums',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: pendingTasks > 0 ? pendingTasks : undefined,
      badgeColor: 'text-[#F59E0B] font-mono tabular-nums',
    },
    {
      id: 'focus',
      label: 'Focus Timer',
      icon: <Timer className={`w-4 h-4 ${isTimerRunning ? 'animate-pulse text-[#7C3AED]' : ''}`} />,
      badge: isTimerRunning ? 'Live' : undefined,
      badgeColor: 'text-[#10B981]',
    },
    {
      id: 'notes',
      label: 'Notes & Recall',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'coding',
      label: 'Coding Space',
      icon: <Code2 className="w-4 h-4" />,
    },
    {
      id: 'progress',
      label: 'Progress Analytics',
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ];

  const aiNavItems: { id: PageId; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'coach',
      label: 'AI Study Coach',
      icon: <Sparkles className="w-4 h-4 text-[#7C3AED]" />,
      badge: 'AI',
      badgeColor: 'text-[#06B6D4]',
    },
    {
      id: 'quiz',
      label: 'Active Recall Quiz',
      icon: <Sparkles className="w-4 h-4 text-[#3B82F6]" />,
      badge: 'Recall',
      badgeColor: 'text-[#3B82F6]',
    },
    {
      id: 'ai',
      label: 'AI Insights & Tutor',
      icon: <Sparkles className="w-4 h-4 text-[#06B6D4]" />,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col h-screen sticky top-0 shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl ai-gradient flex items-center justify-center text-white vibrant-shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-[#0F172A] tracking-tight text-base block leading-tight">
              StudyAI
            </span>
            <p className="text-xs text-[#64748B] font-medium">Academic Planner</p>
          </div>
        </div>
      </div>

      {/* Streak Banner (Amber Warning/Important Alert status accent) */}
      <div className="px-4 pt-3.5 pb-1">
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-[#F59E0B]">
              <Flame className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A] tabular-nums">{streak} Day Streak</div>
              <div className="text-[11px] text-[#64748B] font-medium">Daily momentum</div>
            </div>
          </div>
          <button
            onClick={() => onSelectPage('focus')}
            className="text-[11px] font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Focus
          </button>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        <div>
          <div className="text-[11px] font-semibold text-[#64748B] px-3 py-1">Workspace</div>
          <div className="space-y-0.5 mt-1">
            {coreNavItems.map((item, index) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  data-nav-index={index + 1}
                  onClick={() => onSelectPage(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#7C3AED] text-white vibrant-shadow-sm'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`${isActive ? 'text-white' : 'text-[#64748B] group-hover:text-[#7C3AED]'}`}>
                      {item.icon}
                    </span>
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-semibold ${
                        isActive ? 'text-white/90' : item.badgeColor || 'text-[#64748B]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-[#64748B] px-3 py-1 flex items-center justify-between">
            <span>AI Intelligence</span>
            <span className="text-[10px] text-[#06B6D4] font-bold">Gemini</span>
          </div>
          <div className="space-y-0.5 mt-1">
            {aiNavItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => onSelectPage(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'ai-gradient text-white vibrant-shadow-sm'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`${isActive ? 'text-white' : 'text-[#7C3AED]'}`}>
                      {item.icon}
                    </span>
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-semibold ${
                        isActive ? 'text-white/90' : item.badgeColor || 'text-[#3B82F6]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#F8FAFC]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5E7EB]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white font-bold text-xs shrink-0">
              {(user.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#0F172A] truncate">{user.name}</div>
              <div className="text-[11px] text-[#64748B] truncate">{user.major || 'Engineering Student'}</div>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            title="Settings & Data Export"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#7C3AED] hover:bg-[#F8FAFC] transition-colors shrink-0 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

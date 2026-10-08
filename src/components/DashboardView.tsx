import React from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock,
  Sparkles,
  ArrowRight,
  Calendar,
  Play,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Subject, StudyPlan, Task, ProgressLog, AIRecommendation } from '../types';
import { PageId } from './Sidebar';

interface DashboardViewProps {
  subjects: Subject[];
  plans: StudyPlan[];
  tasks: Task[];
  progress: ProgressLog[];
  recommendations: AIRecommendation[];
  onNavigate: (page: PageId) => void;
  onToggleTaskStatus: (taskId: number) => void;
  onStartFocusOnTask: (task: Task) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  subjects,
  plans,
  tasks,
  progress,
  recommendations,
  onNavigate,
  onToggleTaskStatus,
  onStartFocusOnTask,
}) => {
  // Compute stats
  const activePlansCount = plans.filter((p) => p.status === 'in-progress' || p.status === 'pending').length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const totalTasksCount = tasks.length;

  // Weekly hours calculation (last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const weeklyProgress = progress.filter((p) => new Date(p.date) >= sevenDaysAgo);
  const totalWeeklyHours = weeklyProgress.reduce((sum, p) => sum + (p.hours || 0), 0);

  // Daily hours array for Mon - Sun of the current week
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayHours: number[] = [0, 0, 0, 0, 0, 0, 0];

  progress.forEach((p) => {
    const d = new Date(p.date);
    const day = d.getDay(); // 0 is Sun, 1 is Mon
    const mappedIndex = day === 0 ? 6 : day - 1;
    if (new Date(p.date) >= sevenDaysAgo) {
      dayHours[mappedIndex] += p.hours || 0;
    }
  });

  const maxDailyHour = Math.max(4, ...dayHours);

  // Subject study distribution
  const subjectHoursMap: Record<number, number> = {};
  progress.forEach((p) => {
    if (p.subject_id) {
      subjectHoursMap[p.subject_id] = (subjectHoursMap[p.subject_id] || 0) + (p.hours || 0);
    }
  });

  const totalAllHours = Object.values(subjectHoursMap).reduce((a, b) => a + b, 0) || 1;

  // Upcoming Exams sorted by closest date
  const upcomingExams = subjects
    .filter((s) => s.exam_date)
    .map((s) => {
      const examDate = new Date(s.exam_date!);
      const diffTime = examDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...s, diffDays };
    })
    .sort((a, b) => a.diffDays - b.diffDays)
    .slice(0, 3);

  // High priority / pending tasks
  const highPriorityTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => (a.priority === 'high' ? -1 : 1))
    .slice(0, 4);

  // Spotlight Recommendation
  const spotlight = recommendations[0] || {
    id: 1,
    title: 'Study Routine Alignment',
    text: 'Schedule a consistent 2-hour daily block for your upcoming high-priority exams.',
    details: 'Spaced repetition increases long-term exam retention by up to 50%.',
    category: 'urgent',
    action_label: 'Explore AI Hub',
    action_page: 'ai',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 4 Metric Cards — Cohesive White Cards with Purple/Blue/Emerald hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Subjects (Primary Purple #7C3AED) */}
        <div
          onClick={() => onNavigate('subjects')}
          className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#7C3AED]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Active Subjects</span>
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#0F172A] tabular-nums">{subjects.length}</div>
            <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-[#7C3AED] tabular-nums">
                {subjects.filter((s) => s.priority === 'high').length} high priority
              </span>
              <span aria-hidden="true">·</span>
              <span>Fall semester</span>
            </div>
          </div>
        </div>

        {/* Card 2: Study Plans (Supporting Blue #3B82F6) */}
        <div
          onClick={() => onNavigate('planner')}
          className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#3B82F6]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Active Study Plans</span>
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#0F172A] tabular-nums">{activePlansCount}</div>
            <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-[#3B82F6] tabular-nums">{plans.length} total roadmaps</span>
              <span aria-hidden="true">·</span>
              <span>Spaced milestones</span>
            </div>
          </div>
        </div>

        {/* Card 3: Tasks Completed (Semantic Emerald #10B981) */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#10B981]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Tasks Completed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center group-hover:bg-[#10B981] group-hover:text-white transition-colors">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#0F172A] tabular-nums">
              {completedTasksCount}{' '}
              <span className="text-sm font-medium text-[#64748B]">/ {totalTasksCount}</span>
            </div>
            <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
              {totalTasksCount > 0 ? (
                <>
                  <span className="font-semibold text-[#10B981] tabular-nums">
                    {Math.round((completedTasksCount / totalTasksCount) * 100)}% complete
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{totalTasksCount - completedTasksCount} remaining</span>
                </>
              ) : (
                <span>No tasks scheduled</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Hours Studied (Supporting Blue / Purple Progress) */}
        <div
          onClick={() => onNavigate('progress')}
          className="bg-white p-5 rounded-2xl border border-[#E5E7EB] hover:border-[#7C3AED]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Hours This Week</span>
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#0F172A] tabular-nums">{totalWeeklyHours.toFixed(1)}h</div>
            <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="font-semibold text-[#3B82F6] tabular-nums">Target: 20h / wk</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Spotlight Recommendation — Signature Purple -> Blue -> Cyan AI Gradient */}
      <div className="ai-gradient text-white rounded-2xl p-6 vibrant-shadow relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>AI Diagnostic Insight</span>
              <span aria-hidden="true">·</span>
              <span className="text-white/75">Live Analysis</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{spotlight.title}</h2>
            <p className="text-sm text-white/90 leading-relaxed">{spotlight.text}</p>
            {spotlight.details && (
              <p className="text-xs text-white/80 font-medium">{spotlight.details}</p>
            )}
          </div>
          <button
            onClick={() => onNavigate((spotlight.action_page as PageId) || 'ai')}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0F172A] text-xs font-bold hover:bg-[#F8FAFC] transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span>{spotlight.action_label || 'View AI Insights'}</span>
            <ArrowRight className="w-4 h-4 text-[#7C3AED]" />
          </button>
        </div>
      </div>

      {/* Grid: Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Study Hours Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E5E7EB] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Weekly Study Velocity</h3>
              <p className="text-xs text-[#64748B] font-medium">Daily hours logged across past 7 days</p>
            </div>
            <div className="text-xs font-bold text-[#7C3AED] tabular-nums">
              Total: {totalWeeklyHours.toFixed(1)} hrs
            </div>
          </div>

          {/* Bar Chart Visualization — Purple (#7C3AED) Today + Blue (#3B82F6) Supporting */}
          <div className="pt-4 pb-2">
            <div className="h-44 flex items-end justify-between gap-3 px-2 border-b border-[#E5E7EB]">
              {daysOfWeek.map((day, idx) => {
                const hours = dayHours[idx] || 0;
                const percentage = Math.min(100, Math.round((hours / maxDailyHour) * 100));
                const isToday = idx === (now.getDay() === 0 ? 6 : now.getDay() - 1);

                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0F172A] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap pointer-events-none z-20 tabular-nums">
                      {hours.toFixed(1)} hrs
                    </div>

                    <div className="w-full max-w-[38px] bg-[#F8FAFC] rounded-t-lg overflow-hidden h-full flex items-end">
                      <div
                        style={{ height: `${Math.max(percentage, 6)}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isToday
                            ? 'brand-gradient'
                            : hours > 0
                            ? 'bg-[#3B82F6]/85 group-hover:bg-[#7C3AED]'
                            : 'bg-[#E5E7EB]'
                        }`}
                      />
                    </div>
                    <span className={`text-[11px] font-semibold ${isToday ? 'text-[#7C3AED] font-bold' : 'text-[#64748B]'}`}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#7C3AED] inline-block" /> Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#3B82F6] inline-block" /> Logged Sessions
            </span>
            <span className="text-[#0F172A] font-semibold tabular-nums">Goal: 3.0 hrs/day</span>
          </div>
        </div>

        {/* Subject Progress & Distribution (1 Col) */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A]">Subject Distribution</h3>
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs font-semibold text-[#7C3AED] hover:text-[#5B21B6] cursor-pointer"
            >
              Full Log →
            </button>
          </div>

          <div className="space-y-3.5 pt-1">
            {subjects.slice(0, 5).map((subject, idx) => {
              const hours = subjectHoursMap[subject.id] || 0;
              const pct = Math.round((hours / totalAllHours) * 100);
              const barColor = idx % 2 === 0 ? '#7C3AED' : '#3B82F6';

              return (
                <div key={subject.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A] truncate max-w-[170px]">{subject.name}</span>
                    <span className="font-semibold text-[#64748B] tabular-nums">{hours.toFixed(1)}h ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#F8FAFC] h-2 rounded-full overflow-hidden border border-[#E5E7EB]/60">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(pct, 5)}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] text-xs text-[#64748B] leading-relaxed">
            <strong className="text-[#0F172A]">Smart Balance:</strong> Allocate deep-work blocks proportional to upcoming exam weight and priority.
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Exams & Priority Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#7C3AED]" />
              <h3 className="text-sm font-bold text-[#0F172A]">Upcoming Exam Countdowns</h3>
            </div>
            <button
              onClick={() => onNavigate('subjects')}
              className="text-xs font-semibold text-[#7C3AED] hover:text-[#5B21B6] cursor-pointer"
            >
              All Exams →
            </button>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="text-center py-8 text-[#64748B] text-xs">No exam dates configured. Add dates in Subjects.</div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {upcomingExams.map((exam) => {
                const isUrgent = exam.diffDays <= 7;
                const isWarning = exam.diffDays > 7 && exam.diffDays <= 21;
                return (
                  <div
                    key={exam.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[#0F172A] truncate">{exam.name}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1.5">
                        <span>{exam.code || 'Course'}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {new Date(exam.exam_date!).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`text-xs font-bold shrink-0 tabular-nums ${
                        isUrgent
                          ? 'text-[#EF4444]'
                          : isWarning
                          ? 'text-[#F59E0B]'
                          : 'text-[#3B82F6]'
                      }`}
                    >
                      {exam.diffDays > 0 ? `In ${exam.diffDays} days` : exam.diffDays === 0 ? 'Today' : 'Completed'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actionable Priority Tasks */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#7C3AED]" />
              <h3 className="text-sm font-bold text-[#0F172A]">Today's Priority Tasks</h3>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-[#7C3AED] hover:text-[#5B21B6] cursor-pointer"
            >
              Task Board →
            </button>
          </div>

          {highPriorityTasks.length === 0 ? (
            <div className="text-center py-8 text-[#64748B] text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-[#10B981]" />
              <span>All priority tasks completed! Add more in Tasks.</span>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {highPriorityTasks.map((task) => {
                const subject = subjects.find((s) => s.id === task.subject_id);
                return (
                  <div
                    key={task.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => onToggleTaskStatus(task.id)}
                        className="mt-0.5 text-[#64748B] hover:text-[#10B981] transition-colors cursor-pointer"
                        title="Mark task completed"
                      >
                        <div className="w-4 h-4 rounded border border-[#64748B]/50 hover:border-[#10B981]" />
                      </button>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#0F172A] truncate">{task.task_name}</div>
                        <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5 tabular-nums">
                          {subject && (
                            <>
                              <span className="font-semibold text-[#7C3AED]">{subject.name}</span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span>Est. {task.estimated_hours}h</span>
                          {task.due_date && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Due {task.due_date}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartFocusOnTask(task)}
                      title="Start Pomodoro Focus Session"
                      className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Focus</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

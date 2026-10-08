import React, { useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StudyPlan, Subject } from '../types';

interface StudyPlannerViewProps {
  plans: StudyPlan[];
  subjects: Subject[];
  onAddPlan: (plan: Omit<StudyPlan, 'id'>) => void;
  onUpdatePlan: (plan: StudyPlan) => void;
  onDeletePlan: (planId: number) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  plans,
  subjects,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onShowToast,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(plans[0]?.id || null);

  // Manual Form State
  const [planName, setPlanName] = useState('');
  const [subjectId, setSubjectId] = useState<number>(subjects[0]?.id || 1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [totalHours, setTotalHours] = useState(24);
  const [notes, setNotes] = useState('');

  // AI Generator Form State
  const [aiSubjectId, setAiSubjectId] = useState<number>(subjects[0]?.id || 1);
  const [aiTargetHours, setAiTargetHours] = useState(30);
  const [aiExamDate, setAiExamDate] = useState('');
  const [aiSyllabus, setAiSyllabus] = useState('');
  const [aiMastery, setAiMastery] = useState('Intermediate');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const filteredPlans = plans.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      onShowToast('Please provide a study plan title', 'error');
      return;
    }

    onAddPlan({
      subject_id: subjectId,
      plan_name: planName.trim(),
      start_date: startDate,
      end_date: endDate,
      total_hours: Number(totalHours) || 20,
      status: 'in-progress',
      notes: notes.trim(),
      daily_breakdown: [
        { day: 1, date: startDate, topic: 'Foundation Review & Definitions', target_hours: 2.5, completed: false },
        { day: 2, date: endDate, topic: 'Practice Problem Sets & Core Exam Topics', target_hours: 3.5, completed: false },
      ],
    });

    onShowToast('Study plan created successfully!', 'success');
    setShowManualModal(false);
    setPlanName('');
    setNotes('');
  };

  const handleGenerateWithAI = async () => {
    const selectedSub = subjects.find((s) => s.id === aiSubjectId);
    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: selectedSub?.name || 'General Study',
          examDate: aiExamDate || selectedSub?.exam_date,
          targetHours: Number(aiTargetHours) || 25,
          syllabus: aiSyllabus || selectedSub?.syllabus || 'Core principles & practice questions',
          currentLevel: aiMastery,
        }),
      });

      const data = await res.json();
      if (data.plan) {
        onAddPlan({
          ...data.plan,
          subject_id: aiSubjectId,
          status: 'in-progress',
        });
        onShowToast('AI Generated your spaced repetition study roadmap!', 'success');
        setShowAiModal(false);
      } else {
        throw new Error(data.error || 'Failed to generate plan');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'AI plan generation error', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const toggleMilestone = (plan: StudyPlan, milestoneIdx: number) => {
    if (!plan.daily_breakdown) return;
    const updatedBreakdown = [...plan.daily_breakdown];
    updatedBreakdown[milestoneIdx].completed = !updatedBreakdown[milestoneIdx].completed;

    const allDone = updatedBreakdown.every((m) => m.completed);
    const someDone = updatedBreakdown.some((m) => m.completed);

    onUpdatePlan({
      ...plan,
      daily_breakdown: updatedBreakdown,
      status: allDone ? 'completed' : someDone ? 'in-progress' : 'pending',
    });
    onShowToast(
      updatedBreakdown[milestoneIdx].completed ? 'Milestone completed!' : 'Milestone marked pending',
      'info'
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB]">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Active Study Roadmaps</h2>
          <p className="text-xs text-[#64748B]">Design structured multi-day milestone plans for exams</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filters (Interactive Segmented Control) */}
          <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E5E7EB]">
            {['all', 'in-progress', 'pending', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-white text-[#0F172A] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {status.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* AI Generator Trigger — Purple -> Blue -> Cyan AI Gradient */}
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl ai-gradient text-white text-xs font-bold hover:opacity-95 vibrant-shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>

          {/* Manual Create — Primary Purple #7C3AED */}
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Plan</span>
          </button>
        </div>
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center space-y-3">
          <CalendarDays className="w-10 h-10 text-[#64748B]/50 mx-auto" />
          <h3 className="text-sm font-bold text-[#0F172A]">No Study Plans Found</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Create a custom study plan or use Gemini AI to generate an optimized spaced-repetition revision schedule.
          </p>
          <button
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl ai-gradient text-white text-xs font-bold hover:opacity-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate AI Roadmap</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan) => {
            const subject = subjects.find((s) => s.id === plan.subject_id);
            const isExpanded = expandedPlanId === plan.id;
            const milestones = plan.daily_breakdown || [];
            const completedCount = milestones.filter((m) => m.completed).length;
            const totalCount = milestones.length || 1;
            const progressPct = Math.round((completedCount / totalCount) * 100);

            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden transition-all"
              >
                {/* Plan Header */}
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Unboxed Metadata Kicker */}
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="text-[#7C3AED]">
                        {subject?.name || 'General Subject'}
                      </span>
                      <span className="text-[#64748B]" aria-hidden="true">·</span>
                      <span
                        className={`capitalize ${
                          plan.status === 'completed'
                            ? 'text-[#10B981]'
                            : plan.status === 'in-progress'
                            ? 'text-[#3B82F6]'
                            : 'text-[#64748B]'
                        }`}
                      >
                        {plan.status.replace('-', ' ')}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A]">{plan.plan_name}</h3>

                    {plan.notes && <p className="text-xs text-[#64748B] line-clamp-1">{plan.notes}</p>}

                    <div className="flex items-center gap-3 text-xs text-[#64748B] flex-wrap pt-1 tabular-nums">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                        {plan.start_date} → {plan.end_date}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                        Target: {plan.total_hours} hrs
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 font-semibold text-[#3B82F6]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        {completedCount}/{totalCount} Milestones ({progressPct}%)
                      </span>
                    </div>
                  </div>

                  {/* Actions & Expansion Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>{isExpanded ? 'Hide Milestones' : 'View Milestones'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-1.5 rounded-xl border border-[#E5E7EB] text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar — Purple -> Blue gradient */}
                <div className="w-full bg-[#F8FAFC] h-1.5 border-t border-[#E5E7EB]/60">
                  <div
                    className="h-full progress-gradient transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Expanded Milestones Breakdown */}
                {isExpanded && (
                  <div className="p-5 border-t border-[#E5E7EB] bg-[#F8FAFC]/60 space-y-3">
                    <h4 className="text-xs font-bold text-[#64748B]">
                      Spaced Milestones & Daily Breakdown
                    </h4>
                    {milestones.length === 0 ? (
                      <div className="text-xs text-[#64748B] italic">No daily breakdown set for this plan.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {milestones.map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => toggleMilestone(plan, idx)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                              m.completed
                                ? 'bg-emerald-50/50 border-[#10B981]/30 text-[#0F172A]'
                                : 'bg-white border-[#E5E7EB] hover:border-[#7C3AED]/40 text-[#0F172A]'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-xs mt-0.5 shrink-0 transition-colors ${
                                m.completed ? 'bg-[#10B981] text-white' : 'border border-[#64748B]/40 bg-white'
                              }`}
                            >
                              {m.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-[11px] font-medium text-[#64748B] tabular-nums">
                                <span>Day {m.day} · {m.date}</span>
                                <span>{m.target_hours} hrs</span>
                              </div>
                              <div className={`text-xs font-bold mt-0.5 ${m.completed ? 'line-through text-[#64748B]' : 'text-[#0F172A]'}`}>
                                {m.topic}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Plan Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Create Study Plan</h3>
            <form onSubmit={handleCreateManual} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Operating Systems Final Exam Prep"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Target Hours</label>
                  <input
                    type="number"
                    min={1}
                    value={totalHours}
                    onChange={(e) => setTotalHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Strategy / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Focus points, reference books, priority chapters..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl ai-gradient text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">AI Study Plan Generator</h3>
                <p className="text-xs text-[#64748B]">Spaced-Repetition Roadmap Synthesis</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Target Subject</label>
                <select
                  value={aiSubjectId}
                  onChange={(e) => {
                    const subId = Number(e.target.value);
                    setAiSubjectId(subId);
                    const sub = subjects.find((s) => s.id === subId);
                    if (sub?.exam_date) setAiExamDate(sub.exam_date);
                    if (sub?.syllabus) setAiSyllabus(sub.syllabus);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'Course'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Exam Date (Optional)</label>
                  <input
                    type="date"
                    value={aiExamDate}
                    onChange={(e) => setAiExamDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Total Target Hours</label>
                  <input
                    type="number"
                    value={aiTargetHours}
                    onChange={(e) => setAiTargetHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Key Syllabus / Topics to Cover</label>
                <textarea
                  rows={3}
                  value={aiSyllabus}
                  onChange={(e) => setAiSyllabus(e.target.value)}
                  placeholder="e.g. Graph algorithms, Dijkstra, Dynamic Programming, Heap queues..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Current Mastery Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setAiMastery(lvl)}
                      className={`py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        aiMastery === lvl
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-[#F8FAFC] text-[#0F172A] border-[#E5E7EB] hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isAiGenerating}
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAiGenerating}
                  onClick={handleGenerateWithAI}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl ai-gradient text-white text-xs font-bold hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate AI Roadmap</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

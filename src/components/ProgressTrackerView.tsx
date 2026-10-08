import React, { useState } from 'react';
import {
  Flame,
  Star,
  Plus,
  Download,
  Trash2,
} from 'lucide-react';
import { ProgressLog, Subject } from '../types';

interface ProgressTrackerViewProps {
  progress: ProgressLog[];
  subjects: Subject[];
  streak: number;
  onLogProgress: (log: Omit<ProgressLog, 'id'>) => void;
  onDeleteProgress: (id: number) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProgressTrackerView: React.FC<ProgressTrackerViewProps> = ({
  progress,
  subjects,
  streak,
  onLogProgress,
  onDeleteProgress,
  onShowToast,
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [showLogModal, setShowLogModal] = useState<boolean>(false);

  // Form State
  const [hours, setHours] = useState<number>(2.0);
  const [subjectId, setSubjectId] = useState<number>(subjects[0]?.id || 1);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [topics, setTopics] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [sessionType, setSessionType] = useState<ProgressLog['session_type']>('pomodoro');

  // Stats calculation
  const totalHours = progress.reduce((sum, p) => sum + (p.hours || 0), 0);
  const totalSessions = progress.length;
  const avgRating = totalSessions > 0
    ? (progress.reduce((sum, p) => sum + (p.rating || 4), 0) / totalSessions).toFixed(1)
    : '5.0';

  // Last 30 days heatmap calculation
  const now = new Date();
  const past30Days: { dateStr: string; dayNum: number; hours: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayHours = progress
      .filter((p) => p.date === dateStr)
      .reduce((sum, p) => sum + (p.hours || 0), 0);
    past30Days.push({ dateStr, dayNum: d.getDate(), hours: dayHours });
  }

  const filteredLogs = progress
    .filter((p) => {
      if (selectedSubjectFilter !== 'all' && p.subject_id !== Number(selectedSubjectFilter)) {
        return false;
      }
      if (selectedTypeFilter !== 'all' && p.session_type !== selectedTypeFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExportCSV = () => {
    const headers = 'ID,Subject,Date,Hours,Session_Type,Topics,Rating,Notes\n';
    const rows = progress
      .map((p) => {
        const sub = subjects.find((s) => s.id === p.subject_id)?.name || 'General';
        return `${p.id},"${sub}",${p.date},${p.hours},${p.session_type || 'study'},"${p.topics.replace(/"/g, '""')}",${p.rating || 5},"${(p.notes || '').replace(/"/g, '""')}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_progress_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    onShowToast('Progress data exported to CSV file!', 'success');
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topics.trim()) {
      onShowToast('Please specify topics covered', 'error');
      return;
    }

    onLogProgress({
      subject_id: subjectId,
      date,
      hours: Number(hours) || 1,
      topics: topics.trim(),
      notes: notes.trim(),
      rating,
      session_type: sessionType,
    });

    onShowToast('Session logged to analytics!', 'success');
    setShowLogModal(false);
    setTopics('');
    setNotes('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB]">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Study Velocity & Progress Analytics</h2>
          <p className="text-xs text-[#64748B] font-medium">Track total hours, consistency streaks and session performance</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Study Hours</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <span className="text-xs font-semibold text-[#64748B]">Total Hours Logged</span>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-2 tabular-nums">{totalHours.toFixed(1)} hrs</div>
          <div className="text-xs text-[#7C3AED] font-semibold mt-1 tabular-nums">{totalSessions} study sessions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <span className="text-xs font-semibold text-[#64748B]">Current Streak</span>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-2 flex items-center gap-2 tabular-nums">
            <Flame className="w-6 h-6 text-[#F59E0B] fill-[#F59E0B]" />
            <span>{streak} Days</span>
          </div>
          <div className="text-xs text-[#64748B] font-medium mt-1">Consistent daily momentum</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <span className="text-xs font-semibold text-[#64748B]">Daily Average</span>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-2 tabular-nums">
            {(totalHours / 14).toFixed(1)} hrs/d
          </div>
          <div className="text-xs text-[#3B82F6] font-semibold mt-1">Rolling 14-day window</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB]">
          <span className="text-xs font-semibold text-[#64748B]">Productivity Rating</span>
          <div className="text-3xl font-extrabold text-[#0F172A] mt-2 flex items-center gap-1.5 tabular-nums">
            <Star className="w-6 h-6 text-[#7C3AED] fill-[#7C3AED]" />
            <span>{avgRating} / 5</span>
          </div>
          <div className="text-xs text-[#64748B] font-medium mt-1">High focus & retention index</div>
        </div>
      </div>

      {/* 30-Day Heatmap — Cohesive Purple/Blue Scale */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F172A]">30-Day Consistency Heatmap</h3>
          <div className="flex items-center gap-2 text-[11px] text-[#64748B] font-medium">
            <span>Less</span>
            <span className="w-3 h-3 rounded-xs bg-[#F8FAFC] border border-[#E5E7EB] inline-block" />
            <span className="w-3 h-3 rounded-xs bg-[#DBEAFE] inline-block" />
            <span className="w-3 h-3 rounded-xs bg-[#3B82F6] inline-block" />
            <span className="w-3 h-3 rounded-xs bg-[#7C3AED] inline-block" />
            <span>More (3h+)</span>
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-2 pt-2">
          {past30Days.map((day) => {
            const h = day.hours;
            const bgClass =
              h === 0
                ? 'bg-[#F8FAFC] border border-[#E5E7EB] text-[#64748B]'
                : h < 2
                ? 'bg-[#DBEAFE] text-[#1D4ED8] font-bold'
                : h < 3.5
                ? 'bg-[#3B82F6] text-white font-bold'
                : 'bg-[#7C3AED] text-white font-bold';

            return (
              <div
                key={day.dateStr}
                className="flex flex-col items-center gap-1 group relative cursor-pointer"
              >
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0F172A] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap pointer-events-none z-20 tabular-nums">
                  {day.dateStr}: {day.hours.toFixed(1)} hrs
                </div>

                <div
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] transition-transform group-hover:scale-105 tabular-nums ${bgClass}`}
                >
                  {day.dayNum}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#F8FAFC]">
          <h3 className="text-sm font-bold text-[#0F172A]">Study Session History</h3>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] capitalize"
            >
              <option value="all">All Types</option>
              <option value="pomodoro">Pomodoro</option>
              <option value="coding">Coding</option>
              <option value="revision">Revision</option>
              <option value="practice">Practice</option>
              <option value="lecture">Lecture</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B] font-semibold text-xs">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Subject</th>
                <th className="p-4 text-right">Hours</th>
                <th className="p-4">Session Type</th>
                <th className="p-4">Topics Mastered</th>
                <th className="p-4 text-right">Rating</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#64748B] font-medium">
                    No session logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const subject = subjects.find((s) => s.id === log.subject_id);

                  return (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4 font-bold text-[#0F172A] tabular-nums">{log.date}</td>
                      <td className="p-4 font-semibold text-[#7C3AED]">
                        {subject?.name || 'General'}
                      </td>
                      <td className="p-4 font-bold text-[#3B82F6] text-right tabular-nums">{log.hours}h</td>
                      <td className="p-4 capitalize text-[#64748B] font-medium">{log.session_type || 'study'}</td>
                      <td className="p-4 text-[#0F172A] font-medium">
                        <div>{log.topics}</div>
                        {log.notes && <div className="text-[11px] text-[#64748B] mt-0.5">{log.notes}</div>}
                      </td>
                      <td className="p-4 text-right tabular-nums">
                        <span className="text-[#7C3AED] font-bold">{log.rating || 5}★</span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onDeleteProgress(log.id)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Log Study Session</h3>

            <form onSubmit={handleCreateLog} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    required
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Session Type</label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] capitalize"
                  >
                    <option value="pomodoro">Pomodoro</option>
                    <option value="coding">Coding</option>
                    <option value="revision">Revision</option>
                    <option value="practice">Practice</option>
                    <option value="lecture">Lecture</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Topics Studied</label>
                <input
                  type="text"
                  required
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="e.g. Graph Traversals, LeetCode 200, Relational Algebra"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Reflections / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key breakthroughs, difficult questions..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Focus Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer tabular-nums ${
                        rating >= star
                          ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                          : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#64748B]'
                      }`}
                    >
                      {star}★
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

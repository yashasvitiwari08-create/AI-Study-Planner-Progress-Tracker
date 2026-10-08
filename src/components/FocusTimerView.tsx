import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CheckCircle2,
  BookOpen,
  Radio,
} from 'lucide-react';
import { Subject, Task, ProgressLog } from '../types';
import { ambientSound } from '../lib/ambientSound';

interface FocusTimerViewProps {
  subjects: Subject[];
  tasks: Task[];
  activeTask?: Task | null;
  onLogProgress: (log: Omit<ProgressLog, 'id'>) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onUpdateTimerState?: (state: { isRunning: boolean; timeLeft: number; mode: 'focus' | 'break' }) => void;
}

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({
  subjects,
  tasks,
  activeTask,
  onLogProgress,
  onShowToast,
  onUpdateTimerState,
}) => {
  // Timer modes
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak'>('pomodoro');
  const [modeDuration, setModeDuration] = useState<number>(25 * 60);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Soundscape
  const [ambientMode, setAmbientMode] = useState<'off' | 'binaural' | 'rain' | 'whitenoise'>('off');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.3);

  // Link to Subject & Task
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(activeTask?.subject_id || subjects[0]?.id || 1);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(activeTask?.id || null);

  // Session Log Completion Modal
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [sessionHours, setSessionHours] = useState<number>(0.5);
  const [sessionTopics, setSessionTopics] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionRating, setSessionRating] = useState<number>(5);

  const durationMap = {
    pomodoro: 25 * 60,
    deepwork: 50 * 60,
    shortbreak: 5 * 60,
    longbreak: 15 * 60,
  };

  const handleSelectMode = (mode: 'pomodoro' | 'deepwork' | 'shortbreak' | 'longbreak') => {
    setTimerMode(mode);
    const secs = durationMap[mode];
    setModeDuration(secs);
    setTimeLeft(secs);
    setIsRunning(false);
  };

  // Sync with prop when activeTask changes
  useEffect(() => {
    if (activeTask) {
      setSelectedTaskId(activeTask.id);
      if (activeTask.subject_id) {
        setSelectedSubjectId(activeTask.subject_id);
      }
    }
  }, [activeTask]);

  // Tick effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      ambientSound.playChime();
      const isBreak = timerMode === 'shortbreak' || timerMode === 'longbreak';

      if (!isBreak) {
        onShowToast('Focus session complete! Great job!', 'success');
        const calculatedHours = Number((modeDuration / 3600).toFixed(2));
        setSessionHours(calculatedHours);
        const taskObj = tasks.find((t) => t.id === selectedTaskId);
        setSessionTopics(taskObj ? taskObj.task_name : 'Focused Study Session');
        setShowLogModal(true);
      } else {
        onShowToast('Break time is over. Ready to dive back in?', 'info');
      }
    }

    onUpdateTimerState?.({
      isRunning,
      timeLeft,
      mode: timerMode === 'shortbreak' || timerMode === 'longbreak' ? 'break' : 'focus',
    });

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerMode, modeDuration]);

  // Ambient sound handler
  const handleSoundChange = (mode: 'off' | 'binaural' | 'rain' | 'whitenoise') => {
    setAmbientMode(mode);
    if (mode === 'off') {
      ambientSound.stop();
    } else {
      ambientSound.play(mode, ambientVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    ambientSound.setVolume(vol);
  };

  const handleToggleTimer = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    if (nextState && ambientMode !== 'off') {
      ambientSound.play(ambientMode, ambientVolume);
    }
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(modeDuration);
  };

  const handleSaveProgressLog = (e: React.FormEvent) => {
    e.preventDefault();
    onLogProgress({
      subject_id: selectedSubjectId,
      date: new Date().toISOString().split('T')[0],
      hours: Number(sessionHours) || 0.5,
      topics: sessionTopics.trim() || 'Pomodoro Study Sprint',
      notes: sessionNotes.trim(),
      rating: sessionRating,
      session_type: 'pomodoro',
    });

    onShowToast('Session logged directly to Progress Analytics!', 'success');
    setShowLogModal(false);
    setSessionNotes('');
  };

  const formatDisplayTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.round(((modeDuration - timeLeft) / modeDuration) * 100);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB]">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Focus Pomodoro & Ambient Study</h2>
          <p className="text-xs text-[#64748B] font-medium">Block distractions with interval timers and soundscapes</p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E5E7EB] flex-wrap gap-1">
          <button
            onClick={() => handleSelectMode('pomodoro')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              timerMode === 'pomodoro' ? 'bg-[#7C3AED] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            25m Pomodoro
          </button>
          <button
            onClick={() => handleSelectMode('deepwork')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              timerMode === 'deepwork' ? 'bg-[#7C3AED] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            50m Deep Work
          </button>
          <button
            onClick={() => handleSelectMode('shortbreak')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              timerMode === 'shortbreak' ? 'bg-[#3B82F6] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            5m Break
          </button>
          <button
            onClick={() => handleSelectMode('longbreak')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              timerMode === 'longbreak' ? 'bg-[#3B82F6] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            15m Break
          </button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timer Dial Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-[#E5E7EB] flex flex-col items-center justify-center space-y-6 text-center">
          {/* Unboxed Target Subject & Task Kicker */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedSubject?.color || '#7C3AED' }}
            />
            <span className="font-bold text-[#0F172A]">
              {selectedSubject?.name || 'General Focus'}
            </span>
            {selectedTask && (
              <>
                <span className="text-[#64748B]" aria-hidden="true">·</span>
                <span className="text-[#64748B] truncate max-w-xs font-medium">
                  {selectedTask.task_name}
                </span>
              </>
            )}
          </div>

          {/* Time Display with Radial Circle */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-[#F8FAFC]"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`${timerMode.includes('break') ? 'stroke-[#3B82F6]' : 'stroke-[#7C3AED]'} transition-all duration-1000 ease-linear`}
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold tracking-tight text-[#0F172A] font-mono tabular-nums">
                {formatDisplayTime(timeLeft)}
              </span>
              <span className="text-xs font-semibold text-[#7C3AED] mt-1">
                {isRunning ? (timerMode.includes('break') ? 'Break Interval' : 'Deep Focus') : 'Ready'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleTimer}
              className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isRunning
                  ? 'bg-[#F59E0B] hover:bg-amber-600 text-white'
                  : 'bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white vibrant-shadow-sm'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              className="p-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const calculatedHours = Number(((modeDuration - timeLeft) / 3600).toFixed(2));
                setSessionHours(calculatedHours > 0 ? calculatedHours : 0.5);
                setSessionTopics(selectedTask?.task_name || 'Pomodoro Session');
                setShowLogModal(true);
              }}
              className="px-4 py-3 rounded-xl border border-[#E5E7EB] hover:border-[#7C3AED]/40 hover:bg-[#F5F3FF] text-[#7C3AED] font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              Log Session
            </button>
          </div>
        </div>

        {/* Right: Settings, Task Attachment & Soundscapes */}
        <div className="space-y-6">
          {/* Active Task Link */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] space-y-3">
            <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" /> Target Course & Task
            </h3>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Working On Task (Optional)</label>
                <select
                  value={selectedTaskId || ''}
                  onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                >
                  <option value="">-- No specific task --</option>
                  {tasks
                    .filter((t) => t.status !== 'completed')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.task_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Soundscapes */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#3B82F6]" /> Focus Soundscapes
              </h3>
              {ambientMode !== 'off' && (
                <span className="text-[11px] font-semibold text-[#10B981]">
                  Playing
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'off', label: 'Mute / Off' },
                { id: 'binaural', label: '10Hz Alpha Waves' },
                { id: 'rain', label: 'Ocean Rain' },
                { id: 'whitenoise', label: 'Pink Noise' },
              ].map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => handleSoundChange(sound.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                    ambientMode === sound.id
                      ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#7C3AED]'
                      : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#0F172A] hover:bg-slate-100'
                  }`}
                >
                  {sound.label}
                </button>
              ))}
            </div>

            {ambientMode !== 'off' && (
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#64748B] font-semibold tabular-nums">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Volume
                  </span>
                  <span>{Math.round(ambientVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Progress Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Log Study Session</h3>
                <p className="text-xs text-[#64748B]">Record your effort in Progress Analytics</p>
              </div>
            </div>

            <form onSubmit={handleSaveProgressLog} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Hours Studied</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={sessionHours}
                    onChange={(e) => setSessionHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Topics Mastered</label>
                <input
                  type="text"
                  required
                  value={sessionTopics}
                  onChange={(e) => setSessionTopics(e.target.value)}
                  placeholder="e.g. Dijkstra, Binary Heap, LeetCode 200"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Reflection / Notes</label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="What clicked? What needs more revision?"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Productivity / Focus Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSessionRating(star)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer tabular-nums ${
                        sessionRating >= star
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
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Save to Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

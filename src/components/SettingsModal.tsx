import React, { useState, useRef } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { User as UserType } from '../types';
import { AppState } from '../lib/storage';
import { initialSubjects, initialPlans, initialTasks, initialNotes, initialProgress, initialRecommendations, initialUser } from '../data/initialData';

interface SettingsModalProps {
  user: UserType;
  onUpdateUser: (user: UserType) => void;
  onRestoreState: (state: AppState) => void;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  onUpdateUser,
  onRestoreState,
  onClose,
  onShowToast,
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [major, setMajor] = useState(user.major);
  const [targetGpa, setTargetGpa] = useState(user.targetGpa || '3.90');
  const [semester, setSemester] = useState(user.semester || 'Fall 2026');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: name.trim(),
      email: email.trim(),
      major: major.trim(),
      targetGpa: targetGpa.trim(),
      semester: semester.trim(),
    });
    onShowToast('Profile preferences updated!', 'success');
  };

  const handleExportData = () => {
    try {
      const raw = localStorage.getItem('studyai_app_state_v2');
      const dataStr = raw || JSON.stringify({ user, subjects: initialSubjects });
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyai_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      onShowToast('Full database exported to JSON backup!', 'success');
    } catch (e) {
      onShowToast('Failed to export backup data', 'error');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.subjects && parsed.tasks) {
          onRestoreState(parsed);
          onShowToast('Application state successfully restored from backup!', 'success');
          onClose();
        } else {
          throw new Error('Invalid schema');
        }
      } catch (err) {
        onShowToast('Failed to parse backup JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSampleData = () => {
    const defaultState: AppState = {
      user: initialUser,
      subjects: initialSubjects,
      plans: initialPlans,
      tasks: initialTasks,
      notes: initialNotes,
      progress: initialProgress,
      recommendations: initialRecommendations,
      coding: {
        solved: 14,
        streak: 5,
        langs: ['Python', 'JavaScript', 'C++'],
        recentHistory: [],
      },
      chatHistory: [],
      quizHistory: [],
      weakTopics: ['Dynamic Programming Memoization', 'AVL Tree Rotations'],
      streak: 5,
    };
    onRestoreState(defaultState);
    onShowToast('Reset to default academic templates', 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl max-w-xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Student Profile & Settings</h3>
              <p className="text-xs text-[#64748B] font-medium">Manage academic preferences, export data & AI configs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h4 className="text-xs font-bold text-[#64748B]">Academic Profile</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Major / Degree</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Target GPA</label>
              <input
                type="text"
                value={targetGpa}
                onChange={(e) => setTargetGpa(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Term / Semester</label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Update Profile
            </button>
          </div>
        </form>

        {/* Backup & Restore Section */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
          <h4 className="text-xs font-bold text-[#64748B]">Data Persistence & Backup</h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleExportData}
              className="p-3.5 rounded-xl border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#7C3AED]" />
              <span>Export JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-xl border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#3B82F6]" />
              <span>Restore from File</span>
            </button>

            <button
              type="button"
              onClick={handleResetSampleData}
              className="p-3.5 rounded-xl border border-[#EF4444]/30 bg-red-50/40 hover:bg-red-50 text-[#EF4444] text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#EF4444]" />
              <span>Reset Sample Data</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>

        {/* AI Model Info */}
        <div className="p-4 ai-gradient-subtle rounded-xl border border-[#7C3AED]/20 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-[#0F172A]">AI Academic Intelligence</div>
            <p className="text-[#64748B] leading-relaxed">
              StudyAI performs all academic recommendation analysis, roadmap synthesis, and active recall diagnostics securely via server-side endpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Subject, Priority } from '../types';
import { PageId } from './Sidebar';

interface SubjectsViewProps {
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: number) => void;
  onNavigate: (page: PageId) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onTriggerAiQuiz?: (subjectName: string, topic?: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onNavigate,
  onShowToast,
  onTriggerAiQuiz,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [viewingSyllabus, setViewingSyllabus] = useState<Subject | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#7C3AED');
  const [examDate, setExamDate] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [targetGrade, setTargetGrade] = useState('A');
  const [creditHours, setCreditHours] = useState(3);
  const [syllabus, setSyllabus] = useState('');

  // Curated Brand Palette Presets (Purple, Deep Violet, AI Blue, Royal Blue, Cyan)
  const colorPresets = ['#7C3AED', '#5B21B6', '#3B82F6', '#2563EB', '#06B6D4', '#8B5CF6'];

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setColor('#7C3AED');
    setExamDate('');
    setPriority('high');
    setTargetGrade('A');
    setCreditHours(3);
    setSyllabus('');
    setShowModal(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setCode(subject.code || '');
    setColor(subject.color || '#7C3AED');
    setExamDate(subject.exam_date || '');
    setPriority(subject.priority);
    setTargetGrade(subject.target_grade || 'A');
    setCreditHours(subject.credit_hours || 3);
    setSyllabus(subject.syllabus || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Please enter course title', 'error');
      return;
    }

    if (editingSubject) {
      onUpdateSubject({
        ...editingSubject,
        name: name.trim(),
        code: code.trim(),
        color,
        exam_date: examDate || null,
        priority,
        target_grade: targetGrade,
        credit_hours: Number(creditHours) || 3,
        syllabus: syllabus.trim(),
      });
      onShowToast('Subject updated successfully', 'success');
    } else {
      onAddSubject({
        name: name.trim(),
        code: code.trim(),
        color,
        exam_date: examDate || null,
        priority,
        target_grade: targetGrade,
        credit_hours: Number(creditHours) || 3,
        syllabus: syllabus.trim(),
        created_at: new Date().toISOString().split('T')[0],
      });
      onShowToast('New subject added!', 'success');
    }
    setShowModal(false);
  };

  const now = new Date();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB]">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Academic Subjects & Courses</h2>
          <p className="text-xs text-[#64748B]">Track exam milestones, target grades, syllabus and priorities</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((subject) => {
          let diffDays: number | null = null;
          if (subject.exam_date) {
            const ed = new Date(subject.exam_date);
            diffDays = Math.ceil((ed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }

          return (
            <div
              key={subject.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#7C3AED]/40 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3">
                {/* 1-line Kicker & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: subject.color || '#7C3AED' }}
                    />
                    <span className="text-xs font-bold text-[#64748B]">
                      {subject.code || 'Course'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(subject)}
                      className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteSubject(subject.id)}
                      className="p-1 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] leading-snug">{subject.name}</h3>
                </div>

                {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-[#64748B] tabular-nums">
                  <span
                    className={`font-semibold capitalize ${
                      subject.priority === 'high'
                        ? 'text-[#EF4444]'
                        : subject.priority === 'medium'
                        ? 'text-[#F59E0B]'
                        : 'text-[#10B981]'
                    }`}
                  >
                    {subject.priority} priority
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{subject.credit_hours || 3} credits</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#7C3AED]">
                    Target {subject.target_grade || 'A'}
                  </span>
                </div>

                {/* Exam Countdown */}
                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs tabular-nums">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                    {subject.exam_date
                      ? new Date(subject.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'No exam date'}
                  </span>

                  {diffDays !== null && (
                    <span
                      className={`font-bold text-xs ${
                        diffDays <= 7
                          ? 'text-[#EF4444]'
                          : diffDays <= 21
                          ? 'text-[#F59E0B]'
                          : 'text-[#3B82F6]'
                      }`}
                    >
                      {diffDays > 0 ? `${diffDays} days left` : diffDays === 0 ? 'Today' : 'Passed'}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-[#F8FAFC] border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewingSyllabus(subject)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Syllabus</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onTriggerAiQuiz?.(subject.name, subject.syllabus)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#3B82F6] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                    title="Generate AI Quiz for this subject"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>AI Quiz</span>
                  </button>

                  <button
                    onClick={() => onNavigate('planner')}
                    className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Plan</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Syllabus Modal */}
      {viewingSyllabus && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">{viewingSyllabus.name}</h3>
                <p className="text-xs text-[#64748B]">Course Syllabus & Curriculum Topics</p>
              </div>
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: viewingSyllabus.color || '#7C3AED' }}
              />
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] text-xs text-[#0F172A] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {viewingSyllabus.syllabus || 'No syllabus notes provided for this course.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingSyllabus(null)}
                className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Course Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CS 301"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Target Grade</label>
                  <input
                    type="text"
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    placeholder="e.g. A or A+"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Subject Brand Accent</label>
                <div className="flex items-center gap-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        color === c ? 'ring-2 ring-[#0F172A] scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Syllabus / Key Topics</label>
                <textarea
                  rows={3}
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  placeholder="Key topics, chapters, formula sheets..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {editingSubject ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

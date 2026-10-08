import React, { useState } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  Trash2,
  Edit3,
  Tag,
  HelpCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { Note, Subject } from '../types';

interface NotesViewProps {
  notes: Note[];
  subjects: Subject[];
  onAddNote: (note: Omit<Note, 'id'>) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: number) => void;
  onTriggerAiQuiz?: (subjectName: string, topic?: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  subjects,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onTriggerAiQuiz,
  onShowToast,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<number>(notes[0]?.id || 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Form State
  const [editTitle, setEditTitle] = useState('');
  const [editSubjectId, setEditSubjectId] = useState<number>(subjects[0]?.id || 1);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  const handleStartCreate = () => {
    const newNoteObj: Omit<Note, 'id'> = {
      title: 'Untitled Study Note',
      subject_id: subjects[0]?.id || 1,
      content: '# Key Concepts\n\n- Write definition here\n- Formulas:\n- Problem solving heuristics:',
      tags: ['Study'],
      created_at: new Date().toISOString(),
    };
    onAddNote(newNoteObj);
    onShowToast('New note created. Click Edit to customize.', 'info');
  };

  const handleStartEdit = (note: Note) => {
    setEditTitle(note.title);
    setEditSubjectId(note.subject_id || subjects[0]?.id || 1);
    setEditContent(note.content);
    setEditTags(note.tags?.join(', ') || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote) return;

    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onUpdateNote({
      ...selectedNote,
      title: editTitle.trim() || 'Untitled Note',
      subject_id: editSubjectId,
      content: editContent,
      tags: parsedTags,
      updated_at: new Date().toISOString(),
    });

    setIsEditing(false);
    onShowToast('Note updated successfully!', 'success');
  };

  const handleSummarizeWithAI = async () => {
    if (!selectedNote) return;
    const sub = subjects.find((s) => s.id === selectedNote.subject_id);
    setIsSummarizing(true);

    try {
      const res = await fetch('/api/ai/summarize-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedNote.title,
          content: selectedNote.content,
          subject: sub?.name || 'General Course',
        }),
      });

      const data = await res.json();
      if (data.summary) {
        onUpdateNote({
          ...selectedNote,
          ai_summary: data.summary,
          key_takeaways: data.key_takeaways,
        });
        onShowToast('AI Generated executive summary & active recall takeaways!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast('Failed to summarize note', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      const matchTag = n.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTag) return false;
    }
    if (selectedSubjectFilter !== 'all' && n.subject_id !== Number(selectedSubjectFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB]">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Study Notes & Active Recall</h2>
          <p className="text-xs text-[#64748B]">Capture lecture takeaways, formula cheat sheets & generate AI flashcards</p>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Note</span>
        </button>
      </div>

      {/* 2-Column Note Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Notes List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden flex flex-col h-[750px]">
          {/* Search & Subject filter */}
          <div className="p-3.5 border-b border-[#E5E7EB] space-y-2 bg-[#F8FAFC]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes & tags..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F172A] bg-white focus:outline-none font-semibold"
            >
              <option value="all">All Subjects ({notes.length})</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes list items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB] p-2 space-y-1">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#64748B]">No matching notes found.</div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                const subject = subjects.find((s) => s.id === note.subject_id);

                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setIsEditing(false);
                    }}
                    className={`p-3 rounded-xl transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-[#F5F3FF] border border-[#7C3AED]/30'
                        : 'hover:bg-[#F8FAFC] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 text-[11px]">
                      <span className="font-semibold text-[#7C3AED] truncate max-w-[140px]">
                        {subject?.name || 'General'}
                      </span>
                      <span className="text-[#64748B] tabular-nums">
                        {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className={`text-xs font-bold leading-snug line-clamp-1 text-[#0F172A]`}>
                      {note.title}
                    </div>

                    <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                      {note.content.replace(/[#*`$\\]/g, '')}
                    </p>

                    {note.ai_summary && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#06B6D4]">
                        <Sparkles className="w-2.5 h-2.5" /> AI Summarized
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Note Detail / Markdown Editor (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-6 flex flex-col h-[750px] overflow-y-auto">
          {selectedNote ? (
            isEditing ? (
              /* EDIT MODE */
              <form onSubmit={handleSaveEdit} className="space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                  <h3 className="text-sm font-bold text-[#0F172A]">Edit Note</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0F172A] mb-1">Subject</label>
                    <select
                      value={editSubjectId}
                      onChange={(e) => setEditSubjectId(Number(e.target.value))}
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
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="e.g. DP, Trees, Formulas"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-[300px]">
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Markdown Content</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write detailed notes with Markdown headers, bullet points, and code snippets..."
                    className="w-full flex-1 p-3 rounded-xl border border-[#E5E7EB] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none leading-relaxed"
                  />
                </div>
              </form>
            ) : (
              /* VIEW MODE */
              <div className="space-y-5">
                {/* Note Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[#7C3AED]">
                        {subjects.find((s) => s.id === selectedNote.subject_id)?.name || 'General'}
                      </span>
                      <span className="text-[#64748B]" aria-hidden="true">·</span>
                      <span className="text-[#64748B] tabular-nums">
                        {new Date(selectedNote.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-[#0F172A]">{selectedNote.title}</h2>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleSummarizeWithAI}
                      disabled={isSummarizing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl ai-gradient text-white hover:opacity-95 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      {isSummarizing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Summarizing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Summarize</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        onTriggerAiQuiz?.(
                          subjects.find((s) => s.id === selectedNote.subject_id)?.name || selectedNote.title,
                          selectedNote.title
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE] text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Quiz Me</span>
                    </button>

                    <button
                      onClick={() => handleStartEdit(selectedNote)}
                      className="p-1.5 rounded-xl border border-[#E5E7EB] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                      title="Edit Note"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onDeleteNote(selectedNote.id);
                        onShowToast('Note deleted', 'info');
                      }}
                      className="p-1.5 rounded-xl border border-[#E5E7EB] text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* AI Summary Block (if available) */}
                {selectedNote.ai_summary && (
                  <div className="ai-gradient-subtle rounded-2xl p-4 border border-[#7C3AED]/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
                        <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" /> AI Executive Summary & Recall Points
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedNote.ai_summary || '');
                          setCopiedSummary(true);
                          setTimeout(() => setCopiedSummary(false), 2000);
                        }}
                        className="text-[10px] font-semibold text-[#7C3AED] hover:text-[#5B21B6] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSummary ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-[#0F172A] leading-relaxed">{selectedNote.ai_summary}</p>

                    {selectedNote.key_takeaways && selectedNote.key_takeaways.length > 0 && (
                      <div className="pt-2 space-y-1">
                        <span className="text-[11px] font-bold text-[#0F172A]">Key Takeaways:</span>
                        <ul className="list-disc list-inside text-xs text-[#64748B] space-y-0.5">
                          {selectedNote.key_takeaways.map((k, i) => (
                            <li key={i}>{k}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Markdown Note Content Body */}
                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB] text-xs leading-relaxed text-[#0F172A] whitespace-pre-wrap font-sans">
                  {selectedNote.content}
                </div>

                {/* Unboxed Tags footer */}
                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 text-xs text-[#64748B]">
                    <Tag className="w-3.5 h-3.5 text-[#64748B]" />
                    {selectedNote.tags.map((tag, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span aria-hidden="true">·</span>}
                        <span className="font-medium">#{tag}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-24 text-[#64748B] text-xs">Select or create a note on the left.</div>
          )}
        </div>
      </div>
    </div>
  );
};

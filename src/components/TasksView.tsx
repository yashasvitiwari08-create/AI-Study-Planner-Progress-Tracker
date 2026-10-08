import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Play,
  Clock,
  Calendar,
  Trash2,
  Edit2,
  Kanban,
  List,
} from 'lucide-react';
import { Task, Subject, Priority, Status } from '../types';

interface TasksViewProps {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onStartFocusOnTask: (task: Task) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  subjects,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onStartFocusOnTask,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<number>(subjects[0]?.id || 1);
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('pending');
  const [tagsInput, setTagsInput] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);

  const handleOpenAdd = () => {
    setEditingTask(null);
    setTaskName('');
    setDescription('');
    setSubjectId(subjects[0]?.id || 1);
    setDueDate(new Date().toISOString().split('T')[0]);
    setEstimatedHours(2.0);
    setPriority('medium');
    setStatus('pending');
    setTagsInput('');
    setSubtasks([]);
    setShowModal(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTaskName(task.task_name);
    setDescription(task.description);
    setSubjectId(task.subject_id || subjects[0]?.id || 1);
    setDueDate(task.due_date || '');
    setEstimatedHours(task.estimated_hours);
    setPriority(task.priority);
    setStatus(task.status);
    setTagsInput(task.tags?.join(', ') || '');
    setSubtasks(task.subtasks || []);
    setShowModal(true);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: `st_${Date.now()}`, title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      onShowToast('Please enter a task name', 'error');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        task_name: taskName.trim(),
        description: description.trim(),
        subject_id: subjectId,
        due_date: dueDate || null,
        estimated_hours: Number(estimatedHours) || 1,
        priority,
        status,
        tags: parsedTags,
        subtasks,
      });
      onShowToast('Task updated', 'success');
    } else {
      onAddTask({
        task_name: taskName.trim(),
        description: description.trim(),
        subject_id: subjectId,
        plan_id: null,
        due_date: dueDate || null,
        estimated_hours: Number(estimatedHours) || 1,
        actual_hours: 0,
        priority,
        status: 'pending',
        tags: parsedTags,
        subtasks,
      });
      onShowToast('New task scheduled', 'success');
    }
    setShowModal(false);
  };

  const toggleSubtaskInTask = (task: Task, subtaskId: string) => {
    if (!task.subtasks) return;
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const allDone = updatedSubtasks.every((st) => st.completed);
    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
      status: allDone && updatedSubtasks.length > 0 ? 'completed' : task.status,
    });
  };

  const toggleTaskStatus = (task: Task) => {
    const nextStatus: Status = task.status === 'completed' ? 'pending' : 'completed';
    onUpdateTask({
      ...task,
      status: nextStatus,
      completed_at: nextStatus === 'completed' ? new Date().toISOString() : undefined,
    });
    onShowToast(nextStatus === 'completed' ? 'Task marked complete!' : 'Task moved to pending', 'info');
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.task_name.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchTag = t.tags?.some((tag) => tag.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTag) return false;
    }
    if (selectedSubjectFilter !== 'all' && t.subject_id !== Number(selectedSubjectFilter)) {
      return false;
    }
    if (selectedPriorityFilter !== 'all' && t.priority !== selectedPriorityFilter) {
      return false;
    }
    return true;
  });

  const columns: { id: Status; label: string; count: number; color: string }[] = [
    {
      id: 'pending',
      label: 'To Do',
      count: filteredTasks.filter((t) => t.status === 'pending').length,
      color: 'bg-[#64748B]',
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      count: filteredTasks.filter((t) => t.status === 'in-progress').length,
      color: 'bg-[#3B82F6]',
    },
    {
      id: 'completed',
      label: 'Completed',
      count: filteredTasks.filter((t) => t.status === 'completed').length,
      color: 'bg-[#10B981]',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB]">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments, tags, or concepts..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED] bg-[#F8FAFC]"
          />
        </div>

        {/* Filters and View Mode */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          {/* Subject Filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] bg-white focus:outline-none"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] bg-white focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* View Toggles */}
          <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E5E7EB]">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'board' ? 'bg-white text-[#7C3AED] shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#7C3AED] shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="List Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Main Task View */}
      {viewMode === 'board' ? (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div key={col.id} className="bg-white rounded-2xl p-4 border border-[#E5E7EB] flex flex-col min-h-[500px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="text-xs font-bold text-[#0F172A]">{col.label}</h3>
                  </div>
                  <span className="text-xs font-bold text-[#64748B] tabular-nums">
                    {col.count}
                  </span>
                </div>

                {/* Cards in Column */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-10 text-xs text-[#64748B]">No tasks in {col.label}</div>
                  ) : (
                    colTasks.map((task) => {
                      const subject = subjects.find((s) => s.id === task.subject_id);
                      const subtaskTotal = task.subtasks?.length || 0;
                      const subtaskDone = task.subtasks?.filter((s) => s.completed).length || 0;

                      return (
                        <div
                          key={task.id}
                          className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E5E7EB] hover:border-[#7C3AED]/40 transition-all space-y-2.5"
                        >
                          {/* Unboxed Subject & Priority Kicker */}
                          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                            <span className="text-[#7C3AED] truncate max-w-[160px]">
                              {subject?.name || 'General'}
                            </span>

                            <span
                              className={`capitalize ${
                                task.priority === 'high'
                                  ? 'text-[#EF4444]'
                                  : task.priority === 'medium'
                                  ? 'text-[#F59E0B]'
                                  : 'text-[#64748B]'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {/* Task Title */}
                          <div className="font-bold text-xs text-[#0F172A] leading-snug">{task.task_name}</div>

                          {task.description && (
                            <p className="text-[11px] text-[#64748B] line-clamp-2">{task.description}</p>
                          )}

                          {/* Subtasks Progress */}
                          {subtaskTotal > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between text-[10px] text-[#64748B] font-semibold tabular-nums">
                                <span>Subtasks</span>
                                <span>{subtaskDone}/{subtaskTotal}</span>
                              </div>
                              <div className="space-y-1">
                                {task.subtasks?.map((st) => (
                                  <div
                                    key={st.id}
                                    onClick={() => toggleSubtaskInTask(task, st.id)}
                                    className="flex items-center gap-1.5 text-[11px] text-[#0F172A] cursor-pointer"
                                  >
                                    <div
                                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                        st.completed ? 'bg-[#10B981] border-[#10B981]' : 'border-[#64748B]/40 bg-white'
                                      }`}
                                    >
                                      {st.completed && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span className={st.completed ? 'line-through text-[#64748B]' : ''}>
                                      {st.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Unboxed Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] text-[#64748B]">
                              {task.tags.map((tag, idx) => (
                                <React.Fragment key={idx}>
                                  {idx > 0 && <span aria-hidden="true">·</span>}
                                  <span>#{tag}</span>
                                </React.Fragment>
                              ))}
                            </div>
                          )}

                          {/* Footer Info & Actions */}
                          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs tabular-nums">
                            <div className="flex items-center gap-2 text-[#64748B] text-[11px]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {task.estimated_hours}h
                              </span>
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {task.due_date}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onStartFocusOnTask(task)}
                                className="p-1.5 rounded-lg bg-[#F5F3FF] text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors cursor-pointer"
                                title="Start Focus Session"
                              >
                                <Play className="w-3 h-3 fill-current" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(task)}
                                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-white transition-colors cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onDeleteTask(task.id)}
                                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B] font-semibold text-xs">
              <tr>
                <th className="p-4 w-10">Done</th>
                <th className="p-4">Task Name</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Est. Hours</th>
                <th className="p-4">Due Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#64748B]">
                    No matching tasks found.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const subject = subjects.find((s) => s.id === task.subject_id);
                  const isDone = task.status === 'completed';

                  return (
                    <tr key={task.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4">
                        <button
                          onClick={() => toggleTaskStatus(task)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                            isDone ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#64748B]/40 bg-white'
                          }`}
                        >
                          {isDone && <CheckSquare className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="p-4 font-bold text-[#0F172A]">
                        <span className={isDone ? 'line-through text-[#64748B]' : ''}>{task.task_name}</span>
                        {task.description && (
                          <div className="text-[11px] font-normal text-[#64748B] truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-[#7C3AED]">
                        {subject?.name || 'General'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-semibold capitalize ${
                            task.priority === 'high'
                              ? 'text-[#EF4444]'
                              : task.priority === 'medium'
                              ? 'text-[#F59E0B]'
                              : 'text-[#64748B]'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4 capitalize font-semibold text-[#0F172A]">
                        <span className={isDone ? 'text-[#10B981]' : task.status === 'in-progress' ? 'text-[#3B82F6]' : 'text-[#64748B]'}>
                          {task.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-[#0F172A] text-right tabular-nums">{task.estimated_hours}h</td>
                      <td className="p-4 text-[#64748B] tabular-nums">{task.due_date || '—'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onStartFocusOnTask(task)}
                            className="p-1.5 rounded-lg text-[#7C3AED] hover:bg-[#F5F3FF] cursor-pointer"
                            title="Start Focus"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-[#0F172A]">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g. Implement Dijkstra Algorithm in Python"
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
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Description & Requirements</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task details, textbook chapter, problem set numbers..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Coding, Algorithms, Midterm"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              {/* Subtasks Builder */}
              <div className="space-y-2 pt-1 border-t border-[#E5E7EB]">
                <label className="block text-xs font-bold text-[#0F172A]">Subtasks Checklist</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Add a step (press Enter)..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {subtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-xs">
                        <span>{st.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          className="text-[#64748B] hover:text-[#EF4444] cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  {editingTask ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

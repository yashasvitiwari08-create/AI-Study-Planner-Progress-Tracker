import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { SubjectsView } from './components/SubjectsView';
import { TasksView } from './components/TasksView';
import { FocusTimerView } from './components/FocusTimerView';
import { NotesView } from './components/NotesView';
import { CodingWorkspaceView } from './components/CodingWorkspaceView';
import { ProgressTrackerView } from './components/ProgressTrackerView';
import { AIInsightsView } from './components/AIInsightsView';
import { SettingsModal } from './components/SettingsModal';
import { Toast } from './components/Toast';

import {
  loadAppState,
  saveAppState,
  AppState,
} from './lib/storage';
import {
  Subject,
  StudyPlan,
  Task,
  Note,
  ProgressLog,
  AIRecommendation,
  CodingState,
  User,
  ToastItem,
} from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>(loadAppState);
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Focus Timer Shared State for Navbar Pill
  const [timerState, setTimerState] = useState<{
    isRunning: boolean;
    timeLeft: number;
    mode: 'focus' | 'break';
  }>({
    isRunning: false,
    timeLeft: 25 * 60,
    mode: 'focus',
  });

  // Active task currently routed to Focus timer
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  // Parameters to prefill AI Quiz generator
  const [quizContext, setQuizContext] = useState<{ subject?: string; topic?: string }>({});

  // Auto-persist state changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Toast helper
  const showToast = (message: string, type: ToastItem['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: ToastItem = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for Subjects
  const handleAddSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSub: Subject = {
      ...subjectData,
      id: Date.now(),
    };
    setAppState((prev) => ({
      ...prev,
      subjects: [...prev.subjects, newSub],
    }));
  };

  const handleUpdateSubject = (updated: Subject) => {
    setAppState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === updated.id ? updated : s)),
    }));
  };

  const handleDeleteSubject = (subjectId: number) => {
    setAppState((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== subjectId),
    }));
    showToast('Subject deleted', 'info');
  };

  // Handlers for Study Plans
  const handleAddPlan = (planData: Omit<StudyPlan, 'id'>) => {
    const newPlan: StudyPlan = {
      ...planData,
      id: Date.now(),
    };
    setAppState((prev) => ({
      ...prev,
      plans: [newPlan, ...prev.plans],
    }));
  };

  const handleUpdatePlan = (updated: StudyPlan) => {
    setAppState((prev) => ({
      ...prev,
      plans: prev.plans.map((p) => (p.id === updated.id ? updated : p)),
    }));
  };

  const handleDeletePlan = (planId: number) => {
    setAppState((prev) => ({
      ...prev,
      plans: prev.plans.filter((p) => p.id !== planId),
    }));
    showToast('Study plan deleted', 'info');
  };

  // Handlers for Tasks
  const handleAddTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now(),
    };
    setAppState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
  };

  const handleUpdateTask = (updated: Task) => {
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)),
    }));
  };

  const handleDeleteTask = (taskId: number) => {
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
    showToast('Task removed', 'info');
  };

  const handleToggleTaskStatus = (taskId: number) => {
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
          return {
            ...t,
            status: nextStatus,
            completed_at: nextStatus === 'completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      }),
    }));
    showToast('Task status updated', 'info');
  };

  const handleStartFocusOnTask = (task: Task) => {
    setFocusTask(task);
    setActivePage('focus');
    showToast(`Focus timer pre-loaded with "${task.task_name}"`, 'success');
  };

  // Handlers for Notes
  const handleAddNote = (noteData: Omit<Note, 'id'>) => {
    const newNote: Note = {
      ...noteData,
      id: Date.now(),
    };
    setAppState((prev) => ({
      ...prev,
      notes: [newNote, ...prev.notes],
    }));
  };

  const handleUpdateNote = (updated: Note) => {
    setAppState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === updated.id ? updated : n)),
    }));
  };

  const handleDeleteNote = (noteId: number) => {
    setAppState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId),
    }));
  };

  // Handlers for Progress
  const handleLogProgress = (logData: Omit<ProgressLog, 'id'>) => {
    const newLog: ProgressLog = {
      ...logData,
      id: Date.now(),
    };
    setAppState((prev) => ({
      ...prev,
      progress: [newLog, ...prev.progress],
      streak: prev.streak + 1,
    }));
  };

  const handleDeleteProgress = (id: number) => {
    setAppState((prev) => ({
      ...prev,
      progress: prev.progress.filter((p) => p.id !== id),
    }));
    showToast('Progress record removed', 'info');
  };

  // Handlers for AI
  const handleRefreshRecommendations = async () => {
    const res = await fetch('/api/ai/generate-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjects: appState.subjects,
        tasks: appState.tasks,
        progress: appState.progress,
        user: appState.user,
      }),
    });
    const data = await res.json();
    if (data.recommendations) {
      setAppState((prev) => ({
        ...prev,
        recommendations: data.recommendations,
      }));
    }
  };

  const handleTriggerAiQuiz = (subjectName: string, topic?: string) => {
    setQuizContext({ subject: subjectName, topic });
    setActivePage('ai');
  };

  const handleQuickAdd = (type: 'task' | 'subject' | 'plan' | 'progress') => {
    if (type === 'task') setActivePage('tasks');
    else if (type === 'subject') setActivePage('subjects');
    else if (type === 'plan') setActivePage('planner');
    else if (type === 'progress') setActivePage('progress');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#7C3AED] selection:text-white">
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        user={appState.user}
        tasks={appState.tasks}
        subjects={appState.subjects}
        streak={appState.streak}
        isTimerRunning={timerState.isRunning}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activePage={activePage}
          onNavigate={setActivePage}
          onOpenQuickAdd={handleQuickAdd}
          timerState={timerState}
        />

        <main className="flex-1 pb-16">
          {activePage === 'dashboard' && (
            <DashboardView
              subjects={appState.subjects}
              plans={appState.plans}
              tasks={appState.tasks}
              progress={appState.progress}
              recommendations={appState.recommendations}
              onNavigate={setActivePage}
              onToggleTaskStatus={handleToggleTaskStatus}
              onStartFocusOnTask={handleStartFocusOnTask}
            />
          )}

          {activePage === 'planner' && (
            <StudyPlannerView
              plans={appState.plans}
              subjects={appState.subjects}
              onAddPlan={handleAddPlan}
              onUpdatePlan={handleUpdatePlan}
              onDeletePlan={handleDeletePlan}
              onShowToast={showToast}
            />
          )}

          {activePage === 'subjects' && (
            <SubjectsView
              subjects={appState.subjects}
              onAddSubject={handleAddSubject}
              onUpdateSubject={handleUpdateSubject}
              onDeleteSubject={handleDeleteSubject}
              onNavigate={setActivePage}
              onShowToast={showToast}
              onTriggerAiQuiz={handleTriggerAiQuiz}
            />
          )}

          {activePage === 'tasks' && (
            <TasksView
              tasks={appState.tasks}
              subjects={appState.subjects}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onStartFocusOnTask={handleStartFocusOnTask}
              onShowToast={showToast}
            />
          )}

          {activePage === 'focus' && (
            <FocusTimerView
              subjects={appState.subjects}
              tasks={appState.tasks}
              activeTask={focusTask}
              onLogProgress={handleLogProgress}
              onShowToast={showToast}
              onUpdateTimerState={setTimerState}
            />
          )}

          {activePage === 'notes' && (
            <NotesView
              notes={appState.notes}
              subjects={appState.subjects}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onTriggerAiQuiz={handleTriggerAiQuiz}
              onShowToast={showToast}
            />
          )}

          {activePage === 'coding' && (
            <CodingWorkspaceView
              codingState={appState.coding}
              onUpdateCodingState={(updater) =>
                setAppState((prev) => ({
                  ...prev,
                  coding: updater(prev.coding),
                }))
              }
              onShowToast={showToast}
            />
          )}

          {activePage === 'progress' && (
            <ProgressTrackerView
              progress={appState.progress}
              subjects={appState.subjects}
              streak={appState.streak}
              onLogProgress={handleLogProgress}
              onDeleteProgress={handleDeleteProgress}
              onShowToast={showToast}
            />
          )}

          {(activePage === 'ai' || activePage === 'coach' || activePage === 'quiz') && (
            <AIInsightsView
              user={appState.user}
              subjects={appState.subjects}
              tasks={appState.tasks}
              progress={appState.progress}
              recommendations={appState.recommendations}
              chatHistory={appState.chatHistory || []}
              onUpdateChatHistory={(newMsgs) =>
                setAppState((prev) => ({ ...prev, chatHistory: newMsgs }))
              }
              quizHistory={appState.quizHistory || []}
              onSaveQuizResult={(newResult) =>
                setAppState((prev) => ({
                  ...prev,
                  quizHistory: [newResult, ...(prev.quizHistory || [])],
                }))
              }
              weakTopics={appState.weakTopics || []}
              onAddWeakTopic={(topic) =>
                setAppState((prev) => ({
                  ...prev,
                  weakTopics: Array.from(new Set([...(prev.weakTopics || []), topic])),
                }))
              }
              onRemoveWeakTopic={(topic) =>
                setAppState((prev) => ({
                  ...prev,
                  weakTopics: (prev.weakTopics || []).filter((t) => t !== topic),
                }))
              }
              onRefreshRecommendations={handleRefreshRecommendations}
              onLogStudyProgress={handleLogProgress}
              onNavigateToPage={(p) => setActivePage(p as PageId)}
              onShowToast={showToast}
              initialTab={activePage === 'coach' ? 'coach' : activePage === 'quiz' ? 'quiz' : 'recommendations'}
              initialQuizSubject={quizContext.subject}
              initialQuizTopic={quizContext.topic}
            />
          )}
        </main>
      </div>

      {/* Settings & Profile Modal */}
      {showSettings && (
        <SettingsModal
          user={appState.user}
          onUpdateUser={(updated) => setAppState((prev) => ({ ...prev, user: updated }))}
          onRestoreState={(restored) => setAppState(restored)}
          onClose={() => setShowSettings(false)}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}

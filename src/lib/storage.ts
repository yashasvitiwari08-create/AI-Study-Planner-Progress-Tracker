import {
  Subject,
  StudyPlan,
  Task,
  Note,
  ProgressLog,
  AIRecommendation,
  CodingState,
  User,
  AIChatMessage,
  QuizSessionResult,
} from '../types';
import {
  initialSubjects,
  initialPlans,
  initialTasks,
  initialNotes,
  initialProgress,
  initialRecommendations,
  initialUser,
} from '../data/initialData';

const STORAGE_KEY = 'studyai_app_state_v3';

export interface AppState {
  user: User;
  subjects: Subject[];
  plans: StudyPlan[];
  tasks: Task[];
  notes: Note[];
  progress: ProgressLog[];
  recommendations: AIRecommendation[];
  coding: CodingState;
  streak: number;
  chatHistory: AIChatMessage[];
  quizHistory: QuizSessionResult[];
  weakTopics: string[];
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        user: parsed.user || initialUser,
        subjects: parsed.subjects?.length ? parsed.subjects : initialSubjects,
        plans: parsed.plans?.length ? parsed.plans : initialPlans,
        tasks: parsed.tasks?.length ? parsed.tasks : initialTasks,
        notes: parsed.notes?.length ? parsed.notes : initialNotes,
        progress: parsed.progress?.length ? parsed.progress : initialProgress,
        recommendations: parsed.recommendations?.length
          ? parsed.recommendations
          : initialRecommendations,
        coding: parsed.coding || {
          solved: 14,
          streak: 5,
          langs: ['Python', 'JavaScript', 'C++'],
          recentHistory: [],
        },
        streak: parsed.streak || 5,
        chatHistory: parsed.chatHistory || [],
        quizHistory: parsed.quizHistory || [],
        weakTopics: parsed.weakTopics || ['Dynamic Programming Memoization', 'B+ Tree Index Splitting', 'Eigenvalue Decomposition'],
      };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }

  return {
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
    streak: 5,
    chatHistory: [],
    quizHistory: [],
    weakTopics: ['Dynamic Programming Memoization', 'B+ Tree Index Splitting', 'Eigenvalue Decomposition'],
  };
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}


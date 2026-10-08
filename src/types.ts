export type Priority = 'high' | 'medium' | 'low';
export type Status = 'pending' | 'in-progress' | 'completed' | 'overdue';
export type PlanStatus = 'pending' | 'in-progress' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  major: string;
  targetGpa?: string;
  semester?: string;
  avatarUrl?: string;
}

export interface Subject {
  id: number;
  name: string;
  code?: string;
  color?: string;
  exam_date: string | null;
  priority: Priority;
  target_grade?: string;
  credit_hours?: number;
  syllabus?: string;
  created_at?: string;
}

export interface StudyPlan {
  id: number;
  subject_id: number | null;
  plan_name: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  status: PlanStatus;
  notes?: string;
  daily_breakdown?: {
    day: number;
    date: string;
    topic: string;
    target_hours: number;
    completed: boolean;
  }[];
}

export interface Task {
  id: number;
  subject_id: number | null;
  plan_id: number | null;
  task_name: string;
  description: string;
  due_date: string | null;
  estimated_hours: number;
  actual_hours?: number;
  status: Status;
  priority: Priority;
  tags?: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  completed_at?: string;
}

export interface Note {
  id: number;
  subject_id: number | null;
  title: string;
  content: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  ai_summary?: string;
  key_takeaways?: string[];
}

export interface ProgressLog {
  id: number;
  subject_id: number | null;
  date: string;
  hours: number;
  topics: string;
  notes: string;
  rating?: number; // 1-5 productivity/difficulty rating
  session_type?: 'pomodoro' | 'revision' | 'practice' | 'lecture' | 'coding';
}

export interface AIRecommendation {
  id: number;
  title: string;
  text: string;
  details?: string;
  category: 'urgent' | 'strategy' | 'praise' | 'schedule' | 'wellness';
  generated_date: string;
  action_label?: string;
  action_page?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedPrompts?: string[];
  intent?: 'conversational' | 'academic' | 'programming' | 'strategy';
}

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Master';
export type QuizQuestionType = 'mcq' | 'true_false' | 'short_answer' | 'fill_blank' | 'mixed';

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'fill_blank';
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  acceptableAnswers?: string[];
  explanation: string;
  hint?: string;
  topic?: string;
}

export interface QuizUserAnswer {
  questionId: string;
  selectedOptionIndex?: number;
  textAnswer?: string;
  isCorrect: boolean;
  score?: number; // 0 or 1
  feedback?: string;
}

export interface QuizSessionResult {
  id: string;
  timestamp: string;
  subject: string;
  topic: string;
  difficulty: QuizDifficulty;
  questionType: QuizQuestionType;
  totalQuestions: number;
  score: number;
  percentage: number;
  timeSpentSeconds: number;
  questions: QuizQuestion[];
  userAnswers: Record<string, QuizUserAnswer>;
  weakTopicsIdentified?: string[];
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: 'python' | 'javascript' | 'cpp' | 'java' | 'typescript';
  prompt: string;
  starterCode: string;
  solutionExample?: string;
  testCases: { input: string; expected: string }[];
}

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  isEntry?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionRecord {
  id: string;
  timestamp: string;
  filename: string;
  code: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTime: number;
  status: 'success' | 'error' | 'timeout';
  pythonVersion: string;
}

export interface AIDebugResult {
  errorType: string;
  lineNumber: number | null;
  explanation: string;
  suggestedFix: string;
  correctedCode: string;
}

export interface CodingState {
  solved: number;
  streak: number;
  langs: string[];
  files?: CodeFile[];
  activeFileId?: string;
  history?: ExecutionRecord[];
  recentHistory: {
    problemTitle: string;
    language: string;
    date: string;
    codeSnippet: string;
  }[];
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

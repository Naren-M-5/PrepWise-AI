export interface Definition {
  term: string;
  definition: string;
}

export interface Formula {
  name: string;
  formula: string;
  description: string;
}

export interface StudySummary {
  summary: string;
  key_concepts: string[];
  definitions: Definition[];
  formulas: Formula[];
}

export interface RevisionSheet {
  quick: string;
  standard: string;
  exam_night: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  type: 'mcq' | 'tf' | 'short';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface StudyPlanItem {
  day: number;
  focus: string;
  tasks: string[];
  hours: number;
}

export interface StudyPlan {
  id: string;
  subjects: string[];
  examDate: string;
  hoursPerDay: number;
  priorityRecommendations: string[];
  schedule: StudyPlanItem[];
  createdAt: string;
}

export interface NightBeforeExamData {
  must_study: string[];
  can_skip: string[];
  likely_areas: string[];
  checklist: string[];
}

export interface QuizResult {
  id: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
}

export interface StudySession {
  id: string;
  filename: string;
  uploadedAt: string;
  textLength: number;
  extractedText: string;
  summary?: StudySummary;
  revision?: RevisionSheet;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  nightBefore?: NightBeforeExamData;
}

export interface LearningInsights {
  weaknessSummary: string;
  chartData: { subject: string; score: number; fullMark: number }[];
  miniRevisionPack: {
    concept: string;
    explanation: string;
    flashcards: Flashcard[];
    quizzes: QuizQuestion[];
  };
}

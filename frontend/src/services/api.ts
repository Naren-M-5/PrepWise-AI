import type { 
  StudySummary, 
  RevisionSheet, 
  Flashcard, 
  QuizQuestion, 
  StudyPlan, 
  NightBeforeExamData,
  LearningInsights,
  QuizResult
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, timeoutMs: number = 45000): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(id);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
      throw new ApiError(errorData.error || response.statusText, response.status);
    }
    
    return await response.json() as T;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server took too long to respond. (Render cold starts can take up to 50 seconds)');
    }
    console.error(`API Request to ${endpoint} failed:`, error);
    throw error;
  }
}

export const apiService = {
  // Extract text from uploaded PDF file
  async extractText(file: File): Promise<{ filename: string; textLength: number; extractedText: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return request<{ filename: string; textLength: number; extractedText: string }>('/api/extract-text', {
      method: 'POST',
      body: formData,
    });
  },

  // Generate study kit summary
  async generateSummary(text: string): Promise<StudySummary> {
    return request<StudySummary>('/api/generate-summary', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Generate revision notes (Quick, Standard, Exam)
  async generateRevision(text: string): Promise<RevisionSheet> {
    return request<RevisionSheet>('/api/generate-revision', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Generate study flashcards
  async generateFlashcards(text: string): Promise<Flashcard[]> {
    return request<Flashcard[]>('/api/generate-flashcards', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Generate study quiz (MCQ, True/False, Short Answer)
  async generateQuiz(text: string): Promise<QuizQuestion[]> {
    return request<QuizQuestion[]>('/api/generate-quiz', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  // Chat with the AI tutor
  async chatTutor(
    context: string, 
    history: { role: 'user' | 'model'; content: string }[], 
    message: string, 
    mode: string
  ): Promise<{ response: string }> {
    return request<{ response: string }>('/api/chat-tutor', {
      method: 'POST',
      body: JSON.stringify({ context, history, message, mode }),
    });
  },

  // Generate learning insights and Mini Revision Pack from quiz logs
  async generateLearningInsights(quizResults: QuizResult[]): Promise<LearningInsights> {
    return request<LearningInsights>('/api/generate-learning-insights', {
      method: 'POST',
      body: JSON.stringify({ quizResults }),
    });
  },

  // Generate study plans
  async generateStudyPlan(subjects: string[], examDate: string, hoursPerDay: number): Promise<Omit<StudyPlan, 'id' | 'createdAt'>> {
    return request<Omit<StudyPlan, 'id' | 'createdAt'>>('/api/generate-study-plan', {
      method: 'POST',
      body: JSON.stringify({ subjects, examDate, hoursPerDay }),
    });
  },

  // Generate Night Before Exam mode high-yield details
  async generateNightBeforeExam(text: string, timeLeft: string): Promise<NightBeforeExamData> {
    return request<NightBeforeExamData>('/api/night-before-exam', {
      method: 'POST',
      body: JSON.stringify({ text, timeLeft }),
    });
  }
};

import type { StudySession, StudyPlan, QuizResult } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'prepwise_sessions',
  ACTIVE_SESSION_ID: 'prepwise_active_session_id',
  STUDY_PLANS: 'prepwise_study_plans',
  QUIZ_RESULTS: 'prepwise_quiz_results',
  THEME: 'prepwise_theme',
};

export const storageService = {
  // --- STUDY SESSIONS ---
  getSessions(): StudySession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading study sessions:', e);
      return [];
    }
  },

  saveSession(session: StudySession): void {
    try {
      const sessions = this.getSessions();
      const index = sessions.findIndex(s => s.id === session.id);
      if (index > -1) {
        sessions[index] = session;
      } else {
        sessions.unshift(session); // Add to beginning
      }
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error saving study session:', e);
    }
  },

  getSession(id: string): StudySession | undefined {
    return this.getSessions().find(s => s.id === id);
  },

  deleteSession(id: string): void {
    try {
      const sessions = this.getSessions().filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      
      // If deleted active session, reset active session
      if (this.getActiveSessionId() === id) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
      }
    } catch (e) {
      console.error('Error deleting study session:', e);
    }
  },

  getActiveSessionId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
  },

  setActiveSessionId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    }
  },

  getActiveSession(): StudySession | undefined {
    const activeId = this.getActiveSessionId();
    if (!activeId) return undefined;
    return this.getSession(activeId);
  },

  // --- STUDY PLANS ---
  getStudyPlans(): StudyPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_PLANS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading study plans:', e);
      return [];
    }
  },

  saveStudyPlan(plan: StudyPlan): void {
    try {
      const plans = this.getStudyPlans();
      plans.unshift(plan); // Keep newest on top
      localStorage.setItem(STORAGE_KEYS.STUDY_PLANS, JSON.stringify(plans));
    } catch (e) {
      console.error('Error saving study plan:', e);
    }
  },

  getLatestStudyPlan(): StudyPlan | undefined {
    const plans = this.getStudyPlans();
    return plans.length > 0 ? plans[0] : undefined;
  },

  // --- QUIZ RESULTS ---
  getQuizResults(): QuizResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading quiz results:', e);
      return [];
    }
  },

  saveQuizResult(result: QuizResult): void {
    try {
      const results = this.getQuizResults();
      results.unshift(result);
      localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(results));
    } catch (e) {
      console.error('Error saving quiz result:', e);
    }
  },

  // --- THEME PREFERENCE ---
  getTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    // Default to dark mode for modern high-tech feel
    return 'dark';
  },

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },
};

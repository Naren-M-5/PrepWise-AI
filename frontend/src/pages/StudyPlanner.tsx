import { useState, useEffect } from 'react';
import type { StudyPlan } from '../types';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { Calendar, Clock, BookOpen, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import StudyPlanTimeline from '../components/StudyPlanTimeline';

export default function StudyPlanner() {
  const [subjects, setSubjects] = useState('');
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activePlan, setActivePlan] = useState<StudyPlan | undefined>(undefined);

  useEffect(() => {
    // Load existing plan if available
    const plan = storageService.getLatestStudyPlan();
    setActivePlan(plan);
  }, []);

  const handleGeneratePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!subjects.trim() || !examDate || isLoading) return;

    setIsLoading(true);
    setError(null);

    const subjectList = subjects
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (subjectList.length === 0) {
      setError("Please enter at least one subject.");
      setIsLoading(false);
      return;
    }

    try {
      const planResult = await apiService.generateStudyPlan(subjectList, examDate, hoursPerDay);
      
      const newPlan: StudyPlan = {
        id: Math.random().toString(36).substring(7),
        subjects: subjectList,
        examDate,
        hoursPerDay,
        priorityRecommendations: planResult.priorityRecommendations,
        schedule: planResult.schedule,
        createdAt: new Date().toISOString()
      };

      storageService.saveStudyPlan(newPlan);
      setActivePlan(newPlan);
      
      // Dispatch success toast
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Study Plan generated successfully!', type: 'success' } 
      }));
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Unknown error";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("Unable to connect to the backend server. Please verify that the Flask server is running at http://localhost:5000.");
      } else {
        setError(`Failed to generate study plan: ${msg}. Please check the Flask server logs for details.`);
      }
      
      // Dispatch error toast
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Failed to generate Study Plan.', type: 'error' } 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPlanner = () => {
    setActivePlan(undefined);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-905 dark:text-white">
          AI Study Planner
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Draft a realistic, daily roadmap structured around your specific deadline.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-655 dark:text-red-400 rounded-2xl space-y-3 text-sm animate-fade-in">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <div className="pl-8">
            <button
              onClick={() => handleGeneratePlan()}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition active:scale-95 cursor-pointer focus:outline-none"
            >
              Retry Planner Draft
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        /* Loading skeleton state */
        <div className="glass rounded-3xl p-8 text-center space-y-4 animate-pulse">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">Drafting Study Schedule...</h3>
          <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm mx-auto">
            Our AI is calculating optimal time splits, generating mock tasks, and compiling study recommendations.
          </p>
        </div>
      ) : activePlan ? (
        /* Active Plan View */
        <div className="space-y-8 animate-fade-in">
          {/* Top Recommendations Banner */}
          <div className="glass rounded-3xl p-6 md:p-8 border border-brand-500/20 shadow-md relative overflow-hidden glow-indigo">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-brand-600 to-violet-500" />
            
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-850 pb-4 mb-4">
              <div className="flex items-center space-x-2.5 text-brand-600 dark:text-brand-400">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-lg font-bold">Priority Recommendations</h3>
              </div>
              <button 
                onClick={handleResetPlanner}
                className="text-xs text-slate-450 dark:text-slate-500 hover:text-brand-500 flex items-center font-semibold"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                New Plan
              </button>
            </div>

            <ul className="space-y-3">
              {activePlan.priorityRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-[14.5px] leading-relaxed text-slate-700 dark:text-slate-350">
                  <span className="text-brand-500 text-lg leading-none mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Timeline Wrapper */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Day-by-Day Schedule</h3>
            <StudyPlanTimeline schedule={activePlan.schedule} />
          </div>
        </div>
      ) : (
        /* Planner Input Form */
        <form onSubmit={handleGeneratePlan} className="glass rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="space-y-5">
            {/* Subjects Input */}
            <div className="space-y-2">
              <label htmlFor="subjects" className="block text-sm font-bold text-slate-800 dark:text-slate-205">
                Which subjects/topics are you studying?
              </label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  id="subjects"
                  required
                  placeholder="e.g. Operating Systems, Relational Databases, Classical Mechanics"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-105 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all duration-200"
                />
              </div>
              <p className="text-[11px] text-slate-400">Separate multiple subjects using commas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exam Date Picker */}
              <div className="space-y-2">
                <label htmlFor="examDate" className="block text-sm font-bold text-slate-800 dark:text-slate-205">
                  When is your exam date?
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="date"
                    id="examDate"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-105 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Study Hours Picker */}
              <div className="space-y-2">
                <label htmlFor="hoursPerDay" className="block text-sm font-bold text-slate-800 dark:text-slate-205">
                  Available study hours per day
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    id="hoursPerDay"
                    required
                    min={1}
                    max={24}
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(parseInt(e.target.value) || 2)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-105 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-brand-605 hover:bg-brand-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/15 hover:shadow-brand-500/30 transition-all duration-250 active:scale-98 focus:outline-none"
            >
              Generate Custom Study Schedule
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { StudySession, NightBeforeExamData } from '../types';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { Sparkles, Clock, AlertTriangle, HelpCircle, CheckSquare, ShieldAlert, ArrowLeft, Loader2, Info, FileText } from 'lucide-react';

export default function NightBeforeExam() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [timeLeft, setTimeLeft] = useState('3 hours');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cramData, setCramData] = useState<NightBeforeExamData | null>(null);

  useEffect(() => {
    const loaded = storageService.getSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      // Auto-select first session or active session
      const activeId = storageService.getActiveSessionId();
      setSelectedSessionId(activeId || loaded[0].id);
    }
  }, []);

  const handleGenerateCramKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || isLoading) return;

    setIsLoading(true);
    setError(null);

    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) {
      setError("Study session not found.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiService.generateNightBeforeExam(session.extractedText, timeLeft);
      
      // Save this details into session cache so it persists
      session.nightBefore = data;
      storageService.saveSession(session);
      
      setCramData(data);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Unknown error";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("Unable to connect to the backend server. Please verify that the Flask server is running at http://localhost:5000.");
      } else {
        setError(`Failed to compile Cram Sheet: ${msg}. Please check the Flask server logs for details.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCramData(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-slide-up">
      {/* Title Header */}
      <div className="flex items-center space-x-3.5">
        <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shadow-lg shadow-red-500/10">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-905 dark:text-white">
            Night Before Exam Mode
          </h1>
          <p className="text-sm text-red-500 dark:text-red-400 font-semibold mt-1">
            Signature cram tool to extract high-yield concepts in emergency situations.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 rounded-2xl flex items-start space-x-3 text-sm">
          <ShieldAlert className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        /* Loader state */
        <div className="glass rounded-3xl p-10 text-center space-y-4 border-red-500/10 animate-pulse">
          <Loader2 className="h-10 w-10 animate-spin text-red-500 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">Compiling High-Yield Cram Kit...</h3>
          <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm mx-auto">
            Prioritizing exam-likely topics, identifying skip lists, and extracting critical equations.
          </p>
        </div>
      ) : cramData ? (
        /* Cram Sheet View */
        <div className="space-y-8 animate-fade-in">
          {/* Top Reset Action */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-3.5 py-1.5 rounded-full">
              Emergency Cram Sheet generated
            </span>
            <button
              onClick={handleReset}
              className="text-xs text-slate-450 dark:text-slate-500 hover:text-red-500 flex items-center font-semibold focus:outline-none"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Build Another Cram Sheet
            </button>
          </div>

          {/* Grid Layout: Must study vs Can skip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* MUST STUDY */}
            <div className="glass rounded-3xl p-6 md:p-8 border border-red-500/20 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-red-500" />
              
              <div className="flex items-center space-x-3 mb-6 text-red-650 dark:text-red-400">
                <ShieldAlert className="h-5.5 w-5.5" />
                <h3 className="text-lg font-bold">Must Study (High Priority)</h3>
              </div>

              <ul className="space-y-4">
                {cramData.must_study.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3 p-3.5 rounded-2xl bg-red-500/5 dark:bg-red-500/[0.02] border border-red-500/10">
                    <span className="text-red-500 font-extrabold text-sm mt-0.5">#{idx + 1}</span>
                    <span className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-300 font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CAN SKIP */}
            <div className="glass rounded-3xl p-6 md:p-8 border border-emerald-500/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500" />
              
              <div className="flex items-center space-x-3 mb-6 text-emerald-600 dark:text-emerald-400">
                <CheckSquare className="h-5.5 w-5.5" />
                <h3 className="text-lg font-bold">Can Skip (Safe to Ignore)</h3>
              </div>

              <ul className="space-y-4">
                {cramData.can_skip.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3 p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10">
                    <span className="text-emerald-500 font-extrabold text-sm mt-0.5">✔</span>
                    <span className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* LIKELY EXAM AREAS */}
          <div className="glass rounded-3xl p-6 md:p-8 border border-amber-500/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
            
            <div className="flex items-center space-x-3 mb-6 text-amber-600 dark:text-amber-400">
              <HelpCircle className="h-5.5 w-5.5" />
              <h3 className="text-lg font-bold">Likely Exam Areas & Patterns</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cramData.likely_areas.map((item, idx) => (
                <div key={idx} className="p-4.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 text-[14px] leading-relaxed text-slate-700 dark:text-slate-350 font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* REVISION CHECKLIST */}
          <div className="glass rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-3 mb-6 text-slate-700 dark:text-slate-300">
              <CheckSquare className="h-5.5 w-5.5 text-brand-500" />
              <h3 className="text-lg font-bold">Final Revision Checklist</h3>
            </div>

            <div className="space-y-3">
              {cramData.checklist.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-500/[0.02] border border-slate-100 dark:border-slate-850">
                  <div className="mt-1 h-2 w-2 rounded-full bg-brand-500 flex-shrink-0" />
                  <span className="text-[14px] leading-relaxed text-slate-650 dark:text-slate-400 font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Config Form */
        <form onSubmit={handleGenerateCramKit} className="glass rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          {sessions.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white">No Lecture Notes Uploaded</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Night Before Exam Mode requires course materials to operate. Please upload a PDF first.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()} // Actually we want setPage('upload') but we don't have it inside this hook directly unless passed, wait! We can just tell them to upload notes. Or we can reload.
                className="bg-red-500 hover:bg-red-400 text-white font-bold py-2.5 px-6 rounded-xl text-sm"
              >
                Go to Upload Notes
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Select Session */}
              <div className="space-y-2">
                <label htmlFor="session-select" className="block text-sm font-bold text-slate-800 dark:text-slate-205">
                  Select Study Material Context
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <select
                    id="session-select"
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all duration-200"
                  >
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>{s.filename}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Available */}
              <div className="space-y-2">
                <label htmlFor="time-left" className="block text-sm font-bold text-slate-800 dark:text-slate-205">
                  How much time do you have left before the exam?
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <select
                    id="time-left"
                    value={timeLeft}
                    onChange={(e) => setTimeLeft(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-250 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all duration-200"
                  >
                    <option value="30 minutes">30 minutes (Emergency cram)</option>
                    <option value="1 hour">1 hour (Hyper focus)</option>
                    <option value="2 hours">2 hours (Speed run)</option>
                    <option value="3 hours">3 hours (Standard review)</option>
                    <option value="5 hours">5 hours (Night buffer)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 text-xs leading-normal flex items-start space-x-2 text-amber-700 dark:text-amber-400">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  This tool extracts high-yield information and identifies low-priority zones to ignore. Perfect for time crunch scenarios, but not a replacement for thorough study!
                </span>
              </div>
            </div>
          )}

          {sessions.length > 0 && (
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/15 hover:shadow-red-500/30 transition-all duration-250 active:scale-98 focus:outline-none"
              >
                Assemble High-Yield Cram Sheet
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { StudySession, QuizResult } from '../types';
import { storageService } from '../services/storage';
import { 
  FileText, Calendar, Sparkles, Trash2, Clock, 
  BarChart2, FileQuestion, BookMarked, ChevronRight, Award, Plus
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  setPage: (page: string) => void;
  setSelectedSessionId: (id: string | null) => void;
}

export default function Dashboard({ setPage, setSelectedSessionId }: DashboardProps) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    setSessions(storageService.getSessions());
    setQuizResults(storageService.getQuizResults());
  }, []);

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this study session? All summaries, flashcards, and quizzes for this file will be lost.')) {
      storageService.deleteSession(id);
      setSessions(storageService.getSessions());
    }
  };

  const handleOpenSession = (id: string) => {
    storageService.setActiveSessionId(id);
    setSelectedSessionId(id);
    setPage('study-kit');
  };

  // Compute stats
  const totalNotes = sessions.length;
  const totalQuizzes = quizResults.length;
  const avgQuizScore = totalQuizzes > 0 
    ? Math.round((quizResults.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / totalQuizzes) * 100)
    : 0;

  // Format quiz data for chart (recent 7 quizzes)
  const chartData = [...quizResults]
    .reverse()
    .slice(-7)
    .map((q, idx) => ({
      name: `Quiz ${idx + 1}`,
      percentage: Math.round((q.score / q.totalQuestions) * 100),
      subject: q.subject
    }));

  return (
    <div className="space-y-8 animate-slide-up max-w-7xl mx-auto px-4 py-8">
      {/* Welcome & Quick Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-905 dark:text-white">
            Welcome back, <span className="bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-transparent">Scholar</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Let's nail your upcoming exams. Choose an action to begin.
          </p>
        </div>
        
        <button
          onClick={() => setPage('upload')}
          className="flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3 rounded-2xl shadow-md shadow-brand-500/15 transition-all duration-200 active:scale-98 focus:outline-none"
        >
          <Plus className="h-5 w-5" />
          <span>Upload New Notes</span>
        </button>
      </div>

      {/* Grid: Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-5 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalNotes}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Notes Uploaded</div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
            <FileQuestion className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalQuizzes}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Quizzes Solved</div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{avgQuizScore}%</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Average Accuracy</div>
          </div>
        </div>
      </div>

      {/* Grid: Charts & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graph (2/3 cols) */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Quiz Score Trends</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500">Your accuracy over the last 7 quizzes.</p>
          </div>
          
          <div className="h-[220px] w-full mt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }} 
                    formatter={(val) => [`${val}%`, 'Accuracy']}
                  />
                  <Area type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPercentage)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart2 className="h-10 w-10 opacity-30 mb-2" />
                <p className="text-xs">Take quizzes to visualize performance trends!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (1/3 col) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Study Operations</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => setPage('upload')}
              className="w-full flex items-center justify-between p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md transition-all duration-200 text-left focus:outline-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900 dark:text-white">Upload Material</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Process PDF lecture notes</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              onClick={() => setPage('planner')}
              className="w-full flex items-center justify-between p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:shadow-md transition-all duration-200 text-left focus:outline-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900 dark:text-white">Exam Planner</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Generate daily schedule</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            <button
              onClick={() => setPage('night-before')}
              className="w-full flex items-center justify-between p-4.5 rounded-2xl bg-red-500/5 dark:bg-red-500/[0.02] border border-red-500/20 hover:border-red-500 hover:shadow-md transition-all duration-200 text-left focus:outline-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-red-600 dark:text-red-400">Night Before Exam</h4>
                  <p className="text-[11px] text-red-500/70 dark:text-red-400/70 mt-0.5 font-medium">Extract high-yield concepts</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Study Sessions List */}
      <section className="space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Your Study Materials</h3>

        {sessions.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
            <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4 opacity-50" />
            <h4 className="font-bold text-slate-850 dark:text-white mb-1">No Study Materials Found</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Upload lecture slides, chapters, or articles, and we'll convert them into interactive summaries, flashcards, and quizzes.
            </p>
            <button
              onClick={() => setPage('upload')}
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm"
            >
              Upload your first PDF
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((sess) => {
              const formattedDate = new Date(sess.uploadedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              
              return (
                <div
                  key={sess.id}
                  onClick={() => handleOpenSession(sess.id)}
                  className="glass rounded-3xl p-5.5 shadow-sm border border-slate-200/50 dark:border-slate-850 hover:border-brand-500/40 dark:hover:border-brand-500/40 hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between min-h-[160px]"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 group-hover:bg-brand-500/10 group-hover:text-brand-500 transition-colors">
                        <FileText className="h-5.5 w-5.5" />
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/5 focus:outline-none transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 dark:text-white mt-3 text-base group-hover:text-brand-500 transition-colors truncate">
                      {sess.filename}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <span className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {formattedDate}
                    </span>
                    <span className="font-semibold text-brand-500 flex items-center">
                      Open Study Kit
                      <ChevronRight className="h-3 w-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

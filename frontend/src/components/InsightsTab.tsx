import { useState, useEffect } from 'react';
import type { LearningInsights } from '../types';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { 
  TrendingUp, AlertTriangle, BookOpen, HelpCircle, 
  ArrowLeft, ArrowRight, RotateCw, Info, Loader2, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip 
} from 'recharts';

interface InsightsTabProps {
  onResultsChangedTrigger?: number;
}

export default function InsightsTab({ onResultsChangedTrigger = 0 }: InsightsTabProps) {
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePackTab, setActivePackTab] = useState<'explanation' | 'flashcards' | 'quiz'>('explanation');
  
  // Flashcard states inside pack
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz states inside pack
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = storageService.getQuizResults();
      const data = await apiService.generateLearningInsights(results);
      setInsights(data);
    } catch (err) {
      console.error('Error fetching learning insights:', err);
      setError('Could not generate insights. Please make sure the Flask backend is active.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [onResultsChangedTrigger]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        <p className="text-sm font-semibold">Analyzing your performance history...</p>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="glass rounded-3xl p-8 text-center max-w-md mx-auto border-red-500/20">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Analysis Failed</h4>
        <p className="text-sm text-slate-500 mb-6">{error || 'Unable to retrieve insights.'}</p>
        <button
          onClick={fetchInsights}
          className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  const hasQuizHistory = storageService.getQuizResults().length > 0;
  const pack = insights.miniRevisionPack;

  const handleCardNext = () => {
    if (cardIdx < pack.flashcards.length - 1) {
      setCardIdx(cardIdx + 1);
      setIsFlipped(false);
    }
  };

  const handleCardPrev = () => {
    if (cardIdx > 0) {
      setCardIdx(cardIdx - 1);
      setIsFlipped(false);
    }
  };

  const handleOptionSelect = (qIdx: number, option: string) => {
    if (quizSubmitted) return;
    setQuizAnswers({
      ...quizAnswers,
      [qIdx]: option
    });
  };

  const handleQuizSubmit = () => {
    let calculated = 0;
    pack.quizzes.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        calculated += 1;
      }
    });
    setQuizScore(calculated);
    setQuizSubmitted(true);
  };

  const handleQuizReset = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Top Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Weakness callout & description */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-3xl p-6 shadow-sm border border-brand-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingUp className="h-24 w-24" />
            </div>
            
            <div className="flex items-center space-x-2.5 mb-4 text-brand-600 dark:text-brand-400">
              <TrendingUp className="h-5 w-5" />
              <h3 className="text-lg font-bold">Learning Insights</h3>
            </div>
            
            <p className="text-slate-755 dark:text-slate-350 text-[14.5px] leading-relaxed">
              {insights.weaknessSummary}
            </p>
            
            {!hasQuizHistory && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start space-x-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Showing default demo data. Attempt a Quiz in the study kit tab to see real personalized analytics here!
                </span>
              </div>
            )}
          </div>

          <div className="glass rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm uppercase tracking-wider">Recommendations</h4>
            <ul className="space-y-3.5 text-[13.5px] text-slate-550 dark:text-slate-400">
              <li className="flex items-start space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                <span>Review the **Mini Revision Pack** on the right side of this screen.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                <span>Ask AI Tutor to explain concepts in **Simple Words** mode.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                <span>Take a short 10-minute break before re-testing.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Recharts Chart */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Subject Accuracy (%)</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500">Based on recently logged study quizzes.</p>
          </div>
          
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              {insights.chartData.length >= 3 ? (
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={insights.chartData}>
                  <PolarGrid stroke="#475569" strokeDasharray="3 3" opacity={0.3} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 550 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                  <Radar 
                    name="Accuracy" 
                    dataKey="score" 
                    stroke="#6366f1" 
                    fill="#6366f1" 
                    fillOpacity={0.25} 
                  />
                </RadarChart>
              ) : (
                <BarChart data={insights.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff' 
                    }} 
                  />
                  <Bar dataKey="score" fill="url(#brandGrad)" radius={[8, 8, 0, 0]} barSize={40} />
                  <defs>
                    <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mini Revision Pack */}
      {pack && (
        <section className="glass rounded-3xl p-6 md:p-8 shadow-sm border border-brand-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-brand-500 via-violet-500 to-emerald-500" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5 mb-6">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 text-white shadow-md shadow-brand-500/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personalized Mini Revision Pack</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
                  Targeting: <strong className="text-brand-500">{pack.concept}</strong>
                </p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
              <button
                onClick={() => setActivePackTab('explanation')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activePackTab === 'explanation'
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5 inline mr-1" />
                Explanation
              </button>
              <button
                onClick={() => setActivePackTab('flashcards')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activePackTab === 'flashcards'
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <RotateCw className="h-3.5 w-3.5 inline mr-1" />
                Flashcards
              </button>
              <button
                onClick={() => setActivePackTab('quiz')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activePackTab === 'quiz'
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5 inline mr-1" />
                Quiz Test
              </button>
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="min-h-[200px]">
            {/* 1. Explanation Tab */}
            {activePackTab === 'explanation' && (
              <div className="space-y-4 text-slate-650 dark:text-slate-350 text-[14.5px] leading-relaxed max-w-3xl">
                <p className="whitespace-pre-wrap">{pack.explanation}</p>
              </div>
            )}

            {/* 2. Flashcards Tab */}
            {activePackTab === 'flashcards' && pack.flashcards && pack.flashcards.length > 0 && (
              <div className="max-w-md mx-auto space-y-6">
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="perspective-1000 w-full h-[180px] cursor-pointer"
                >
                  <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between items-center text-center">
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Question</span>
                      <p className="font-bold text-slate-800 dark:text-white text-[15px]">{pack.flashcards[cardIdx].front}</p>
                      <span className="text-[10px] text-brand-500 font-bold uppercase">Click to flip</span>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-brand-900 text-white rounded-2xl p-6 flex flex-col justify-between items-center text-center">
                      <span className="text-[10px] text-brand-300 font-bold tracking-wider uppercase">Explanation</span>
                      <p className="font-semibold text-slate-100 text-[14.5px] overflow-y-auto w-full pr-1">{pack.flashcards[cardIdx].back}</p>
                      <span className="text-[10px] text-brand-300 font-bold uppercase">Click to flip</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <button 
                    onClick={handleCardPrev} 
                    disabled={cardIdx === 0}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-slate-450 font-bold">
                    Card {cardIdx + 1} of {pack.flashcards.length}
                  </span>
                  <button 
                    onClick={handleCardNext} 
                    disabled={cardIdx === pack.flashcards.length - 1}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Quiz Tab */}
            {activePackTab === 'quiz' && pack.quizzes && pack.quizzes.length > 0 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                {quizSubmitted && (
                  <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Review Completed</h4>
                      <p className="text-xs text-slate-550 dark:text-slate-400">Score: {quizScore} out of {pack.quizzes.length}</p>
                    </div>
                    <button 
                      onClick={handleQuizReset}
                      className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg"
                    >
                      Reset Quiz
                    </button>
                  </div>
                )}
                
                <div className="space-y-4">
                  {pack.quizzes.map((q, idx) => {
                    return (
                      <div key={idx} className="p-5 rounded-2xl bg-slate-500/[0.02] border border-slate-200/50 dark:border-slate-800/80">
                        <h4 className="font-bold text-slate-850 dark:text-white text-[14px] mb-3">{idx + 1}. {q.question}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options?.map((opt, optIdx) => {
                            const isOptSelected = quizAnswers[idx] === opt;
                            const isOptCorrect = opt === q.correctAnswer;
                            
                            let btnClass = 'border-slate-200 dark:border-slate-800/60 bg-white/20 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/20';
                            if (isOptSelected && !quizSubmitted) {
                              btnClass = 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400';
                            } else if (quizSubmitted) {
                              if (isOptCorrect) {
                                btnClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-600';
                              } else if (isOptSelected) {
                                btnClass = 'border-red-500 bg-red-500/10 text-red-600';
                              } else {
                                btnClass = 'border-slate-200 dark:border-slate-850 opacity-50';
                              }
                            }
                            
                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleOptionSelect(idx, opt)}
                                disabled={quizSubmitted}
                                className={`p-3 rounded-xl border text-[13px] font-semibold text-left transition-all duration-200 ${btnClass}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {quizSubmitted && (
                          <p className="mt-3 text-xs text-slate-400 italic">
                            Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {!quizSubmitted && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleQuizSubmit}
                      className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs"
                    >
                      Submit Mini Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import type { StudySession } from '../types';
import { ArrowLeft, BookOpen, Clock, FileText, Sparkles, MessageCircle, HelpCircle, TrendingUp } from 'lucide-react';

// Sub-tabs
import SummaryTab from '../components/SummaryTab';
import RevisionTab from '../components/RevisionTab';
import FlashcardTab from '../components/FlashcardTab';
import QuizTab from '../components/QuizTab';
import TutorTab from '../components/TutorTab';
import InsightsTab from '../components/InsightsTab';

interface StudyKitProps {
  setPage: (page: string) => void;
  sessionId: string | null;
}

type TabType = 'summary' | 'revision' | 'flashcards' | 'quiz' | 'tutor' | 'insights';

export default function StudyKit({ setPage, sessionId }: StudyKitProps) {
  const [session, setSession] = useState<StudySession | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [insightsRefreshTrigger, setInsightsRefreshTrigger] = useState(0);

  useEffect(() => {
    let activeId = sessionId;
    if (!activeId) {
      activeId = storageService.getActiveSessionId();
    }
    
    if (activeId) {
      const sess = storageService.getSession(activeId);
      setSession(sess);
    }
  }, [sessionId]);

  if (!session) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6">
        <BookOpen className="h-16 w-16 mx-auto text-slate-400 opacity-40 animate-pulse" />
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">No Active Study Kit</h3>
          <p className="text-sm text-slate-500 mt-2">
            You haven't opened a study kit or uploaded any lecture notes yet.
          </p>
        </div>
        <button
          onClick={() => setPage('upload')}
          className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm"
        >
          Upload Notes Now
        </button>
      </div>
    );
  }

  // Define tab buttons data
  const tabs = [
    { id: 'summary', label: 'Summary', icon: BookOpen },
    { id: 'revision', label: 'Revision', icon: Clock },
    { id: 'flashcards', label: 'Flashcards', icon: Sparkles },
    { id: 'quiz', label: 'Practice Quiz', icon: HelpCircle },
    { id: 'tutor', label: 'Ask Tutor', icon: MessageCircle },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
  ];

  const handleQuizCompleted = () => {
    // Increment trigger to force InsightsTab to fetch latest LocalStorage results
    setInsightsRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-slide-up">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-850 pb-6">
        <div className="flex items-center space-x-3.5 min-w-0">
          <button
            onClick={() => setPage('dashboard')}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-400 focus:outline-none transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate pr-4">
              {session.filename}
            </h1>
            <p className="text-xs text-slate-400 flex items-center mt-1 font-medium">
              <FileText className="h-3.5 w-3.5 mr-1" />
              {(session.textLength / 1000).toFixed(1)}k characters parsed
            </p>
          </div>
        </div>

        {/* Quick actions in kit header */}
        <div className="flex space-x-2">
          <button
            onClick={() => setPage('night-before')}
            className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all duration-200"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Night Before Cram Mode</span>
          </button>
        </div>
      </div>

      {/* Tabs Panel */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-slate-200/50 dark:border-slate-850">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap focus:outline-none ${
                isActive
                  ? 'bg-brand-500/10 dark:bg-brand-500/15 text-brand-650 dark:text-brand-400 shadow-sm border border-brand-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="pt-2">
        {activeTab === 'summary' && session.summary && (
          <SummaryTab summary={session.summary} />
        )}
        
        {activeTab === 'revision' && session.revision && (
          <RevisionTab revision={session.revision} />
        )}
        
        {activeTab === 'flashcards' && session.flashcards && (
          <FlashcardTab cards={session.flashcards} />
        )}
        
        {activeTab === 'quiz' && session.quiz && (
          <QuizTab 
            quiz={session.quiz} 
            subject={session.filename.replace(/\.[^/.]+$/, "")} // Strip extension for topic log
            onQuizCompleted={handleQuizCompleted}
          />
        )}
        
        {activeTab === 'tutor' && (
          <TutorTab extractedText={session.extractedText} />
        )}
        
        {activeTab === 'insights' && (
          <InsightsTab onResultsChangedTrigger={insightsRefreshTrigger} />
        )}
      </div>
    </div>
  );
}

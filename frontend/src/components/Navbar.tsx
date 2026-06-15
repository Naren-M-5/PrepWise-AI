import { GraduationCap, LayoutDashboard, Calendar, Sparkles, BookOpen } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { storageService } from '../services/storage';

interface NavbarProps {
  currentPage: string;
  setPage: (page: string) => void;
}

export default function Navbar({ currentPage, setPage }: NavbarProps) {
  const activeSession = storageService.getActiveSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-brand-950/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => setPage('dashboard')}
          className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity focus:outline-none"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <GraduationCap className="h-5.5 w-5.5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            PrepWise <span className="text-brand-500 font-extrabold">AI</span>
          </span>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setPage('dashboard')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none ${
              currentPage === 'dashboard'
                ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </button>

          {activeSession && (
            <button
              onClick={() => setPage('study-kit')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none ${
                currentPage === 'study-kit'
                  ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Study Kit</span>
            </button>
          )}

          <button
            onClick={() => setPage('planner')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none ${
              currentPage === 'planner'
                ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Study Planner</span>
          </button>

          <button
            onClick={() => setPage('night-before')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none relative overflow-hidden group ${
              currentPage === 'night-before'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-red-500/5 hover:text-red-500'
            }`}
          >
            <Sparkles className="h-4 w-4 text-red-500 group-hover:animate-pulse" />
            <span className="font-semibold">Night Before Exam</span>
          </button>
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <button
            onClick={() => setPage('upload')}
            className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-brand-600 to-violet-600 text-white hover:from-brand-500 hover:to-violet-500 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand-500/15 hover:shadow-brand-500/25 transition-all duration-200 active:scale-95 focus:outline-none"
          >
            <span>Upload Notes</span>
          </button>
        </div>
      </div>
      
      {/* Mobile nav indicator bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-brand-950/90 py-2.5 px-2">
        <button
          onClick={() => setPage('dashboard')}
          className={`flex flex-col items-center space-y-1 text-xs focus:outline-none ${
            currentPage === 'dashboard' ? 'text-brand-500' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </button>
        
        <button
          onClick={() => setPage('upload')}
          className={`flex flex-col items-center space-y-1 text-xs focus:outline-none ${
            currentPage === 'upload' ? 'text-brand-500' : 'text-slate-400'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          <span>Upload</span>
        </button>

        <button
          onClick={() => setPage('planner')}
          className={`flex flex-col items-center space-y-1 text-xs focus:outline-none ${
            currentPage === 'planner' ? 'text-brand-500' : 'text-slate-400'
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span>Planner</span>
        </button>

        <button
          onClick={() => setPage('night-before')}
          className={`flex flex-col items-center space-y-1 text-xs focus:outline-none ${
            currentPage === 'night-before' ? 'text-red-500' : 'text-slate-400'
          }`}
        >
          <Sparkles className="h-5 w-5 text-red-500" />
          <span>Cram Mode</span>
        </button>
      </div>
    </header>
  );
}

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import UploadNotes from './pages/UploadNotes';
import StudyKit from './pages/StudyKit';
import StudyPlanner from './pages/StudyPlanner';
import NightBeforeExam from './pages/NightBeforeExam';
import Toast from './components/Toast';
import { storageService } from './services/storage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Initialize theme on app mount
  useEffect(() => {
    const theme = storageService.getTheme();
    const root = window.document.documentElement;
    const body = window.document.body;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, []);

  // Listen for toast dispatches
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: 'success' | 'error' }>;
      if (customEvent.detail) {
        setToast({
          message: customEvent.detail.message,
          type: customEvent.detail.type
        });
      }
    };
    
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const navigateToPage = (pageName: string) => {
    setCurrentPage(pageName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col relative overflow-hidden">
      {/* Background radial glow effects for premium dark layout */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-brand-500/5 dark:bg-brand-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-[120px] pointer-events-none" />

      {/* Sticky Glass Navbar */}
      <Navbar currentPage={currentPage} setPage={navigateToPage} />

      {/* Main Pages Frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 relative z-10">
        {currentPage === 'dashboard' && (
          <Dashboard setPage={navigateToPage} setSelectedSessionId={setSelectedSessionId} />
        )}
        
        {currentPage === 'upload' && (
          <UploadNotes setPage={navigateToPage} setSelectedSessionId={setSelectedSessionId} />
        )}
        
        {currentPage === 'study-kit' && (
          <StudyKit setPage={navigateToPage} sessionId={selectedSessionId} />
        )}
        
        {currentPage === 'planner' && (
          <StudyPlanner />
        )}
        
        {currentPage === 'night-before' && (
          <NightBeforeExam setPage={navigateToPage} />
        )}
      </main>

      {/* Global Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}


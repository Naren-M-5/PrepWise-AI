import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`fixed bottom-5 right-5 z-55 flex items-center space-x-3 p-4 rounded-2xl shadow-xl border animate-fade-in ${
      type === 'success'
        ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md'
        : 'bg-red-500/15 border-red-500/20 text-red-600 dark:text-red-400 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md'
    }`}>
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
      )}
      <span className="text-[13px] font-bold leading-normal">{message}</span>
      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

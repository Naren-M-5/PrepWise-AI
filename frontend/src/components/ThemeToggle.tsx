import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { storageService } from '../services/storage';

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => storageService.getTheme());

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    storageService.setTheme(theme);
  }, [theme]);

  return (
    <button
      onClick={() => setThemeState(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-brand-500 dark:hover:text-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-[18px] w-[18px] animate-fade-in" />
      ) : (
        <Moon className="h-[18px] w-[18px] animate-fade-in" />
      )}
    </button>
  );
}

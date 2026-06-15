import { useState } from 'react';
import type { RevisionSheet } from '../types';
import { Zap, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RevisionTabProps {
  revision: RevisionSheet;
}

export default function RevisionTab({ revision }: RevisionTabProps) {
  const [mode, setMode] = useState<'quick' | 'standard' | 'exam_night'>('quick');

  const renderContent = (markdownText: string) => {
    if (!markdownText) return null;
    
    const lines = markdownText.split('\n');
    return (
      <div className="space-y-4 text-slate-700 dark:text-slate-350 leading-relaxed text-[15px]">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-2" />;

          // Process headings
          if (trimmed.startsWith('###')) {
            return (
              <h4 key={idx} className="text-lg font-bold text-slate-900 dark:text-white pt-3 pb-1">
                {trimmed.replace(/^###\s*/, '')}
              </h4>
            );
          }
          if (trimmed.startsWith('####')) {
            return (
              <h5 key={idx} className="text-base font-bold text-slate-900 dark:text-white pt-2 pb-1">
                {trimmed.replace(/^####\s*/, '')}
              </h5>
            );
          }
          if (trimmed.startsWith('##')) {
            return (
              <h3 key={idx} className="text-xl font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2 pt-4">
                {trimmed.replace(/^##\s*/, '')}
              </h3>
            );
          }

          // Process bullet points
          if (trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
            const cleanText = trimmed.replace(/^[•*\-]\s*/, '');
            return (
              <div key={idx} className="flex items-start space-x-3 pl-2">
                <span className="text-brand-500 text-lg leading-none mt-0.5">•</span>
                <span className="flex-1">{parseInlineStyles(cleanText)}</span>
              </div>
            );
          }

          return <p key={idx}>{parseInlineStyles(trimmed)}</p>;
        })}
      </div>
    );
  };

  // Helper to handle inline bolding (**text**)
  const parseInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-extrabold text-slate-900 dark:text-white bg-brand-500/5 dark:bg-brand-500/10 px-1 rounded">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Selector Grid */}
      <div className="grid grid-cols-3 gap-3 p-1.5 rounded-2xl bg-slate-150 dark:bg-slate-900/60 max-w-xl">
        <button
          onClick={() => setMode('quick')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none ${
            mode === 'quick'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">2-Min Overview</span>
          <span className="sm:hidden">Quick</span>
        </button>

        <button
          onClick={() => setMode('standard')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none ${
            mode === 'standard'
              ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">10-Min Study Guide</span>
          <span className="sm:hidden">Standard</span>
        </button>

        <button
          onClick={() => setMode('exam_night')}
          className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none ${
            mode === 'exam_night'
              ? 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20'
              : 'text-slate-650 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="hidden sm:inline">Exam Night Cheat Sheet</span>
          <span className="sm:hidden">Exam Night</span>
        </button>
      </div>

      {/* Content Sheet */}
      <div className="glass rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {mode === 'exam_night' && (
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-red-500 to-amber-500" />
        )}
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
              {mode === 'quick' && 'Quick Mode'}
              {mode === 'standard' && 'Standard Mode'}
              {mode === 'exam_night' && 'High Yield'}
            </span>
            <span className="text-slate-400 text-xs flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              AI Verified
            </span>
          </div>
        </div>

        {mode === 'quick' && renderContent(revision.quick)}
        {mode === 'standard' && renderContent(revision.standard)}
        {mode === 'exam_night' && renderContent(revision.exam_night)}
      </div>
    </div>
  );
}

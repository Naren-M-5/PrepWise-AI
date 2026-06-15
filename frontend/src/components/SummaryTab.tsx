import type { StudySummary } from '../types';
import { BookOpen, Key, Bookmark, Info, HelpCircle } from 'lucide-react';

interface SummaryTabProps {
  summary: StudySummary;
}

export default function SummaryTab({ summary }: SummaryTabProps) {
  const hasFormulas = summary.formulas && summary.formulas.length > 0;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Overview Card */}
      <section className="glass rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500">
            <BookOpen className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Executive Summary</h2>
        </div>
        <p className="text-slate-650 dark:text-slate-350 leading-relaxed text-[15px] whitespace-pre-wrap">
          {summary.summary}
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Key Concepts */}
        <section className="glass rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
              <Key className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Key Concepts</h2>
          </div>
          <ul className="space-y-4">
            {summary.key_concepts.map((concept, idx) => {
              const parts = concept.split(':');
              const title = parts[0];
              const desc = parts.slice(1).join(':');
              return (
                <li key={idx} className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-500/5 dark:bg-slate-900/40">
                  <div className="mt-1 h-2 w-2 rounded-full bg-violet-500 flex-shrink-0" />
                  <span className="text-slate-650 dark:text-slate-350 text-[14.5px]">
                    {desc ? (
                      <>
                        <strong className="text-slate-850 dark:text-slate-200">{title}:</strong>
                        {desc}
                      </>
                    ) : (
                      concept
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Definitions */}
        <section className="glass rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Bookmark className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Important Definitions</h2>
          </div>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {summary.definitions.map((def, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/20 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-colors duration-200"
              >
                <h3 className="font-bold text-slate-950 dark:text-white text-base mb-1.5">{def.term}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-[13.5px] leading-relaxed">{def.definition}</p>
              </div>
            ))}
            {summary.definitions.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No specific definitions found in this segment.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Formulas (Conditional) */}
      {hasFormulas && (
        <section className="glass rounded-3xl p-6 md:p-8 shadow-sm glow-indigo">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Important Formulas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summary.formulas.map((form, idx) => (
              <div 
                key={idx} 
                className="flex flex-col justify-between p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all duration-200"
              >
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2 uppercase tracking-wider">{form.name}</h3>
                  <div className="py-4 px-3 my-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 font-mono text-[17px] font-bold text-center text-brand-600 dark:text-brand-400 overflow-x-auto border border-slate-100 dark:border-slate-900">
                    {form.formula}
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-455 text-xs mt-2 italic leading-relaxed">
                  {form.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

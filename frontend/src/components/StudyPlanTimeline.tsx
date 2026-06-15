import { useState } from 'react';
import type { StudyPlanItem } from '../types';
import { CalendarDays, CheckCircle, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface StudyPlanTimelineProps {
  schedule: StudyPlanItem[];
}

export default function StudyPlanTimeline({ schedule }: StudyPlanTimelineProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [taskCompleted, setTaskCompleted] = useState<Record<string, boolean>>({});

  const toggleDay = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  const toggleTask = (day: number, taskIdx: number) => {
    const key = `${day}-${taskIdx}`;
    setTaskCompleted({
      ...taskCompleted,
      [key]: !taskCompleted[key]
    });
  };

  return (
    <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 md:ml-6 space-y-6 py-2">
      {schedule.map((item) => {
        const isExpanded = expandedDay === item.day;
        
        // Calculate task progress for the day
        const dayTasks = item.tasks || [];
        const completedCount = dayTasks.filter((_, idx) => taskCompleted[`${item.day}-${idx}`]).length;
        const progressPct = dayTasks.length > 0 ? (completedCount / dayTasks.length) * 100 : 0;

        return (
          <div key={item.day} className="relative pl-8 md:pl-10 pb-2">
            {/* Timeline node */}
            <span className={`absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
              progressPct === 100
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {item.day}
            </span>

            {/* Accordion Card */}
            <div className="glass rounded-2xl border border-slate-200/50 dark:border-slate-850/80 shadow-sm overflow-hidden hover:border-slate-350 dark:hover:border-slate-800 transition-all duration-200">
              {/* Header */}
              <div 
                onClick={() => toggleDay(item.day)}
                className="p-5 flex items-center justify-between cursor-pointer select-none bg-white/20 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/35 transition-colors duration-150"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-base font-bold text-slate-905 dark:text-white truncate">
                      Day {item.day}: {item.focus}
                    </h4>
                    {progressPct === 100 && (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full flex-shrink-0">
                        Done
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-450 mt-1.5 font-medium">
                    <span className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {item.hours} hours study
                    </span>
                    <span className="flex items-center">
                      <CalendarDays className="h-3.5 w-3.5 mr-1" />
                      {completedCount}/{dayTasks.length} tasks
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Progress bar preview */}
                  <div className="hidden sm:block w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expandable tasks list */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-850 p-5 bg-white/10 dark:bg-slate-950/20 space-y-4 animate-fade-in">
                  <div className="space-y-2.5">
                    {dayTasks.map((task, idx) => {
                      const isCompleted = !!taskCompleted[`${item.day}-${idx}`];
                      return (
                        <div 
                          key={idx}
                          onClick={() => toggleTask(item.day, idx)}
                          className="flex items-start space-x-3 p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900/60 cursor-pointer hover:border-brand-500/20 dark:hover:border-brand-500/20 hover:bg-slate-100/30 dark:hover:bg-slate-900/80 transition-all duration-150"
                        >
                          <button className="mt-0.5 flex-shrink-0 text-slate-400 dark:text-slate-600 focus:outline-none">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500 animate-fade-in" />
                            ) : (
                              <Circle className="h-5 w-5 hover:text-brand-500 transition-colors" />
                            )}
                          </button>
                          <span className={`text-[14px] font-semibold transition-all duration-150 ${
                            isCompleted 
                              ? 'line-through text-slate-400 dark:text-slate-650' 
                              : 'text-slate-700 dark:text-slate-350'
                          }`}>
                            {task}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

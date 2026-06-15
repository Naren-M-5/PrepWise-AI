import { useState } from 'react';
import type { QuizQuestion, QuizResult } from '../types';
import { storageService } from '../services/storage';
import { CheckCircle2, XCircle, RotateCcw, Award, Check, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizTabProps {
  quiz: QuizQuestion[];
  subject: string;
  onQuizCompleted?: () => void;
}

export default function QuizTab({ quiz, subject, onQuizCompleted }: QuizTabProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="text-center py-12 glass rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <AlertCircle className="h-12 w-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-1">No Quiz Available</h3>
        <p className="text-slate-500 text-sm">Failed to generate quiz questions for this material. Try re-uploading.</p>
      </div>
    );
  }

  const handleOptionSelect = (qIdx: number, option: string) => {
    if (isSubmitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [qIdx]: option,
    });
  };

  const handleShortTextChange = (qIdx: number, val: string) => {
    if (isSubmitted) return;
    setShortAnswers({
      ...shortAnswers,
      [qIdx]: val,
    });
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    
    let calculatedScore = 0;
    
    quiz.forEach((q, idx) => {
      if (q.type === 'mcq' || q.type === 'tf') {
        if (selectedAnswers[idx] === q.correctAnswer) {
          calculatedScore += 1;
        }
      } else if (q.type === 'short') {
        const studentAns = (shortAnswers[idx] || '').trim().toLowerCase();
        const correctAns = q.correctAnswer.trim().toLowerCase();
        if (studentAns === correctAns || correctAns.includes(studentAns) && studentAns.length > 2) {
          calculatedScore += 1;
        }
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);

    // Save to LocalStorage
    const quizResult: QuizResult = {
      id: Math.random().toString(36).substring(7),
      subject: subject || 'General Study',
      score: calculatedScore,
      totalQuestions: quiz.length,
      correctAnswers: calculatedScore,
      completedAt: new Date().toISOString(),
    };
    storageService.saveQuizResult(quizResult);

    // Trigger completion callback to update insights if listening
    if (onQuizCompleted) {
      onQuizCompleted();
    }

    // Confetti celebration
    if (calculatedScore === quiz.length) {
      // Perfect score! Gold confetti blast
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#eab308', '#f59e0b', '#6366f1', '#a855f7']
      });
    } else if (calculatedScore / quiz.length >= 0.7) {
      // Good score
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShortAnswers({});
    setIsSubmitted(false);
    setScore(0);
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Top Banner */}
      {isSubmitted && (
        <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between border-brand-500/20 shadow-md glow-indigo">
          <div className="flex items-center space-x-5 mb-4 md:mb-0">
            <div className="h-14 w-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quiz Completed!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Your results have been saved to your Weak Topic Tracker.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center md:text-right">
              <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">
                {score} / {quiz.length}
              </div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Score ({Math.round((score / quiz.length) * 100)}%)
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retake Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* Questions Stack */}
      <div className="space-y-6">
        {quiz.map((q, idx) => {
          const isCorrect = q.type === 'short' 
            ? (shortAnswers[idx] || '').trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
            : selectedAnswers[idx] === q.correctAnswer;

          return (
            <div 
              key={idx} 
              className={`glass rounded-3xl p-6 md:p-8 shadow-sm transition-all duration-300 relative overflow-hidden ${
                isSubmitted
                  ? isCorrect
                    ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
                    : 'border-red-500/20 bg-red-500/[0.02]'
                  : 'hover:border-slate-300 dark:hover:border-slate-800'
              }`}
            >
              {/* Question Number Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-450 dark:text-slate-500">
                  Question {idx + 1} • {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'tf' ? 'True / False' : 'Short Answer'}
                </span>
                
                {isSubmitted && (
                  isCorrect ? (
                    <span className="flex items-center text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Correct
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-red-500 font-bold bg-red-500/10 px-2.5 py-1 rounded-full">
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Incorrect
                    </span>
                  )
                )}
              </div>

              {/* Question Text */}
              <h4 className="text-[17px] font-bold text-slate-900 dark:text-white mb-5 leading-relaxed">
                {q.question}
              </h4>

              {/* Options/Answers input */}
              {q.type === 'mcq' && q.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {q.options.map((option, optIdx) => {
                    const isSelected = selectedAnswers[idx] === option;
                    const isOptionCorrect = option === q.correctAnswer;
                    
                    let btnClass = 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/30';
                    if (isSelected && !isSubmitted) {
                      btnClass = 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400';
                    } else if (isSubmitted) {
                      if (isOptionCorrect) {
                        btnClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450';
                      } else if (isSelected) {
                        btnClass = 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400';
                      } else {
                        btnClass = 'border-slate-200 dark:border-slate-850 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleOptionSelect(idx, option)}
                        disabled={isSubmitted}
                        className={`flex items-center justify-between p-4 rounded-2xl border text-[14.5px] font-semibold text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/10 ${btnClass}`}
                      >
                        <span className="flex-1 pr-2">{option}</span>
                        {isSubmitted && isOptionCorrect && (
                          <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'tf' && (
                <div className="flex space-x-4 max-w-sm">
                  {['True', 'False'].map((option) => {
                    const isSelected = selectedAnswers[idx] === option;
                    const isOptionCorrect = option === q.correctAnswer;
                    
                    let btnClass = 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/30';
                    if (isSelected && !isSubmitted) {
                      btnClass = 'border-brand-500 bg-brand-500/5 text-brand-600 dark:text-brand-400';
                    } else if (isSubmitted) {
                      if (isOptionCorrect) {
                        btnClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450';
                      } else if (isSelected) {
                        btnClass = 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400';
                      } else {
                        btnClass = 'border-slate-200 dark:border-slate-850 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect(idx, option)}
                        disabled={isSubmitted}
                        className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 focus:outline-none ${btnClass}`}
                      >
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'short' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={isSubmitted ? "No answer entered" : "Type your short answer here..."}
                    value={shortAnswers[idx] || ''}
                    onChange={(e) => handleShortTextChange(idx, e.target.value)}
                    disabled={isSubmitted}
                    className={`w-full max-w-md px-4 py-3 rounded-2xl border text-[14.5px] font-semibold bg-white/40 dark:bg-slate-900/10 transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                      isSubmitted
                        ? isCorrect
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
                          : 'border-red-500 bg-red-500/5 text-red-700 dark:text-red-300'
                        : 'border-slate-200 dark:border-slate-850 focus:border-brand-500'
                    }`}
                  />
                  {isSubmitted && !isCorrect && (
                    <div className="text-xs text-slate-400 mt-1 pl-1">
                      Expected answer: <strong className="text-emerald-500">{q.correctAnswer}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Explanations (Shown after submission) */}
              {isSubmitted && (
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-500/[0.01] p-3 rounded-xl">
                  <strong className="text-slate-800 dark:text-slate-200 block mb-1">Explanation:</strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      {!isSubmitted && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35 transition-all duration-250 active:scale-98 focus:outline-none"
          >
            Submit All Answers
          </button>
        </div>
      )}
    </div>
  );
}

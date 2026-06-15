import { useState, useEffect } from 'react';
import type { Flashcard } from '../types';
import { ArrowLeft, ArrowRight, RotateCw, BookOpen, AlertCircle } from 'lucide-react';

interface FlashcardTabProps {
  cards: Flashcard[];
}

export default function FlashcardTab({ cards }: FlashcardTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip when shifting cards
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-12 glass rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <AlertCircle className="h-12 w-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-1">No Flashcards Found</h3>
        <p className="text-slate-500 text-sm">Failed to generate flashcards for this material. Try re-uploading.</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
      {/* Instructions header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500 flex items-center">
          <BookOpen className="h-4 w-4 mr-1.5 text-brand-500" />
          Card {currentIndex + 1} of {cards.length}
        </span>
        <span className="text-xs text-slate-400">Click card to reveal answer</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* 3D Flashcard */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="perspective-1000 w-full h-[320px] cursor-pointer"
      >
        <div 
          className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* FRONT (Question) */}
          <div className="absolute inset-0 backface-hidden glass rounded-3xl p-6 md:p-10 flex flex-col justify-between items-center text-center shadow-lg hover:shadow-xl dark:shadow-brand-950/20 border border-slate-200/50 dark:border-slate-800">
            <div className="w-full flex justify-between items-center text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <span>Concept / Question</span>
              <RotateCw className="h-4 w-4" />
            </div>
            
            <div className="flex-1 flex items-center justify-center py-6">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentCard.front}
              </h3>
            </div>
            
            <span className="text-xs text-brand-500 font-bold tracking-wide uppercase">Click to Flip</span>
          </div>

          {/* BACK (Answer) */}
          <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gradient-to-br from-brand-900 to-violet-950 dark:from-slate-900 dark:to-brand-950 rounded-3xl p-6 md:p-10 flex flex-col justify-between items-center text-center shadow-lg border border-brand-500/20">
            <div className="w-full flex justify-between items-center text-brand-400 text-xs uppercase tracking-wider font-semibold">
              <span>Explanation / Answer</span>
              <RotateCw className="h-4 w-4" />
            </div>
            
            <div className="flex-1 flex items-center justify-center py-6 overflow-y-auto w-full pr-1">
              <p className="text-base md:text-lg text-slate-100 leading-relaxed font-medium">
                {currentCard.back}
              </p>
            </div>
            
            <span className="text-xs text-brand-400 font-bold tracking-wide uppercase">Click to Flip Back</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 focus:outline-none ${
            currentIndex === 0
              ? 'border-slate-150 dark:border-slate-850 text-slate-300 dark:text-slate-700 cursor-not-allowed'
              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <span className="text-sm font-semibold text-slate-400">
          {currentIndex + 1} / {cards.length}
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 focus:outline-none ${
            currentIndex === cards.length - 1
              ? 'border-slate-150 dark:border-slate-850 text-slate-300 dark:text-slate-700 cursor-not-allowed'
              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <span>Next</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

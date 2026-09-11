'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Flashcard } from '@/types/kit';
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  Loader2, 
  RotateCcw, 
  Bookmark,
  X,
  Sparkles,
  MousePointerClick,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

export default function PracticeModePage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [animatingDirection, setAnimatingDirection] = useState<'next' | 'prev' | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;

    // Swipe Left (Next card)
    if (deltaX < -40 && currentIndex < flashcards.length - 1) {
      changeCardWithAnimation('next', currentIndex + 1);
    } 
    // Swipe Right (Previous card)
    else if (deltaX > 40 && currentIndex > 0) {
      changeCardWithAnimation('prev', currentIndex - 1);
    }

    setTouchStartX(null);
  };

  useEffect(() => {
    if (kitId) {
      fetchKitAndOrderCards();
    }
  }, [kitId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'l') {
        if (currentIndex < flashcards.length - 1) {
          changeCardWithAnimation('next', currentIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        if (currentIndex > 0) {
          changeCardWithAnimation('prev', currentIndex - 1);
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsRevealed((prev) => !prev);
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsBookmarked((prev) => !prev);
      } else if (e.key === 'Escape') {
        router.push(`/kits/${kitId}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, flashcards.length, kitId]);

  const fetchKitAndOrderCards = async () => {
    try {
      setLoading(true);
      const res = await api.getKitById(kitId);
      if (res.data && res.data.flashcards) {
        const cards: Flashcard[] = [...res.data.flashcards];
        cards.sort((a, b) => (a.confidence || 0) - (b.confidence || 0));
        setFlashcards(cards);
      }
    } catch (err: any) {
      console.warn('Failed to load flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeCardWithAnimation = (direction: 'next' | 'prev', targetIndex: number) => {
    if (animatingDirection || targetIndex < 0 || targetIndex >= flashcards.length) return;
    setAnimatingDirection(direction);
    setTimeout(() => {
      setCurrentIndex(targetIndex);
      setIsRevealed(false);
      setAnimatingDirection(null);
    }, 250);
  };

  const handleConfidenceRating = async (score: number) => {
    if (flashcards.length === 0) return;
    const currentCard = flashcards[currentIndex];

    const updatedCards = [...flashcards];
    updatedCards[currentIndex] = { ...currentCard, confidence: score };
    setFlashcards(updatedCards);

    try {
      await api.updateFlashcardConfidence(kitId, currentCard.id, score);
    } catch (err: any) {
      console.warn('Failed to save confidence rating:', err);
    }

    if (currentIndex < flashcards.length - 1) {
      changeCardWithAnimation('next', currentIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      changeCardWithAnimation('next', currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      changeCardWithAnimation('prev', currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FBFBF8] text-[#0A0A0A] flex flex-col items-center justify-center font-mono text-xs">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl border border-[#E5E5DF] shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
          <p className="tracking-widest text-[#777777]">[ LOADING DISTRACTION-FREE PRACTICE... ]</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FBFBF8] p-4 font-mono text-xs text-[#0A0A0A]">
        <div className="max-w-md w-full p-8 bg-white border border-[#E5E5DF] rounded-2xl text-center space-y-6 shadow-xl">
          <div className="space-y-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#0A0A0A]">[ NO FLASHCARDS AVAILABLE ]</h2>
            <p className="text-xs text-[#666666] leading-relaxed">No practice cards were generated for this prep kit yet.</p>
          </div>
          <Link 
            href={`/kits/${kitId}`} 
            className="bg-[#0A0A0A] text-white hover:bg-[#222222] font-bold text-xs py-3 px-6 rounded-xl uppercase tracking-wider inline-block shadow-sm transition-all"
          >
            RETURN TO KIT WORKSPACE
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const percentComplete = Math.round(((currentIndex + 1) / flashcards.length) * 100);
  const remainingCards = flashcards.length - 1 - currentIndex;

  return (
    <div className={`fixed inset-0 z-50 w-screen h-screen transition-colors duration-300 flex flex-col justify-between p-4 sm:p-8 font-sans select-none overflow-hidden ${
      isDarkMode 
        ? 'bg-[#09090B] text-white' 
        : 'bg-[#FBFBF8] bg-tech-grid text-[#0A0A0A]'
    }`}>
      
      {/* Background Subtle Grid Overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          isDarkMode ? 'opacity-10' : 'opacity-40'
        }`}
        style={{
          backgroundImage: `
            linear-gradient(to right, ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.035)'} 1px, transparent 1px),
            linear-gradient(to bottom, ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.035)'} 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      ></div>

      {/* TOP HEADER: Progress Bar, Complete Badge & Theme Toggle */}
      <header className="relative z-10 max-w-4xl mx-auto w-full pt-2 px-1 sm:px-2 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between text-xs font-sans gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-3 font-mono shrink-0">
            <Link
              href={`/kits/${kitId}`}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border rounded-lg font-mono text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap ${
                isDarkMode 
                  ? 'bg-[#18181B] border-[#27272A] text-white hover:bg-[#27272A]' 
                  : 'bg-white border-[#CBD5E1] hover:border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#F4F4F0]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>

            <span className={`hidden sm:inline ${isDarkMode ? 'text-[#3F3F46]' : 'text-[#CBD5E1]'}`}>|</span>

            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#84CC16] animate-pulse"></span>
              <span className={`font-bold tracking-wider uppercase text-[10px] sm:text-xs whitespace-nowrap ${isDarkMode ? 'text-[#A1A1AA]' : 'text-[#0F172A]'}`}>PRACTICE SESSION</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 font-mono text-xs shrink-0">
            <span className={`whitespace-nowrap ${isDarkMode ? 'text-[#A1A1AA] font-medium' : 'text-[#64748B] font-medium'}`}>
              <strong className={isDarkMode ? 'text-white font-bold' : 'text-[#0F172A] font-bold'}>{currentIndex + 1} / {flashcards.length}</strong> <span className="hidden xs:inline">cards</span>
            </span>

            <span className={`font-bold px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-sans whitespace-nowrap ${
              isDarkMode ? 'bg-[#3F6212] text-[#E5F9A6]' : 'bg-[#E5F9A6] text-[#1C2434]'
            }`}>
              {percentComplete}% Complete
            </span>

            {/* PAGE LOCAL THEME TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isDarkMode 
                  ? 'bg-[#18181B] border-[#27272A] text-[#FACC15] hover:bg-[#27272A] shadow-xs' 
                  : 'bg-white border-[#CBD5E1] text-[#0F172A] hover:bg-[#F4F4F0] shadow-xs'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-[#FACC15]" /> : <Moon className="w-4 h-4 text-[#0F172A]" />}
            </button>
          </div>
        </div>

        {/* Clean Rounded Lime Progress Bar matching reference image */}
        <div className={`w-full h-2.5 sm:h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#27272A]' : 'bg-[#EEF2F6]'}`}>
          <div 
            className="h-full bg-[#A3E635] rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>
      </header>

      {/* MAIN CONTAINER: Stacked Cards Deck */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto px-2 sm:px-4 max-w-4xl mx-auto w-full">
        
        {/* STACKED CARDS CONTAINER WITH MOBILE TOUCH SWIPE & DESKTOP FLOATING SIDE BUTTONS */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full max-w-3xl min-h-[380px] sm:min-h-[440px] max-h-[520px] sm:max-h-[560px] flex items-center justify-center my-2 sm:my-4 touch-pan-y"
        >
          
          {/* FLOATING LEFT NAVIGATION BUTTON (Hidden on Mobile) */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`hidden sm:flex absolute -left-14 sm:-left-24 md:-left-28 z-30 w-11 h-11 border shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed rounded-full items-center justify-center active:scale-95 transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-[#18181B] border-[#27272A] text-white hover:bg-[#27272A]' 
                : 'bg-white border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
            title="Previous Card (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* FLOATING RIGHT NAVIGATION BUTTON (Hidden on Mobile) */}
          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className={`hidden sm:flex absolute -right-14 sm:-right-24 md:-right-28 z-30 w-11 h-11 border shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed rounded-full items-center justify-center active:scale-95 transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-[#18181B] border-[#27272A] text-white hover:bg-[#27272A]' 
                : 'bg-white border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
            title="Next Card (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Back Card Layer 3 (Peeking furthest - only when 3+ cards remaining) */}
          {remainingCards >= 3 && (
            <div 
              className={`absolute inset-0 rounded-3xl transform -translate-x-3 sm:-translate-x-5 -translate-y-3 sm:-translate-y-5 -rotate-[4deg] scale-[0.97] shadow-2xs pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                isDarkMode ? 'bg-[#18181B] border border-[#27272A]' : 'bg-white border border-[#CBD5E1]'
              } ${
                animatingDirection === 'next' ? '-translate-x-1.5 -translate-y-1.5 -rotate-[1.5deg] scale-[0.99]' : ''
              }`}
            ></div>
          )}

          {/* Back Card Layer 2 (Peeking middle - only when 2+ cards remaining) */}
          {remainingCards >= 2 && (
            <div 
              className={`absolute inset-0 rounded-3xl transform translate-x-3 sm:translate-x-5 translate-y-3 sm:translate-y-4 rotate-[3deg] scale-[0.985] shadow-2xs pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                isDarkMode ? 'bg-[#18181B] border border-[#27272A]' : 'bg-white border border-[#CBD5E1]'
              } ${
                animatingDirection === 'next' ? 'translate-x-1.5 translate-y-1.5 rotate-[0.5deg] scale-[0.995]' : ''
              }`}
            ></div>
          )}

          {/* Back Card Layer 1 (Peeking right behind active card - only when 1+ cards remaining) */}
          {remainingCards >= 1 && (
            <div 
              className={`absolute inset-0 rounded-3xl transform -translate-x-2 -translate-y-1 sm:-translate-x-2.5 sm:-translate-y-1.5 -rotate-[1.5deg] scale-[0.995] shadow-2xs pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                isDarkMode ? 'bg-[#18181B] border border-[#27272A]' : 'bg-white border border-[#CBD5E1]'
              } ${
                animatingDirection === 'next' ? 'translate-x-0 translate-y-0 rotate-0 scale-100' : ''
              }`}
            ></div>
          )}

          {/* FRONT ACTIVE TOP CARD */}
          <div 
            onClick={() => setIsRevealed(!isRevealed)}
            className={`relative w-full h-full rounded-3xl p-5 sm:p-8 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer transform overflow-hidden ${
              isDarkMode 
                ? 'bg-[#121212] border border-[#27272A] text-white shadow-[0_10px_35px_rgba(0,0,0,0.6)]' 
                : 'bg-white border border-[#0A0A0A] text-[#0A0A0A] shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.07)]'
            } ${
              animatingDirection === 'next' 
                ? '-translate-x-[110%] -rotate-[14deg] opacity-0 scale-90' 
                : animatingDirection === 'prev' 
                ? 'translate-x-[110%] rotate-[14deg] opacity-0 scale-90' 
                : 'translate-x-0 rotate-0 opacity-100 scale-100'
            }`}
          >
            
            {/* Card Header Row */}
            <div className="flex items-center justify-between text-xs tracking-wider font-mono shrink-0">
              <span className="bg-[#E8FF00] text-black font-extrabold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-black/10">
                CARD #{currentIndex + 1}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBookmarked(!isBookmarked);
                }}
                className={`p-1.5 rounded-lg border transition-all ${
                  isBookmarked 
                    ? 'bg-[#E8FF00] border-[#0A0A0A] text-black shadow-xs' 
                    : isDarkMode
                    ? 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:border-white hover:text-white'
                    : 'bg-white border-[#E0E0DA] text-[#777777] hover:border-[#0A0A0A] hover:text-[#0A0A0A]'
                }`}
                title="Bookmark Card (B)"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#0A0A0A] text-[#0A0A0A]' : 'stroke-[2]'}`} />
              </button>
            </div>

            {/* Card Main Body Content */}
            <div className="my-auto py-2 sm:py-4 text-center space-y-3 flex-1 flex flex-col justify-center">
              {!isRevealed ? (
                /* FRONT QUESTION SIDE */
                <div className="space-y-3 sm:space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
                  <h2 className={`text-base sm:text-2xl md:text-3xl font-semibold tracking-tight leading-relaxed max-w-2xl mx-auto font-sans ${
                    isDarkMode ? 'text-white' : 'text-[#0A0A0A]'
                  }`}>
                    {currentCard.front}
                  </h2>
                  
                  <div className={`pt-1 sm:pt-2 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-mono font-medium ${
                    isDarkMode ? 'text-[#71717A]' : 'text-[#666666]'
                  }`}>
                    <MousePointerClick className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white' : 'text-[#0A0A0A]'}`} />
                    <span>Click anywhere to reveal answer</span>
                  </div>
                </div>
              ) : (
                /* BACK ANSWER SIDE */
                <div className="space-y-2 sm:space-y-3 animate-in fade-in zoom-in-95 duration-150 my-auto">
                  <div className="inline-flex items-center gap-1.5 bg-[#E8FF00] text-black text-[10px] font-extrabold font-mono uppercase px-3 py-1 rounded-md border border-black/10">
                    <Sparkles className="w-3 h-3 text-black" />
                    <span>ANSWER & REASONING</span>
                  </div>
                  <p className={`text-xs sm:text-base md:text-lg text-white leading-relaxed max-w-2xl mx-auto font-mono p-3.5 sm:p-5 rounded-2xl border shadow-xl text-left ${
                    isDarkMode ? 'bg-[#18181B] border-[#27272A]' : 'bg-[#0A0A0A] border-[#222222]'
                  }`}>
                    {currentCard.back}
                  </p>
                </div>
              )}
            </div>

            {/* Card Footer: Confidence Scale on Back */}
            {isRevealed && (
              <div className={`pt-2 shrink-0 border-t ${isDarkMode ? 'border-[#27272A]' : 'border-[#F0F0EC]'}`}>
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className="space-y-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                  <span className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
                    isDarkMode ? 'text-[#A1A1AA]' : 'text-[#666666]'
                  }`}>
                    RATE CONFIDENCE TO UPDATE WEAK SPOTS MATRIX
                  </span>
                  
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 font-mono pb-1">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleConfidenceRating(score)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 text-xs font-extrabold rounded-xl border-2 transition-all flex items-center justify-center ${
                          Boolean(currentCard.confidence) && currentCard.confidence === score
                            ? 'bg-[#E8FF00] text-black border-[#0A0A0A] shadow-[0_0_12px_rgba(232,255,0,0.8)] scale-110'
                            : isDarkMode
                            ? 'bg-[#18181B] text-white border-[#27272A] hover:border-white hover:bg-[#27272A]'
                            : 'bg-white text-[#0A0A0A] border-[#E0E0DA] hover:border-[#0A0A0A] hover:bg-[#F7F7F3]'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* BOTTOM ACTION NAVIGATION CONTROLS */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-4 mt-3 sm:mt-8 w-full max-w-xl">
          
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`flex-1 shrink-0 disabled:opacity-30 border py-2.5 sm:py-3.5 px-2.5 sm:px-6 rounded-xl font-mono text-[10px] sm:text-xs font-medium flex items-center justify-center gap-1 sm:gap-2 shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
              isDarkMode 
                ? 'bg-[#18181B] hover:bg-[#27272A] border-[#27272A] text-white' 
                : 'bg-white hover:bg-[#F7F7F3] border-[#CCCCCC] text-[#0A0A0A]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2] shrink-0" />
            <span className="whitespace-nowrap">Previous</span>
          </button>

          {/* Center Main "Show Answer" Button */}
          <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="flex-1 shrink-0 bg-[#E8FF00] hover:bg-[#d4ea00] text-black border border-black/10 py-2.5 sm:py-3.5 px-2.5 sm:px-6 rounded-xl font-mono text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-2 shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">{isRevealed ? 'Show Prompt' : 'Show Answer'}</span>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className={`flex-1 shrink-0 disabled:opacity-30 border py-2.5 sm:py-3.5 px-2.5 sm:px-6 rounded-xl font-mono text-[10px] sm:text-xs font-medium flex items-center justify-center gap-1 sm:gap-2 shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
              isDarkMode 
                ? 'bg-[#18181B] hover:bg-[#27272A] border-[#27272A] text-white' 
                : 'bg-white hover:bg-[#F7F7F3] border-[#CCCCCC] text-[#0A0A0A]'
            }`}
          >
            <span className="whitespace-nowrap">Next</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2] shrink-0" />
          </button>

        </div>

      </main>

      {/* BOTTOM FOOTER KEYBOARD SHORTCUT INSTRUCTIONS (Hidden on Mobile) */}
      <footer className={`hidden sm:flex relative z-10 flex-wrap items-center justify-center gap-4 sm:gap-6 max-w-4xl mx-auto w-full text-xs font-sans pb-4 pt-2 ${
        isDarkMode ? 'text-[#A1A1AA]' : 'text-[#64748B]'
      }`}>
        <div className="flex items-center gap-1.5 font-medium">
          <Keyboard className={`w-4 h-4 mr-0.5 ${isDarkMode ? 'text-[#A1A1AA]' : 'text-[#64748B]'}`} />
          <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#475569]'}`}>Keyboard Shortcuts:</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center font-mono">
            <kbd className={`px-2 py-0.5 rounded-l text-xs font-semibold shadow-2xs border ${
              isDarkMode ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-white border-[#CBD5E1] text-[#0F172A]'
            }`}>←</kbd>
            <kbd className={`border border-l-0 px-2 py-0.5 rounded-r text-xs font-semibold shadow-2xs ${
              isDarkMode ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-white border-[#CBD5E1] text-[#0F172A]'
            }`}>→</kbd>
          </div>
          <span>Navigate</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className={`px-2.5 py-0.5 rounded text-xs font-semibold font-mono shadow-2xs border ${
            isDarkMode ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-white border-[#CBD5E1] text-[#0F172A]'
          }`}>Space</kbd>
          <span>Reveal / Flip</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <kbd className={`border text-xs font-semibold font-mono px-2.5 py-0.5 rounded shadow-2xs ${
              isBookmarked 
                ? 'bg-[#E2FF66] border-[#84CC16] text-[#0F172A] font-bold' 
                : isDarkMode
                ? 'bg-[#18181B] border-[#27272A] text-white'
                : 'bg-white border-[#CBD5E1] text-[#0F172A]'
            }`}>B</kbd>
            <span>Bookmark</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className={`px-2.5 py-0.5 rounded text-xs font-semibold font-mono shadow-2xs border ${
            isDarkMode ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-white border-[#CBD5E1] text-[#0F172A]'
          }`}>ESC</kbd>
          <span>Exit</span>
        </div>
      </footer>

    </div>
  );
}

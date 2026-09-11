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
  MousePointerClick
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
        cards.sort((a, b) => (a.confidence || 3) - (b.confidence || 3));
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

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-[#FBFBF8] bg-tech-grid text-[#0A0A0A] flex flex-col justify-between p-4 sm:p-8 font-mono select-none overflow-hidden">
      
      {/* Background Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      ></div>

      {/* TOP HEADER: Sleek Neon Progress Bar */}
      <header className="relative z-10 max-w-4xl mx-auto w-full pt-4 px-2 space-y-2">
        <div className="flex items-center justify-between text-xs text-[#777777] font-mono uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E8FF00] animate-pulse"></span>
            <span className="font-bold text-[#0A0A0A]">PRACTICE SESSION</span>
          </div>
          <span className="font-bold text-[#0A0A0A]">
            {Math.round(((currentIndex + 1) / flashcards.length) * 100)}% COMPLETE ({currentIndex + 1} / {flashcards.length})
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-2 bg-[#EAEAE4] rounded-full overflow-hidden p-0.5 border border-[#E0E0DA]">
          <div 
            className="h-full bg-[#E8FF00] rounded-full transition-all duration-300 shadow-xs"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          ></div>
        </div>
      </header>

      {/* MAIN CONTAINER: Stacked Cards Deck Visual Match */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto px-4 max-w-4xl mx-auto w-full">
        
        {/* STACKED CARDS CONTAINER - Pixel-perfect match to original reference image */}
        <div className="relative w-full max-w-3xl aspect-[16/9] min-h-[340px] max-h-[460px] flex items-center justify-center">
          
          {/* Back Card Layer 2 (Furthest Back - Offset Top & Left) */}
          <div 
            className={`absolute inset-0 bg-[#F6F6F2] border border-[#E5E5DF] rounded-3xl transform -translate-x-4 -translate-y-3 scale-[0.99] shadow-xs pointer-events-none transition-all duration-300 ${
              animatingDirection === 'next' ? '-translate-x-2 -translate-y-1' : ''
            }`}
          ></div>

          {/* Back Card Layer 1 (Middle Back - Offset Bottom & Right) */}
          <div 
            className={`absolute inset-0 bg-[#F9F9F5] border border-[#ECECE6] rounded-3xl transform translate-x-4 translate-y-3 scale-[0.99] shadow-sm pointer-events-none transition-all duration-300 ${
              animatingDirection === 'next' ? 'translate-x-2 translate-y-1' : ''
            }`}
          ></div>

          {/* FRONT ACTIVE TOP CARD */}
          <div 
            onClick={() => setIsRevealed(!isRevealed)}
            className={`relative w-full h-full bg-white border border-[#E5E5DF] rounded-3xl p-8 sm:p-12 flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.04)] transition-all duration-300 cursor-pointer hover:border-[#0A0A0A] transform ${
              animatingDirection === 'next' 
                ? '-translate-x-32 -rotate-6 opacity-0 scale-95' 
                : animatingDirection === 'prev' 
                ? 'translate-x-32 rotate-6 opacity-0 scale-95' 
                : 'translate-x-0 rotate-0 opacity-100 scale-100'
            }`}
          >
            
            {/* Card Header Row */}
            <div className="flex items-center justify-between text-xs text-[#777777] tracking-wider font-mono">
              {/* Category / Topic Title */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0A0A0A] uppercase">DSA</span>
                <span className="text-[#AAAAAA]">Arrays & Hashing</span>
              </div>

              {/* Card Index Counter & Bookmark Button */}
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-[#777777]">
                  {currentIndex + 1} / {flashcards.length}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBookmarked(!isBookmarked);
                  }}
                  className="text-[#777777] hover:text-[#0A0A0A] transition-colors p-1"
                  title="Bookmark Card"
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#0A0A0A] text-[#0A0A0A]' : 'stroke-[2]'}`} />
                </button>
              </div>
            </div>

            {/* Card Main Center Content (Question or Revealed Answer) */}
            <div className="my-auto py-4 text-center px-4">
              {!isRevealed ? (
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-3xl font-mono font-medium text-[#0A0A0A] leading-relaxed max-w-2xl mx-auto">
                    {currentCard.front}
                  </h2>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="inline-flex items-center gap-1.5 text-xs text-[#88B800] font-mono font-bold uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ANSWER OUTLINE</span>
                  </div>
                  <p className="text-sm sm:text-lg font-sans font-medium text-[#222222] leading-relaxed max-w-2xl mx-auto text-center whitespace-pre-line">
                    {currentCard.back}
                  </p>
                </div>
              )}
            </div>

            {/* Card Bottom Prompt: "Click to reveal answer" / Confidence scale */}
            <div className="flex items-center justify-center pt-2 text-xs text-[#888888]">
              {!isRevealed ? (
                <div className="flex items-center gap-2 font-mono text-xs text-[#999999]">
                  <MousePointerClick className="w-4 h-4 text-[#AAAAAA]" />
                  <span>Click to reveal answer</span>
                </div>
              ) : (
                <div className="w-full space-y-2 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                  <div className="text-[10px] text-[#777777] font-mono uppercase tracking-widest text-center">
                    RATE CONFIDENCE
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {[
                      { score: 1, label: '1 · HARD' },
                      { score: 2, label: '2 · WEAK' },
                      { score: 3, label: '3 · OK' },
                      { score: 4, label: '4 · GOOD' },
                      { score: 5, label: '5 · EASY' }
                    ].map(item => (
                      <button
                        key={item.score}
                        onClick={() => handleConfidenceRating(item.score)}
                        className="py-1.5 px-3 text-[10px] font-mono font-bold uppercase rounded-lg border border-[#E0E0DA] bg-[#F7F7F3] hover:bg-[#E8FF00] hover:text-black hover:border-black transition-all cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* BOTTOM ACTION NAVIGATION CONTROLS (Previous / Show Answer / Next) */}
        <div className="flex items-center justify-center gap-4 mt-8 w-full max-w-xl">
          
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 bg-white hover:bg-[#F7F7F3] disabled:opacity-30 border border-[#CCCCCC] text-[#0A0A0A] py-3.5 px-6 rounded-xl font-mono text-xs font-medium flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
            <span>Previous</span>
          </button>

          {/* Center Main "Show Answer" / "Flip Back" Neon Lime Button */}
          <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="flex-1 bg-[#E8FF00] hover:bg-[#d4ea00] text-black border border-black/10 py-3.5 px-6 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Eye className="w-4 h-4 stroke-[2.5]" />
            <span>{isRevealed ? 'Show Prompt' : 'Show Answer'}</span>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="flex-1 bg-white hover:bg-[#F7F7F3] disabled:opacity-30 border border-[#CCCCCC] text-[#0A0A0A] py-3.5 px-6 rounded-xl font-mono text-xs font-medium flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4 stroke-[2]" />
          </button>

        </div>

      </main>

      {/* BOTTOM FOOTER KEYBOARD SHORTCUT INSTRUCTIONS */}
      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 max-w-4xl mx-auto w-full text-xs font-mono text-[#666666] pb-4 pt-2">
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E0E0DA] shadow-2xs">
          <kbd className="bg-[#F0F0EA] border border-[#CCCCCC] text-[#0A0A0A] px-1.5 py-0.5 rounded text-[11px] font-bold">←</kbd>
          <kbd className="bg-[#F0F0EA] border border-[#CCCCCC] text-[#0A0A0A] px-1.5 py-0.5 rounded text-[11px] font-bold">→</kbd>
          <span className="text-[11px] text-[#777777] ml-1">NAVIGATE</span>
        </div>

        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E0E0DA] shadow-2xs">
          <kbd className="bg-[#F0F0EA] border border-[#CCCCCC] text-[#0A0A0A] px-2 py-0.5 rounded text-[11px] font-bold">SPACE</kbd>
          <span className="text-[11px] text-[#777777] ml-1">REVEAL / FLIP</span>
        </div>

        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E0E0DA] shadow-2xs">
          <kbd className="bg-[#F0F0EA] border border-[#CCCCCC] text-[#0A0A0A] px-1.5 py-0.5 rounded text-[11px] font-bold">ESC</kbd>
          <span className="text-[11px] text-[#777777] ml-1">EXIT</span>
        </div>
      </footer>

    </div>
  );
}

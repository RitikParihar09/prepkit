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
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  BrainCircuit,
  Flame
} from 'lucide-react';

export default function PracticeModePage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kitId) {
      fetchKitAndOrderCards();
    }
  }, [kitId]);

  const fetchKitAndOrderCards = async () => {
    try {
      setLoading(true);
      const res = await api.getKitById(kitId);
      if (res.data && res.data.flashcards) {
        const cards: Flashcard[] = [...res.data.flashcards];
        
        // Confidence-weighted sorting: prioritize lower confidence cards first
        cards.sort((a, b) => (a.confidence || 3) - (b.confidence || 3));
        setFlashcards(cards);
      }
    } catch (err: any) {
      console.warn('Failed to load flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfidenceRating = async (score: number) => {
    if (flashcards.length === 0) return;
    const currentCard = flashcards[currentIndex];

    // Optimistic local state update
    const updatedCards = [...flashcards];
    updatedCards[currentIndex] = { ...currentCard, confidence: score };
    setFlashcards(updatedCards);

    // Save confidence rating to backend
    try {
      await api.updateFlashcardConfidence(kitId, currentCard.id, score);
    } catch (err: any) {
      console.warn('Failed to save confidence rating:', err);
    }

    // Move to next card
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsRevealed(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0C0E] text-white flex flex-col items-center justify-center font-mono text-xs selection:bg-[#CCFF00] selection:text-black">
        <div className="flex flex-col items-center gap-4 bg-[#14161C] p-8 rounded-2xl border border-[#222530] shadow-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-[#CCFF00]" />
          <p className="tracking-widest text-[#A0A5B5]">[ INITIALIZING ACTIVE RECALL TERMINAL... ]</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0C0E] p-4 font-mono text-xs text-white">
        <div className="max-w-md w-full p-8 bg-[#14161C] border-2 border-[#222530] rounded-2xl text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-[#222530] text-[#CCFF00] flex items-center justify-center mx-auto">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-bold uppercase tracking-wider text-white">[0 FLASHCARDS DETECTED]</h2>
            <p className="text-xs text-[#8A95A5] leading-relaxed">No practice cards are available for this kit yet.</p>
          </div>
          <Link 
            href={`/kits/${kitId}`} 
            className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-extrabold text-xs py-3 px-6 rounded-xl uppercase tracking-wider inline-block shadow-md transition-all"
          >
            RETURN TO KIT WORKSPACE
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / flashcards.length) * 100);

  return (
    <div className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] w-full bg-[#0B0C0E] text-white flex flex-col justify-between p-2 sm:p-4 font-sans selection:bg-[#CCFF00] selection:text-black select-none relative overflow-hidden">
      
      {/* Technical Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* TOP HEADER NAVIGATION BAR */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4 py-2 border-b border-[#1C1E24] font-mono text-xs relative z-10 shrink-0">
        <Link
          href={`/kits/${kitId}`}
          className="flex items-center gap-2 text-[#9EA5B5] hover:text-white bg-[#14161C] hover:bg-[#1C1E26] border border-[#242834] px-3 py-1.5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#CCFF00]" />
          <span className="uppercase tracking-wider text-[10px] sm:text-[11px] font-bold">EXIT PRACTICE</span>
        </Link>

        {/* Center Progress Pill */}
        <div className="flex items-center gap-2 sm:gap-3 bg-[#14161C] border border-[#242834] px-3 py-1.5 rounded-xl">
          <Flame className="w-3.5 h-3.5 text-[#CCFF00] animate-pulse" />
          <div className="text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-widest">
              CARD {String(currentIndex + 1).padStart(2, '0')} / {String(flashcards.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Right Percentage Badge */}
        <div className="flex items-center gap-2 bg-[#14161C] border border-[#242834] px-3 py-1.5 rounded-xl text-[#CCFF00] font-bold text-[10px] sm:text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#CCFF00]"></span>
          <span className="hidden xs:inline">{progressPercent}% COMPLETE</span>
          <span className="xs:hidden">{progressPercent}%</span>
        </div>
      </header>

      {/* MAIN FLASHCARD CARD CONTAINER WITH SIDE NAVIGATION */}
      <main className="max-w-4xl mx-auto w-full flex-1 flex items-center justify-center py-2 sm:py-4 relative z-10 min-h-0">
        
        {/* Previous Side Floating Button */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="hidden md:flex items-center justify-center w-11 h-11 rounded-2xl bg-[#14161C] hover:bg-[#1C1E26] disabled:opacity-20 border-2 border-[#242834] hover:border-[#CCFF00]/50 text-white transition-all cursor-pointer mr-3 shadow-xl shrink-0 active:scale-95"
          title="Previous Card (Left Arrow)"
        >
          <ArrowLeft className="w-5 h-5 text-[#CCFF00]" />
        </button>

        {/* Card wrapper */}
        <div className="relative w-full max-w-3xl flex flex-col h-full max-h-[460px] min-h-0">
          <div className="absolute -inset-1 bg-[#CCFF00]/10 rounded-3xl blur-xl opacity-70 pointer-events-none"></div>

          <div className="relative w-full h-full bg-[#12141A] border-2 border-[#222632] rounded-3xl p-4 sm:p-7 flex flex-col justify-between shadow-2xl overflow-y-auto">
            
            {/* Card Header Strip */}
            <div className="flex items-center justify-between text-xs text-[#8A95A5] font-mono pb-2.5 border-b border-[#1E222D] shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#CCFF00]"></span>
                <span className="font-bold text-white uppercase tracking-wider text-[10px] sm:text-[11px]">CARD ID: {currentCard.id}</span>
              </div>
              <div className="bg-[#1A1D26] border border-[#292D3B] px-2.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] text-[#A0A8B8] uppercase">
                REQS: {currentCard.requirement_ids.join(', ')}
              </div>
            </div>

            {/* Prompt / Answer Main Content Area */}
            <div className="my-auto py-3 text-center overflow-y-auto max-h-[260px] scrollbar-thin">
              {!isRevealed ? (
                <div className="space-y-3 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] font-bold text-[#CCFF00] uppercase tracking-[0.2em] bg-[#1C202C] px-3 py-1 rounded-full border border-[#2E3446]">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>FRONT // QUESTION PROMPT</span>
                  </div>
                  <h2 className="text-base sm:text-xl font-extrabold text-white leading-relaxed tracking-tight font-sans">
                    {currentCard.front}
                  </h2>
                </div>
              ) : (
                <div className="space-y-3 max-w-2xl mx-auto animate-in fade-in duration-200">
                  <div className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] font-bold text-[#CCFF00] uppercase tracking-[0.2em] bg-[#1C202C] px-3 py-1 rounded-full border border-[#2E3446]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>BACK // TECHNICAL ANSWER OUTLINE</span>
                  </div>
                  <div className="bg-[#171A22] border border-[#272B38] p-4 sm:p-5 rounded-2xl text-left shadow-inner">
                    <p className="text-xs sm:text-sm text-white/95 leading-relaxed whitespace-pre-line font-sans">
                      {currentCard.back}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer Button / Confidence Scale */}
            <div className="shrink-0 pt-2">
              {!isRevealed ? (
                <button
                  onClick={() => setIsRevealed(true)}
                  className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-extrabold py-3 px-6 rounded-2xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#CCFF00]/10 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Eye className="w-4 h-4 stroke-[2.5]" />
                  <span>REVEAL ANSWER</span>
                </button>
              ) : (
                <div className="space-y-2 pt-2 border-t border-[#1E222D] font-mono text-xs animate-in fade-in duration-200">
                  <span className="text-[9px] sm:text-[10px] text-[#A0A8B8] uppercase tracking-wider text-center block font-bold">
                    RATE YOUR CONFIDENCE LEVEL (QUEUES NEXT SESSION)
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[
                      { score: 1, label: '1 · NONE', color: 'bg-[#181B22] text-zinc-400 border-[#2B2F3D] hover:bg-[#222633]' },
                      { score: 2, label: '2 · WEAK', color: 'bg-[#1C202C] text-amber-300 border-amber-900/60 hover:bg-[#272D3E]' },
                      { score: 3, label: '3 · MID', color: 'bg-[#1C202C] text-white border-[#2E3446] hover:bg-[#272D3E]' },
                      { score: 4, label: '4 · GOOD', color: 'bg-[#1C202C] text-[#CCFF00] border-[#CCFF00]/40 hover:bg-[#272D3E]' },
                      { score: 5, label: '5 · HIGH', color: 'bg-[#CCFF00] text-black border-[#CCFF00] hover:bg-[#b8e600] font-extrabold' }
                    ].map(item => (
                      <button
                        key={item.score}
                        onClick={() => handleConfidenceRating(item.score)}
                        className={`py-2 px-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase rounded-xl transition-all border text-center shadow-xs cursor-pointer ${item.color}`}
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

        {/* Next Side Floating Button */}
        <button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="hidden md:flex items-center justify-center w-11 h-11 rounded-2xl bg-[#14161C] hover:bg-[#1C1E26] disabled:opacity-20 border-2 border-[#242834] hover:border-[#CCFF00]/50 text-white transition-all cursor-pointer ml-3 shadow-xl shrink-0 active:scale-95"
          title="Next Card (Right Arrow)"
        >
          <ArrowRight className="w-5 h-5 text-[#CCFF00]" />
        </button>

      </main>

      {/* FIXED BOTTOM CONTROL NAVIGATION BAR (ALWAYS VISIBLE WITHOUT SCROLL) */}
      <footer className="max-w-3xl mx-auto w-full flex items-center justify-between py-2 border-t border-[#1C1E24] font-mono text-xs relative z-10 shrink-0 bg-[#0B0C0E]/90 backdrop-blur-md">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 text-[#CCFF00] disabled:opacity-20 border border-[#CCFF00]/40 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl transition-all cursor-pointer uppercase text-[11px] sm:text-xs font-extrabold shadow-md active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>PREVIOUS</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="bg-[#14161C] hover:bg-[#1C1E26] text-[#A0A8B8] hover:text-white border border-[#242834] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all text-[10px] sm:text-[11px] font-bold uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span className="hidden sm:inline">{isRevealed ? 'FLIP TO FRONT' : 'FLIP TO BACK'}</span>
            <span className="sm:hidden">{isRevealed ? 'FRONT' : 'BACK'}</span>
          </button>

          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsRevealed(false);
            }}
            className="p-1.5 sm:p-2 bg-[#14161C] hover:bg-[#1C1E26] text-[#A0A8B8] hover:text-white border border-[#242834] rounded-xl transition-all cursor-pointer"
            title="Restart Session"
          >
            <RotateCcw className="w-4 h-4 text-[#CCFF00]" />
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="flex items-center gap-2 bg-[#CCFF00] hover:bg-[#b8e600] text-black disabled:opacity-20 border border-[#CCFF00] px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl transition-all cursor-pointer uppercase text-[11px] sm:text-xs font-extrabold shadow-md shadow-[#CCFF00]/20 active:scale-95"
        >
          <span>NEXT</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </footer>

    </div>
  );
}

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
    <div className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] w-full bg-[#F9F9F6] text-[#0A0A0A] flex flex-col justify-between p-2 sm:p-4 font-sans selection:bg-[#CCFF00] selection:text-black select-none relative overflow-hidden">
      
      {/* Light Technical Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px'
        }}
      ></div>

      {/* TOP HEADER NAVIGATION BAR */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4 py-2 border-b border-[#E5E5DF] font-mono text-xs relative z-10 shrink-0">
        <Link
          href={`/kits/${kitId}`}
          className="flex items-center gap-2 text-[#444444] hover:text-black bg-white hover:bg-[#F4F4EE] border border-[#D0D0CA] px-3 py-1.5 rounded-xl transition-all shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#0A0A0A]" />
          <span className="uppercase tracking-wider text-[10px] sm:text-[11px] font-bold">EXIT PRACTICE</span>
        </Link>

        {/* Center Progress Pill */}
        <div className="flex items-center gap-2 sm:gap-3 bg-white border border-[#E5E5DF] px-3.5 py-1.5 rounded-xl shadow-2xs">
          <Flame className="w-3.5 h-3.5 text-[#88B800] animate-pulse" />
          <div className="text-center">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#0A0A0A] uppercase tracking-widest">
              CARD {String(currentIndex + 1).padStart(2, '0')} / {String(flashcards.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Right Percentage Badge */}
        <div className="flex items-center gap-2 bg-white border border-[#E5E5DF] px-3.5 py-1.5 rounded-xl text-[#0A0A0A] font-bold text-[10px] sm:text-[11px] shadow-2xs">
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
          className="hidden md:flex items-center justify-center w-11 h-11 rounded-2xl bg-white hover:bg-[#F4F4EE] disabled:opacity-20 border-2 border-[#0A0A0A] text-[#0A0A0A] transition-all cursor-pointer mr-3 shadow-md shrink-0 active:scale-95"
          title="Previous Card (Left Arrow)"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Card wrapper with exact screenshot aesthetics */}
        <div className="relative w-full max-w-2xl flex flex-col h-full max-h-[470px] min-h-0">
          <div className="absolute -inset-1 bg-[#CCFF00]/20 rounded-3xl blur-xl opacity-60 pointer-events-none"></div>

          <div className="relative w-full h-full bg-white border-2 border-[#0A0A0A] border-t-4 border-t-[#CCFF00] rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-2xl overflow-y-auto">
            
            {/* Card Top Strip: Squircle Icon Badge on Left + Monospace Tag on Right */}
            <div className="flex items-center justify-between pb-3 shrink-0">
              {/* Neon Lime Squircle Icon Badge */}
              <div className="w-12 h-12 rounded-2xl bg-[#CCFF00] text-black border border-black/10 flex items-center justify-center shadow-xs shrink-0">
                {!isRevealed ? (
                  <HelpCircle className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <Sparkles className="w-6 h-6 stroke-[2.5]" />
                )}
              </div>

              {/* Top Right Monospace Tag (Matching Screenshot "02 // TARGETED") */}
              <div className="bg-[#F0F1EC] border border-[#E0E0DA] px-3.5 py-1.5 rounded-xl text-[10px] font-mono font-bold text-[#0A0A0A] uppercase tracking-wider">
                CARD {String(currentIndex + 1).padStart(2, '0')} // REQS: {currentCard.requirement_ids.join(', ')}
              </div>
            </div>

            {/* Prompt / Answer Main Content Area */}
            <div className="my-auto py-3 space-y-4 text-left overflow-y-auto max-h-[260px] scrollbar-thin">
              {!isRevealed ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold text-[#666666] uppercase tracking-[0.18em]">
                    <span>FRONT // QUESTION PROMPT</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A0A0A] leading-tight tracking-tight font-sans">
                    {currentCard.front}
                  </h2>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold text-[#88B800] uppercase tracking-[0.18em]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>BACK // TECHNICAL ANSWER OUTLINE</span>
                  </div>
                  <div className="bg-[#F7F7F3] border border-[#E5E5DF] p-5 rounded-2xl text-left shadow-inner">
                    <p className="text-xs sm:text-sm text-[#222222] leading-relaxed whitespace-pre-line font-sans font-medium">
                      {currentCard.back}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Card Footer Strip (Divider + Monospace Metadata + Action) */}
            <div className="shrink-0 pt-3 border-t border-[#F0F0EA] space-y-3">
              
              {!isRevealed ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#777777]">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00]"></span>
                    <span>100% Requirement Match</span>
                  </div>

                  <button
                    onClick={() => setIsRevealed(true)}
                    className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-extrabold py-2.5 px-5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Eye className="w-4 h-4 stroke-[2.5]" />
                    <span>REVEAL ANSWER</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 font-mono text-xs animate-in fade-in duration-200">
                  <span className="text-[10px] text-[#777777] uppercase tracking-wider text-center block font-bold">
                    RATE YOUR CONFIDENCE LEVEL
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[
                      { score: 1, label: '1 · NONE', color: 'bg-[#F2F2EC] text-[#555555] border-[#D0D0CA] hover:bg-[#EAEAE2]' },
                      { score: 2, label: '2 · WEAK', color: 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' },
                      { score: 3, label: '3 · MID', color: 'bg-white text-[#0A0A0A] border-[#D0D0CA] hover:bg-[#F4F4EE]' },
                      { score: 4, label: '4 · GOOD', color: 'bg-[#F2F6E8] text-[#557700] border-[#C2E080] hover:bg-[#E5F0D0]' },
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
          className="hidden md:flex items-center justify-center w-11 h-11 rounded-2xl bg-white hover:bg-[#F4F4EE] disabled:opacity-20 border-2 border-[#0A0A0A] text-[#0A0A0A] transition-all cursor-pointer ml-3 shadow-md shrink-0 active:scale-95"
          title="Next Card (Right Arrow)"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

      </main>

      {/* FIXED BOTTOM CONTROL NAVIGATION BAR */}
      <footer className="max-w-3xl mx-auto w-full flex items-center justify-between py-2 border-t border-[#E5E5DF] font-mono text-xs relative z-10 shrink-0 bg-white/90 backdrop-blur-md">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 bg-white hover:bg-[#F4F4EE] text-[#0A0A0A] disabled:opacity-30 border border-[#D0D0CA] px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl transition-all cursor-pointer uppercase text-[11px] sm:text-xs font-extrabold shadow-2xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>PREVIOUS</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="bg-white hover:bg-[#F4F4EE] text-[#333333] hover:text-black border border-[#D0D0CA] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all text-[10px] sm:text-[11px] font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-[#0A0A0A]" />
            <span className="hidden sm:inline">{isRevealed ? 'FLIP TO FRONT' : 'FLIP TO BACK'}</span>
            <span className="sm:hidden">{isRevealed ? 'FRONT' : 'BACK'}</span>
          </button>

          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsRevealed(false);
            }}
            className="p-1.5 sm:p-2 bg-white hover:bg-[#F4F4EE] text-[#333333] border border-[#D0D0CA] rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Restart Session"
          >
            <RotateCcw className="w-4 h-4 text-[#0A0A0A]" />
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="flex items-center gap-2 bg-[#0A0A0A] hover:bg-[#222222] text-white disabled:opacity-30 border border-[#0A0A0A] px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl transition-all cursor-pointer uppercase text-[11px] sm:text-xs font-extrabold shadow-md active:scale-95"
        >
          <span>NEXT</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </footer>

    </div>
  );
}

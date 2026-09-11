'use client';

import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'EXTRACTION & RESEARCH',
    question: 'How does prepKit extract research and questions from a job description?',
    answer: 'When you paste a Job Description and company URL, prepKit’s AI pipeline performs autonomous web research summarizing company mission, tech stack, and culture. It extracts must-have vs. nice-to-have requirements and deterministically maps targeted technical, system design, and behavioral questions with complete answer outlines.'
  },
  {
    id: 'faq-2',
    category: 'PIPELINE SPEED',
    question: 'How long does it take to generate a personalized prep kit?',
    answer: 'Kit generation typically completes in under 2 minutes. You can monitor real-time progress live in the pipeline terminal or safely navigate away — your generated prep kit will automatically appear ready in your workspace dashboard.'
  },
  {
    id: 'faq-3',
    category: 'STUDY SCHEDULE',
    question: 'Can I customize my preparation timeline and study schedule?',
    answer: 'Yes! You specify the exact number of days available before your interview (from 1 to 60 days). prepKit arithmetically allocates requirement coverage, question practice, and flashcard review across your timeline so you never cram.'
  },
  {
    id: 'faq-4',
    category: 'QUESTION BANK & FLASHCARDS',
    question: 'What types of questions and flashcards are included?',
    answer: 'Every prep kit includes categorized questions across Technical, System Design, Behavioral, and Company-Fit topics with 1–3 difficulty ratings. Interactive flashcards feature 1–5 confidence rating scales for targeted active recall practice.'
  },
  {
    id: 'faq-5',
    category: 'READINESS ANALYTICS',
    question: 'How does prepKit track my preparation progress and weak spots?',
    answer: 'Your dashboard calculates a real-time requirement coverage score and weak spot risk matrix as you practice questions and rate flashcard confidence, highlighting exactly which skills need more attention before interview day.'
  },
  {
    id: 'faq-6',
    category: 'ACCESS & PRICING',
    question: 'Is prepKit free to use?',
    answer: 'Yes! prepKit is completely free to use during our early access release. You can create as many research-backed interview preparation kits as you need.'
  }
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto w-full font-sans select-none">
      
      {/* SECTION HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-[#888888] tracking-[0.2em] uppercase">
          <span className="w-[3px] h-3.5 bg-[#CCFF00] inline-block"></span>
          <span>FREQUENTLY ASKED QUESTIONS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0A0A0A] tracking-tight leading-tight">
          Everything you need to know about{' '}
          <span className="bg-[#CCFF00] text-[#0A0A0A] px-3 py-0.5 rounded-md inline-block font-extrabold">
            prepKit.
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
          Have questions about our AI research pipeline, question generation, or study schedules? We&apos;ve got answers.
        </p>
      </div>

      {/* ACCORDION CONTAINER */}
      <div className="max-w-3xl mx-auto space-y-4">
        {FAQ_ITEMS.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div
              key={faq.id}
              className={`bg-white border rounded-2xl transition-all duration-200 overflow-hidden ${
                isOpen 
                  ? 'border-[#0A0A0A] shadow-md' 
                  : 'border-[#E5E5E0] hover:border-[#A0A0A0]'
              }`}
            >
              {/* ACCORDION HEADER BUTTON */}
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full p-6 text-left flex items-start justify-between gap-4 focus:outline-none cursor-pointer"
              >
                <div className="space-y-1 pr-2">
                  <div className="font-mono text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                    [ {faq.category} ]
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0A0A0A] leading-snug">
                    {faq.question}
                  </h3>
                </div>

                {/* ACCORDION ICON */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isOpen 
                    ? 'bg-[#0A0A0A] text-[#CCFF00]' 
                    : 'bg-[#F4F4F0] text-[#0A0A0A]'
                }`}>
                  {isOpen ? (
                    <Minus className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  )}
                </div>
              </button>

              {/* ACCORDION CONTENT PANEL */}
              {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-[#F0F0EC] text-xs sm:text-sm text-[#555555] leading-relaxed font-sans animate-in fade-in duration-150">
                  {faq.answer}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* BOTTOM CONTACT SUPPORT CALLOUT */}
      <div className="mt-12 text-center font-mono text-xs text-[#777777] flex items-center justify-center gap-2">
        <HelpCircle className="w-4 h-4 text-[#0A0A0A]" />
        <span>Still have questions? Check out our</span>
        <a href="#how-it-works" className="text-[#0A0A0A] font-bold underline hover:text-[#0A0A0A]">
          How It Works breakdown
        </a>
      </div>

    </section>
  );
}

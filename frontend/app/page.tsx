'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, FileText, Target, Calendar, Zap, CheckCircle2, Check, ArrowUpRight } from 'lucide-react';
import { FaqSection } from '@/components/FaqSection';
import { CtaBanner } from '@/components/CtaBanner';

const HERO_ANIMATED_STEPS = [
  'Analyzing your job post...',
  'Parsing job description',
  'Researching company',
  'Mapping key requirements',
  'Generating question bank',
  'Building study plan'
];

const HERO_SAMPLE_ROLES = [
  'Senior Software Engineer',
  'Lead Product Manager',
  'Full Stack Developer',
  'Data Scientist & AI Specialist',
  'DevOps & Systems Architect'
];

export default function LandingPage() {
  // Animated Hero AI Execution Steps Loop State
  const [activeHeroStepIndex, setActiveHeroStepIndex] = useState(0);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [isAnalysisDone, setIsAnalysisDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroStepIndex(prev => {
        if (prev >= HERO_ANIMATED_STEPS.length - 1) {
          // Trigger Analysis Complete state
          setIsAnalysisDone(true);
          // After holding complete state for 3 seconds, reset to step 0 & advance role
          setTimeout(() => {
            setIsAnalysisDone(false);
            setActiveHeroStepIndex(0);
            setCurrentRoleIndex(rPrev => (rPrev + 1) % HERO_SAMPLE_ROLES.length);
          }, 3000);
          return prev;
        }
        return prev + 1;
      });
    }, 3200); // 3.2 seconds per step

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBF8] bg-tech-grid text-[#0A0A0A] flex flex-col font-sans selection:bg-[#E8FF00] selection:text-black">
      
      {/* 01 HERO SECTION - 2 COLUMNS */}
      <section className="relative py-12 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto w-full border-b border-[#E8E8E2]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Top Label with Lime Bar */}
            <div className="flex items-center gap-2 font-mono text-xs text-[#777777] uppercase tracking-wider">
              <span className="w-1 h-3.5 bg-[#E8FF00] inline-block"></span>
              <span>INTERVIEW PREPARATION, REIMAGINED</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight text-[#0A0A0A] leading-[1.06]">
              Prepare smarter <br className="hidden sm:inline" />
              for your next <br />
              <span className="bg-[#E8FF00] text-[#0A0A0A] px-3 py-0.5 inline-block">
                interview.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#555555] max-w-xl leading-relaxed font-normal">
              Turn any job description into a personalized interview kit with company research, targeted questions, flashcards, and a day-by-day study plan.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/kits/new"
                className="bg-[#0A0A0A] hover:bg-[#222222] text-white text-sm font-semibold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Create your prep kit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard"
                className="bg-[#FFFFFF] hover:bg-[#F0F0EC] text-[#0A0A0A] border border-[#CCCCCC] text-sm font-semibold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>See how it works</span>
              </Link>
            </div>

            {/* Startup Product Feature Highlights Row */}
            <div className="pt-8 border-t border-[#E8E8E2] grid grid-cols-3 gap-6 max-w-lg font-sans">
              <div className="border-r border-[#E8E8E2] pr-4">
                <div className="text-xl sm:text-2xl font-extrabold text-[#0A0A0A]">100%</div>
                <div className="text-xs text-[#777777] mt-0.5 font-medium">Autonomous Research</div>
              </div>
              <div className="border-r border-[#E8E8E2] pr-4">
                <div className="text-xl sm:text-2xl font-extrabold text-[#0A0A0A]">&lt; 3 min</div>
                <div className="text-xs text-[#777777] mt-0.5 font-medium">Kit Generation</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#0A0A0A]">10x</div>
                <div className="text-xs text-[#777777] mt-0.5 font-medium">More Confident</div>
              </div>
            </div>
          </div>

          {/* Right Hero Column - Interactive Technical Visual (Exact Reference Match) */}
          <div className="lg:col-span-5 relative bg-[#FBFBF8] bg-tech-grid p-6 sm:p-10 border border-[#E8E8E2] rounded-2xl min-h-[520px] flex flex-col justify-between overflow-hidden select-none">
            
            {/* Dark Textured / Grainy Background Art Blocks */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
              <div className="absolute top-12 left-10 w-64 h-64 bg-black rounded-lg mix-blend-multiply filter blur-[1px] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]"></div>
              <div className="absolute bottom-6 right-8 w-72 h-72 bg-black rounded-lg mix-blend-multiply filter blur-[1px] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_3px]"></div>
            </div>

            {/* Top Right Monospace Label Block */}
            <div className="flex justify-end font-mono text-[10px] text-[#777777] uppercase tracking-widest leading-tight text-right relative z-10">
              <div>
                FROM<br />
                JOB POST<br />
                TO PREPARATION
                <div className="w-4 h-[2px] bg-[#E8FF00] mt-1.5 ml-auto"></div>
              </div>
            </div>

            {/* Main Overlapping Composition Container */}
            <div className="relative z-10 my-auto py-4">
              
              {/* Row 1: Floating Dark Card & Lime Selection Box */}
              <div className="relative flex items-start justify-between gap-4 max-w-lg mx-auto">
                
                {/* Dark Floating AI Execution Panel */}
                <div className="bg-[#18181A] text-white p-5 rounded-2xl border border-[#2D2D30] shadow-2xl w-full max-w-[280px] sm:max-w-[310px] relative z-20">
                  <div className="relative pl-6 space-y-3.5 font-sans text-xs">
                    
                    {/* Vertical Connector Line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-[#333336]"></div>

                    {HERO_ANIMATED_STEPS.map((stepText, idx) => {
                      const isDone = isAnalysisDone || idx < activeHeroStepIndex;
                      const isActive = !isAnalysisDone && idx === activeHeroStepIndex;

                      return (
                        <div
                          key={stepText}
                          className={`relative flex items-center gap-3 transition-all duration-300 ${
                            isActive
                              ? 'text-white font-bold scale-[1.02]'
                              : isDone
                              ? 'text-[#DDDDDD]'
                              : 'text-[#666666] opacity-40'
                          }`}
                        >
                          {/* Node Icon Indicator */}
                          <span className="absolute -left-[24px] w-4 h-4 rounded-full bg-[#18181A] flex items-center justify-center">
                            {isDone ? (
                              <svg className="w-3.5 h-3.5 text-[#E8FF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M9 12l2 2 4-4" />
                              </svg>
                            ) : isActive ? (
                              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#E8FF00] border-t-transparent animate-spin inline-block"></span>
                            ) : (
                              <span className="w-3 h-3 rounded-full border border-[#555555] inline-block"></span>
                            )}
                          </span>

                          <span className="text-[13px]">{stepText}</span>
                          
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF00] animate-ping ml-auto shrink-0"></span>
                          )}
                        </div>
                      );
                    })}

                  </div>
                </div>

                {/* Lime Crop Selection Box (Top Right Overlay - Reduced Proportioned Size) */}
                <div className="relative mt-8 sm:mt-12 right-2 sm:right-4 z-10 shrink-0">
                  <div className="relative w-22 h-22 sm:w-26 sm:h-26 bg-[#E8FF00] rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-105">
                    
                    {/* 4 Black Selection Crop Handles */}
                    <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-black"></span>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-black"></span>
                    <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-black"></span>
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-black"></span>

                    {/* Direct Proportioned File Icon */}
                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-[#0A0A0A] stroke-[2]" />
                  </div>
                </div>

              </div>

              {/* Row 2: Overlapping Role Card (Slight overlap with dark 6-step card) */}
              <div className="relative -mt-3 sm:-mt-4 z-30 max-w-[340px] sm:max-w-[380px] mx-auto">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E2DC] shadow-xl flex items-center justify-between gap-4">
                  
                  {/* Left Calendar Badge */}
                  <div className="w-10 h-10 rounded-xl bg-[#F4F4F0] border border-[#E5E5DF] flex items-center justify-center text-[#0A0A0A] shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>

                  {/* Role Title & Skeleton Bar Lines */}
                  <div className="flex-1 min-w-0">
                    <h4 
                      key={HERO_SAMPLE_ROLES[currentRoleIndex]} 
                      className="font-bold text-sm text-[#0A0A0A] truncate animate-in fade-in slide-in-from-bottom-1 duration-500"
                    >
                      {HERO_SAMPLE_ROLES[currentRoleIndex]}
                    </h4>
                    <div className="space-y-1.5 mt-2">
                      <div className="h-2 bg-[#EFEFEA] rounded-full w-full"></div>
                      <div className="h-2 bg-[#EFEFEA] rounded-full w-3/4"></div>
                    </div>
                  </div>

                  {/* Yellow Action Button - Animates from Arrow (→) to Checkmark (✓) when complete */}
                  <div className={`w-10 h-10 rounded-full text-[#0A0A0A] flex items-center justify-center shrink-0 transition-all duration-500 shadow-sm ${
                    isAnalysisDone
                      ? 'bg-[#E8FF00] scale-110 ring-4 ring-[#E8FF00]/30 shadow-lg'
                      : 'bg-[#E8FF00] hover:bg-[#d6ed00] hover:scale-105'
                  }`}>
                    {isAnalysisDone ? (
                      <Check className="w-5 h-5 stroke-[3] text-[#0A0A0A] animate-in zoom-in duration-300" />
                    ) : (
                      <ArrowRight className="w-5 h-5" />
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* Bottom Row Technical Micro Annotations */}
            <div className="flex items-end justify-between font-mono text-[9px] sm:text-[10px] text-[#777777] uppercase tracking-widest relative z-10">
              
              {/* Bottom Left Corner Brackets with Text */}
              <div className="relative pl-3 pt-2 pb-2">
                <span className="absolute top-0 left-0 text-[#AAAAAA] text-xs">┌</span>
                <span className="absolute top-0 right-0 text-[#AAAAAA] text-xs">┐</span>
                <span className="absolute bottom-0 left-0 text-[#AAAAAA] text-xs">└</span>
                <span className="absolute bottom-0 right-0 text-[#AAAAAA] text-xs">┘</span>
                <div className="px-2 py-1 leading-tight text-[#888888]">
                  SMALL<br />
                  STEPS.<br />
                  A BIGGER<br />
                  YOU.
                </div>
              </div>

              {/* Bottom Right Monospace Vertical Stack */}
              <div className="text-right leading-tight text-[#777777]">
                RESEARCH<br />
                PRACTICE<br />
                IMPROVE<br />
                SUCCEED
                <div className="w-4 h-[2px] bg-[#E8FF00] mt-1.5 ml-auto"></div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 02 FEATURE CARDS ROW (4 COLUMNS) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto w-full border-b border-[#E8E8E2]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="group relative bg-white p-7 rounded-2xl border border-[#E5E5DF] hover:border-[#0A0A0A] transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E8FF00] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#E8FF00] border border-black/10 flex items-center justify-center text-[#0A0A0A] shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <FileText className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="font-mono text-[10px] text-[#888888] group-hover:text-[#0A0A0A] font-bold tracking-wider uppercase bg-[#F4F4F0] px-2.5 py-1 rounded-md border border-[#E5E5DF] transition-colors">
                  01 // RESEARCH
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-2 group-hover:text-black tracking-tight">
                Deep Company Research
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed mb-6 font-normal">
                Get insights on culture, tech stack, recent news, and high-priority company signals.
              </p>
            </div>
            <div className="pt-4 border-t border-[#F0F0EC] flex items-center justify-between font-mono text-[11px] text-[#777777]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF00] group-hover:animate-ping"></span>
                <span>Real-Time Web Crawler</span>
              </span>
              <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#0A0A0A]" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-white p-7 rounded-2xl border border-[#E5E5DF] hover:border-[#0A0A0A] transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E8FF00] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#E8FF00] border border-black/10 flex items-center justify-center text-[#0A0A0A] shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Target className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="font-mono text-[10px] text-[#888888] group-hover:text-[#0A0A0A] font-bold tracking-wider uppercase bg-[#F4F4F0] px-2.5 py-1 rounded-md border border-[#E5E5DF] transition-colors">
                  02 // TARGETED
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-2 group-hover:text-black tracking-tight">
                Targeted Practice Questions
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed mb-6 font-normal">
                Role-specific, difficulty-ranked questions mapped directly to job description requirements.
              </p>
            </div>
            <div className="pt-4 border-t border-[#F0F0EC] flex items-center justify-between font-mono text-[11px] text-[#777777]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF00] group-hover:animate-ping"></span>
                <span>100% Requirement Match</span>
              </span>
              <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#0A0A0A]" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-white p-7 rounded-2xl border border-[#E5E5DF] hover:border-[#0A0A0A] transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E8FF00] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#E8FF00] border border-black/10 flex items-center justify-center text-[#0A0A0A] shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Calendar className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="font-mono text-[10px] text-[#888888] group-hover:text-[#0A0A0A] font-bold tracking-wider uppercase bg-[#F4F4F0] px-2.5 py-1 rounded-md border border-[#E5E5DF] transition-colors">
                  03 // ADAPTIVE
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-2 group-hover:text-black tracking-tight">
                Personalized Study Plan
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed mb-6 font-normal">
                A smart plan that fits your preparation timeline and focuses heavily on high-priority topics.
              </p>
            </div>
            <div className="pt-4 border-t border-[#F0F0EC] flex items-center justify-between font-mono text-[11px] text-[#777777]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF00] group-hover:animate-ping"></span>
                <span>Dynamic Schedule</span>
              </span>
              <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#0A0A0A]" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="group relative bg-white p-7 rounded-2xl border border-[#E5E5DF] hover:border-[#0A0A0A] transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E8FF00] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#E8FF00] border border-black/10 flex items-center justify-center text-[#0A0A0A] shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Zap className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="font-mono text-[10px] text-[#888888] group-hover:text-[#0A0A0A] font-bold tracking-wider uppercase bg-[#F4F4F0] px-2.5 py-1 rounded-md border border-[#E5E5DF] transition-colors">
                  04 // SPEED
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#0A0A0A] mb-2 group-hover:text-black tracking-tight">
                Learn Faster
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed mb-6 font-normal">
                Flashcards, mock practice, and real-time weak spot analytics — all in one unified workspace.
              </p>
            </div>
            <div className="pt-4 border-t border-[#F0F0EC] flex items-center justify-between font-mono text-[11px] text-[#777777]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF00] group-hover:animate-ping"></span>
                <span>Active Recall Engine</span>
              </span>
              <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#0A0A0A]" />
            </div>
          </div>

        </div>
      </section>

      {/* 03 HOW IT WORKS WORKFLOW SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto w-full border-b border-[#E8E8E2]">
        <div className="space-y-12">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs text-[#777777] uppercase tracking-wider">
                <span className="w-1.5 h-3 bg-[#E8FF00]"></span>
                <span>01 / WORKFLOW</span>
                <span className="text-[#CCCCCC]">|</span>
                <span>HOW IT WORKS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight">
                From job post to interview ready in <span className="bg-[#E8FF00] px-2 py-0.5">3 simple steps.</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#666666] max-w-md leading-relaxed font-mono">
              Our autonomous pipeline parses requirements, crawls company signals, and builds your custom preparation environment.
            </p>
          </div>

          {/* 3 Step Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-2xl border border-[#E8E8E2] space-y-6 hover:border-[#0A0A0A] transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between font-mono text-xs text-[#777777]">
                <span className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs">01</span>
                <span className="uppercase tracking-widest text-[10px]">INPUT STAGE</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#0A0A0A]">Paste Job Context</h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  Enter the job description text, company website URL, and your remaining interview preparation days.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F0F0EC] font-mono text-[11px] text-[#888888] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E8FF00]"></span>
                <span>Instant Job Parsing & Skill Extraction</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-2xl border border-[#E8E8E2] space-y-6 hover:border-[#0A0A0A] transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between font-mono text-xs text-[#777777]">
                <span className="w-8 h-8 rounded-full bg-[#E8FF00] text-black flex items-center justify-center font-bold text-xs">02</span>
                <span className="uppercase tracking-widest text-[10px]">AI AGENT PIPELINE</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#0A0A0A]">Autonomous Research</h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  AI agents crawl company websites to extract culture signals, tech stack details, and compile targeted question banks.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F0F0EC] font-mono text-[11px] text-[#888888] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E8FF00]"></span>
                <span>Live Terminal Log Tracking</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-2xl border border-[#E8E8E2] space-y-6 hover:border-[#0A0A0A] transition-all relative overflow-hidden group">
              <div className="flex items-center justify-between font-mono text-xs text-[#777777]">
                <span className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs">03</span>
                <span className="uppercase tracking-widest text-[10px]">PRACTICE & EXECUTE</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#0A0A0A]">Master Your Prep Kit</h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  Practice categorized questions, review flashcards, track requirement coverage, and execute your day-by-day study plan.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F0F0EC] font-mono text-[11px] text-[#888888] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E8FF00]"></span>
                <span>Real-Time Weak Spot Matrix</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 04 SYSTEM CAPABILITIES MATRIX SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto w-full border-b border-[#E8E8E2]">
        <div className="space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-[#777777] uppercase tracking-wider bg-[#F4F4F0] px-3 py-1 rounded-full border border-[#E5E5E0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF00]"></span>
              <span>02 / CAPABILITIES</span>
              <span>•</span>
              <span>COMPREHENSIVE PREPARATION SYSTEM</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight leading-tight">
              Everything required to step into your interview with <span className="bg-[#E8FF00] px-2 py-0.5">10x confidence.</span>
            </h2>
          </div>

          {/* 6 Capabilities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {[
              {
                number: "01",
                title: "Company Research Brief",
                desc: "Autonomous web research summarizing company mission, culture signals, tech stack breakdown, and recent hiring news."
              },
              {
                number: "02",
                title: "Requirement Match Matrix",
                desc: "Deterministic extraction of role requirements categorized into technical, behavioural, and domain MUST / NICE priorities."
              },
              {
                number: "03",
                title: "Categorized Question Bank",
                desc: "Targeted practice questions with complete answer outlines, difficulty scoring, and direct requirement mapping."
              },
              {
                number: "04",
                title: "Active Recall Flashcards",
                desc: "Interactive review flashcards featuring confidence rating scales to lock in critical concepts quickly."
              },
              {
                number: "05",
                title: "Dynamic Study Schedule",
                desc: "Arithmetic day-by-day allocation spreading review topics evenly across your remaining preparation timeline."
              },
              {
                number: "06",
                title: "Weak Spot Risk Matrix",
                desc: "Real-time readiness analytics highlighting unmastered skills so you know exactly what to focus on before interview day."
              }
            ].map((cap) => (
              <div key={cap.number} className="bg-white p-7 rounded-2xl border border-[#E8E8E2] space-y-4 hover:border-[#0A0A0A] transition-all group">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-xs font-bold text-[#0A0A0A] bg-[#F4F4F0] px-2.5 py-1 rounded-md border border-[#E5E5E0]">
                    {cap.number}
                  </span>
                  <span className="text-[10px] text-[#888888] uppercase tracking-widest">MODULE</span>
                </div>
                <h3 className="text-lg font-bold text-[#0A0A0A] group-hover:text-black transition-colors">{cap.title}</h3>
                <p className="text-xs text-[#666666] leading-relaxed font-sans">{cap.desc}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* 05 FAQ SECTION */}
      <FaqSection />

      {/* 06 CTA BANNER SECTION */}
      <CtaBanner />

    </div>
  );
}

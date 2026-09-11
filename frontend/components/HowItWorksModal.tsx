'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Globe, 
  HelpCircle, 
  Layers, 
  Calendar, 
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Check,
  Sparkles,
  Link as LinkIcon,
  Users,
  Newspaper,
  MessageSquare,
  Briefcase,
  Search,
  Code2,
  Database,
  Bookmark,
  Building,
  Target,
  BarChart3,
  Brain,
  RotateCcw
} from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_DATA = [
  {
    step: 1,
    id: 'parse',
    navTitle: '1. Parse\nJob Description',
    shortNavTitle: '1. Parse Job Description',
    icon: FileText,
    heading: 'Parse Job Description',
    description: 'We analyze the job post to extract key requirements, technologies, skills, and responsibilities using AI.',
    bulletPoints: [
      'Extract role, seniority, and tech stack',
      'Identify must-have and nice-to-have skills',
      'Create a structured requirements matrix'
    ],
    // Right Card Graphic Data
    primaryCard: {
      title: 'Job Description',
      icon: LinkIcon,
      pills: ['React', 'Node.js', 'PostgreSQL', 'System Design', 'Communication']
    },
    secondaryCard: {
      title: 'Extracting key details...',
      checklist: [
        { label: 'Role & seniority', done: true },
        { label: 'Technical skills', done: true },
        { label: 'Responsibilities', done: false },
        { label: 'Requirements matrix', done: false }
      ]
    }
  },
  {
    step: 2,
    id: 'research',
    navTitle: '2. Research\nCompany',
    shortNavTitle: '2. Research Company',
    icon: Globe,
    heading: 'Research Company',
    description: 'We crawl official websites and public engineering sources to uncover culture, values, and interview style.',
    bulletPoints: [
      'Scrape company website & tech blogs',
      'Extract core values and leadership principles',
      'Identify key products and architectural challenges'
    ],
    primaryCard: {
      title: 'Company Crawler',
      icon: Globe,
      pills: ['Stripe.com', 'Fintech', 'API First', 'Payments', 'Scale']
    },
    secondaryCard: {
      title: 'ACME Corp Brief',
      checklist: [
        { label: 'Company overview', done: true },
        { label: 'Culture & values', done: true },
        { label: 'Tech stack', done: true },
        { label: 'Recent news', done: true },
        { label: 'Interview insights', done: true }
      ]
    }
  },
  {
    step: 3,
    id: 'questions',
    navTitle: '3. Generate\nQuestions',
    shortNavTitle: '3. Generate Questions',
    icon: HelpCircle,
    heading: 'Generate Targeted Questions',
    description: 'Our LLM synthesizes tailored technical, behavioral, and system design questions tailored to your seniority.',
    bulletPoints: [
      'Tailored technical questions with full answers',
      'STAR-method behavioral interview scenarios',
      'System design architecture challenges'
    ],
    primaryCard: {
      title: 'Question Engine',
      icon: HelpCircle,
      pills: ['System Design', 'Behavioral', 'Algorithm', 'System Architecture']
    },
    secondaryCard: {
      title: 'Synthesizing Questions...',
      checklist: [
        { label: '30 Tailored questions generated', done: true },
        { label: 'Ideal answer rubrics created', done: true },
        { label: 'Difficulty leveled to role', done: true },
        { label: 'STAR stories mapped', done: true }
      ]
    }
  },
  {
    step: 4,
    id: 'flashcards',
    navTitle: '4. Create\nFlashcards',
    shortNavTitle: '4. Create Flashcards',
    icon: Layers,
    heading: 'Create Practice Flashcards',
    description: 'Turn complex concepts and questions into interactive study flashcards for fast recall during practice drills.',
    bulletPoints: [
      'Spaced repetition flashcard decks',
      'Instant self-confidence rating (1 to 5)',
      'Swipeable practice interface'
    ],
    primaryCard: {
      title: 'Flashcard Decks',
      icon: Layers,
      pills: ['Active Recall', 'Spaced Repetition', 'Self Rating', 'Drills']
    },
    secondaryCard: {
      title: 'Building Flashcard Decks...',
      checklist: [
        { label: 'Deck created & sorted', done: true },
        { label: 'Hints & key terms tagged', done: true },
        { label: 'Confidence rating ready', done: true },
        { label: 'Mobile gestures enabled', done: true }
      ]
    }
  },
  {
    step: 5,
    id: 'plan',
    navTitle: '5. Build\nStudy Plan',
    shortNavTitle: '5. Build Study Plan',
    icon: Calendar,
    heading: 'Build Adaptive Study Plan',
    description: 'Structure your interview preparation into an actionable day-by-day roadmap tailored to your target date.',
    bulletPoints: [
      'Personalized 1 to 30 day sprint schedule',
      'Daily goal breakdown and time estimates',
      'Progress tracking dashboard'
    ],
    primaryCard: {
      title: '7-Day Sprint Plan',
      icon: Calendar,
      pills: ['Day 1: System Design', 'Day 2: React', 'Day 3: Behavioral', 'Day 4: Mock']
    },
    secondaryCard: {
      title: 'Finalizing Roadmap...',
      checklist: [
        { label: 'Schedule structured', done: true },
        { label: 'Daily targets assigned', done: true },
        { label: 'Kit saved to workspace', done: true },
        { label: 'Ready for practice!', done: true }
      ]
    }
  }
];

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  // Initialize state from localStorage if available
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [checkedCount, setCheckedCount] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [mounted, setMounted] = useState<boolean>(false);

  // Reset to Step 1 whenever modal is closed
  useEffect(() => {
    if (!isOpen) {
      setActiveStepIndex(0);
      setCheckedCount(0);
      setIsPlaying(true);
    }
  }, [isOpen]);

  const handleCloseModal = () => {
    setActiveStepIndex(0);
    setCheckedCount(0);
    setIsPlaying(true);
    try {
      localStorage.removeItem('how_it_works_active_step');
      localStorage.removeItem('how_it_works_checked_count');
    } catch {}
    onClose();
  };

  // Save activeStepIndex to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('how_it_works_active_step', String(activeStepIndex));
    } catch {}
  }, [activeStepIndex, mounted]);

  // Save checkedCount to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('how_it_works_checked_count', String(checkedCount));
    } catch {}
  }, [checkedCount, mounted]);

  // Reset checkedCount ONLY when step index changes manually
  const prevStepRef = React.useRef(activeStepIndex);
  useEffect(() => {
    if (prevStepRef.current !== activeStepIndex) {
      setCheckedCount(0);
      prevStepRef.current = activeStepIndex;
    }
  }, [activeStepIndex]);

  // Sequential ticking animation per slide then advance slide
  useEffect(() => {
    if (!isOpen) return;
    if (!isPlaying) return;

    const maxCount = activeStepIndex === 1 ? 12 : 4;
    const baseIntervalTime = activeStepIndex === 1 ? 480 : 700;
    const baseTotalSlideTime = activeStepIndex === 1 ? 7600 : 4800;

    const intervalTime = baseIntervalTime / speed;
    const totalSlideTime = baseTotalSlideTime / speed;

    // Ticking animation interval
    const tickInterval = setInterval(() => {
      setCheckedCount(prev => {
        if (prev < maxCount) {
          return prev + 1;
        }
        return prev;
      });
    }, intervalTime);

    // Slide transition timer: advance to next slide or pause on final step
    const slideTimer = setTimeout(() => {
      if (activeStepIndex === STEP_DATA.length - 1) {
        setIsPlaying(false);
      } else {
        setActiveStepIndex(prev => prev + 1);
      }
    }, totalSlideTime);

    return () => {
      clearInterval(tickInterval);
      clearTimeout(slideTimer);
    };
  }, [isOpen, activeStepIndex, isPlaying, speed]);

  const handleRestartAll = () => {
    setActiveStepIndex(0);
    setCheckedCount(0);
    setIsPlaying(true);
  };

  const handleResetCurrentStep = () => {
    setCheckedCount(0);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (activeStepIndex < STEP_DATA.length - 1) {
      setActiveStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(prev => prev - 1);
    }
  };

  // Keyboard Navigation: Space = Play/Pause, 'R'/'r' = Reset Step, Cmd+R / Ctrl+R = Restart All, ArrowRight = Next, ArrowLeft = Prev
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keypresses if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'KeyR' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRestartAll();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleResetCurrentStep();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeStepIndex]);

  if (!isOpen) return null;

  const currentStep = STEP_DATA[activeStepIndex];

  // Derived animation phases for Step 2:
  // Phase 1 (0..5): Left 5 source cards tick sequentially & send data into AI Research box
  // Phase 2 (5..6): AI Calculation Phase! Star icon spins, calculation pill pops up, aura pulses
  // Phase 3 (7..12): Output arrow streams data to ACME card, checking off 5 items sequentially
  const leftActiveCount = Math.min(5, checkedCount);
  const isAiProcessing = checkedCount >= 5 && checkedCount <= 6;
  const isOutputActive = checkedCount >= 7;
  const rightActiveCount = Math.max(0, checkedCount - 6);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleCloseModal}
    >
      
      {/* Modal Outer Container (Fixed height to prevent popup sizing shifts) */}
      <div 
        className="relative w-full max-w-[1020px] h-[610px] bg-[#FFFFFF] text-[#0A0A0A] rounded-[28px] shadow-2xl overflow-hidden flex flex-col border border-[#E5E5DF] animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-5 pb-3 bg-[#FFFFFF] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8FF00] border border-[#D0E600] flex items-center justify-center text-[#0A0A0A] shadow-xs">
              <Play className="w-5 h-5 fill-current ml-0.5 text-[#0A0A0A]" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-[#0A0A0A] tracking-tight">How prepKit Works</h3>
              <p className="text-xs sm:text-sm text-[#777777] font-normal">
                From job post to interview readiness — in a few simple steps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Restart All Button in Top-Right Header */}
            <button
              onClick={handleRestartAll}
              className="px-3 py-1.5 rounded-full bg-[#F4F4F0] hover:bg-[#EAEAE4] text-[#0A0A0A] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#E2E2DC] cursor-pointer shadow-2xs"
              title="Restart walkthrough from Step 1 (Key: ⌘R)"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Restart All</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9.5px] font-mono font-bold bg-white text-[#666666] border border-[#E2E2DC] rounded-md ml-0.5">
                ⌘R
              </kbd>
            </button>

            <button
              onClick={handleCloseModal}
              className="w-9 h-9 rounded-full bg-[#F4F4F0] hover:bg-[#EAEAE4] text-[#666666] hover:text-[#0A0A0A] flex items-center justify-center transition-colors border border-[#E2E2DC] cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Top 5-Step Horizontal Navigation Line */}
        <div className="px-6 sm:px-8 py-3 bg-[#FFFFFF] border-b border-[#F0F0EB] shrink-0">
          <div className="relative flex items-center justify-between max-w-[760px] mx-auto">
            
            {/* Horizontal Connecting Progress Line */}
            <div className="absolute top-[22px] left-6 right-6 h-[1.5px] bg-[#EAEAE4] -translate-y-1/2 z-0">
              <div 
                className="h-full bg-[#E8FF00] transition-all duration-500 ease-out"
                style={{ width: `${(activeStepIndex / (STEP_DATA.length - 1)) * 100}%` }}
              ></div>
            </div>

            {/* 5 Step Icons */}
            {STEP_DATA.map((item, idx) => {
              const StepIcon = item.icon;
              const isActive = idx === activeStepIndex;
              const isPast = idx < activeStepIndex;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveStepIndex(idx)}
                  className="relative z-10 flex flex-col items-center group cursor-pointer"
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-[#E8FF00] text-[#0A0A0A] border-2 border-[#0A0A0A] scale-105 shadow-md shadow-[#E8FF00]/40'
                      : isPast
                      ? 'bg-[#0A0A0A] text-[#E8FF00] border border-[#0A0A0A]'
                      : 'bg-[#FFFFFF] text-[#999999] border border-[#E2E2DC] hover:border-[#BBBBBB]'
                  }`}>
                    <StepIcon className={`w-5 h-5 ${isActive ? 'text-[#0A0A0A]' : isPast ? 'text-[#E8FF00]' : 'text-[#888888]'}`} />
                  </div>
                  
                  {/* Step Title Label under icon */}
                  <span className={`text-[11px] mt-2 text-center whitespace-pre-line leading-tight transition-colors ${
                    isActive 
                      ? 'text-[#0A0A0A] font-black' 
                      : 'text-[#888888] font-semibold'
                  }`}>
                    {item.navTitle}
                  </span>
                </button>
              );
            })}

          </div>
        </div>

        {/* Modal Main Body (Fixed height flex container to prevent dynamic pop-up resizing) */}
        <div className="p-5 sm:p-6 bg-[#FBFBF8] flex-1 overflow-hidden flex items-center">
          <div 
            key={activeStepIndex}
            className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-center animate-in slide-in-from-right-10 duration-400 fade-in ease-out"
          >
            
            {/* Compact Left Column: Step Info & Bullet Points (md:col-span-4) */}
            <div className="md:col-span-4 space-y-3 pr-2">
              
              {/* Title & Description with Homepage Style Inline Lime Highlight (No Border) */}
              <h2 className="text-2xl sm:text-3xl font-black text-[#0A0A0A] tracking-tight leading-tight">
                <span className="bg-[#E8FF00] text-[#0A0A0A] px-1.5 py-0.5 inline">
                  {currentStep.heading}
                </span>
              </h2>
              
              <p className="text-xs text-[#666666] leading-relaxed font-normal min-h-[36px]">
                {currentStep.description}
              </p>

              {/* Green Check Bullet Points */}
              <div className="space-y-2 pt-1">
                {currentStep.bulletPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-md bg-[#E8FF00] border border-[#D0E600] flex items-center justify-center text-[#0A0A0A] shrink-0 mt-0.5 shadow-2xs">
                      <Check className="w-2.8 h-2.8 stroke-[3]" />
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A1A] leading-snug">
                      {point}
                    </span>
                  </div>
                ))}
              </div>

            </div>

            {/* Maximized Right Column: Graphic Animation Canvas (md:col-span-8) */}
            <div className="md:col-span-8 relative h-[350px] flex items-center justify-center p-4 overflow-hidden shrink-0">

              {/* STEP 4 CUSTOM GRAPHIC: Create Practice Flashcards (Matching media_1789166925) */}
              {activeStepIndex === 3 ? (
                <div className="w-full relative flex items-center justify-between min-h-[320px] animate-in fade-in zoom-in-95 duration-400 py-1 px-1 z-20">
                  
                  {/* 1. Left Center Node: AI Flashcard Engine Box */}
                  <div className="relative shrink-0 z-20 ml-1">
                    <div className={`w-24 h-24 rounded-[26px] bg-[#E8FF3B] shadow-[0_8px_24px_rgba(200,240,0,0.35)] flex flex-col items-center justify-center text-center p-2.5 transition-all duration-300 ${
                      checkedCount >= 1 ? 'scale-105 shadow-[0_0_25px_rgba(232,255,0,0.7)] ring-2 ring-[#0A0A0A]' : ''
                    }`}>
                      <Sparkles className={`w-7 h-7 text-[#0A0A0A] fill-[#0A0A0A] mb-1 transition-transform duration-500 ${
                        checkedCount >= 1 ? 'rotate-12 scale-110' : ''
                      }`} />
                      <span className="font-extrabold text-[12px] text-[#0A0A0A] tracking-tight leading-tight">AI Engine</span>
                      <span className="text-[9.5px] font-semibold text-[#4D5D00] leading-tight mt-1">Create Flashcards</span>
                    </div>
                  </div>

                  {/* 2. Modern Animated Glowing SVG Beam Connector */}
                  <div className="w-16 relative h-[320px] z-10 flex items-center justify-center pointer-events-none">
                    <svg className="w-full h-10" viewBox="0 0 60 24" fill="none">
                      <defs>
                        <linearGradient id="lime-beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#E8FF00" stopOpacity="0.2" />
                          <stop offset="50%" stopColor="#E8FF00" stopOpacity="1" />
                          <stop offset="100%" stopColor="#A8E600" stopOpacity="0.8" />
                        </linearGradient>
                        <filter id="beam-glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Base Track */}
                      <line x1="4" y1="12" x2="48" y2="12" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />

                      {/* Active Glowing Animated Beam Line */}
                      <path 
                        d="M 4 12 L 48 12" 
                        stroke="url(#lime-beam-grad)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                        filter="url(#beam-glow)"
                        className={checkedCount >= 1 ? "animate-wire-flow" : ""} 
                        strokeDasharray={checkedCount >= 1 ? "8 6" : "none"} 
                        opacity={checkedCount >= 1 ? 1 : 0.3}
                      />

                      {/* Arrowhead Cap */}
                      <path 
                        d="M 42 6 L 52 12 L 42 18" 
                        stroke="#0A0A0A" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        fill="none" 
                        opacity={checkedCount >= 1 ? 1 : 0.4}
                      />
                    </svg>
                  </div>                  {/* 3. Right Container: Stacked Flashcards (Originating from AI Engine box) */}
                  <div className="flex-1 flex items-center justify-center z-20">
                    
                    {/* Flashcard Stack Container */}
                    <div className="relative w-[245px] h-[220px] flex items-center justify-center">
                      
                      {/* Dual-Color (Black + Fluorescent Lime) Hand-Drawn Spark Rays at Top-Right Corner */}
                      {checkedCount >= 3 && (
                        <div className="absolute -top-3.5 -right-3.5 z-40 pointer-events-none animate-tick-pop">
                          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                            {/* Black Outline Rays (Background) */}
                            <line x1="8" y1="8" x2="2" y2="2" stroke="#0A0A0A" strokeWidth="4.5" strokeLinecap="round" />
                            <line x1="16" y1="6" x2="16" y2="0" stroke="#0A0A0A" strokeWidth="4.5" strokeLinecap="round" />
                            <line x1="24" y1="8" x2="30" y2="2" stroke="#0A0A0A" strokeWidth="4.5" strokeLinecap="round" />

                            {/* Lime Highlight Inner Rays (Foreground) */}
                            <line x1="8" y1="8" x2="2" y2="2" stroke="#E8FF00" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="16" y1="6" x2="16" y2="0" stroke="#E8FF00" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="24" y1="8" x2="30" y2="2" stroke="#E8FF00" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Card 1 (Bottom Back Card - System Design - flies out from AI node when checkedCount >= 1) */}
                      <div className={`absolute inset-0 bg-white rounded-3xl border-2 border-[#0A0A0A] shadow-md p-4.5 flex flex-col justify-between transition-all duration-700 ease-out origin-bottom-left ${
                        checkedCount >= 1 
                          ? 'rotate-[-8deg] -translate-x-3 -translate-y-2 opacity-100 scale-100 z-10 pointer-events-auto' 
                          : 'rotate-[-20deg] -translate-x-[220px] opacity-0 scale-50 z-0 pointer-events-none'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="bg-[#F3E8FF] text-[#8B5CF6] px-2.5 py-0.5 rounded-lg text-[9.5px] font-extrabold uppercase">SYSTEM DESIGN</span>
                          <div className="flex items-center gap-1 text-[#555555]">
                            <span className="text-[10px] font-bold">3 / 4</span>
                            <Bookmark className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="text-[11px] font-bold text-[#0A0A0A] leading-snug text-center my-auto line-clamp-2">
                          Design a rate limiter for microservices architecture.
                        </p>
                        <div className="border-t border-[#EAEAE4] pt-1.5 flex items-center justify-center gap-1 text-[#666666]">
                          <Sparkles className="w-2.5 h-2.5 text-[#A8E600]" />
                          <span className="text-[9px] font-semibold">Click to reveal answer</span>
                        </div>
                      </div>

                      {/* Card 2 (Middle Card - Behavioural - flies out from AI node when checkedCount >= 2) */}
                      <div className={`absolute inset-0 bg-white rounded-3xl border-2 border-[#0A0A0A] shadow-lg p-4.5 flex flex-col justify-between transition-all duration-700 ease-out origin-bottom-left ${
                        checkedCount >= 2 
                          ? 'rotate-[-4deg] -translate-x-1.5 -translate-y-1 opacity-100 scale-100 z-20 pointer-events-auto' 
                          : 'rotate-[-20deg] -translate-x-[220px] opacity-0 scale-50 z-0 pointer-events-none'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="bg-[#EEF7E8] text-[#3B8216] px-2.5 py-0.5 rounded-lg text-[9.5px] font-extrabold uppercase">BEHAVIOURAL</span>
                          <div className="flex items-center gap-1 text-[#555555]">
                            <span className="text-[10px] font-bold">2 / 4</span>
                            <Bookmark className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="text-[11px] font-bold text-[#0A0A0A] leading-snug text-center my-auto line-clamp-2">
                          Describe a time when you resolved a production emergency under pressure.
                        </p>
                        <div className="border-t border-[#EAEAE4] pt-1.5 flex items-center justify-center gap-1 text-[#666666]">
                          <Sparkles className="w-2.5 h-2.5 text-[#A8E600]" />
                          <span className="text-[9px] font-semibold">Click to reveal answer</span>
                        </div>
                      </div>

                      {/* Card 3 (Top Active Main Card - Technical - flies out from AI node when checkedCount >= 3) */}
                      <div className={`absolute inset-0 bg-white rounded-3xl border-2 border-[#0A0A0A] shadow-xl p-4.5 flex flex-col justify-between transition-all duration-700 ease-out origin-bottom-left ${
                        checkedCount >= 3 
                          ? 'rotate-0 translate-x-0 translate-y-0 opacity-100 scale-100 z-30 pointer-events-auto' 
                          : 'rotate-[-20deg] -translate-x-[220px] opacity-0 scale-50 z-0 pointer-events-none'
                      }`}>
                        
                        {/* Card Top Row: Category Pill & Counter */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="bg-[#E8F1FF] text-[#0066FF] px-2.5 py-1 rounded-xl font-extrabold text-[10.5px] tracking-wider uppercase">
                            TECHNICAL
                          </span>
                          <div className="flex items-center gap-1.5 text-[#555555]">
                            <span className="text-[11px] font-bold">1 / 4</span>
                            <Bookmark className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Card Question Center Text */}
                        <div className="my-auto text-center px-1 py-1">
                          <p className="text-[12px] font-extrabold text-[#0A0A0A] leading-snug">
                            What is the event loop in Node.js and how does it achieve concurrency?
                          </p>
                        </div>

                        {/* Card Footer: Reveal Answer Hint */}
                        <div className="border-t border-[#F0F0EB] pt-2 flex items-center justify-center gap-1.5 text-[#666666]">
                          <Sparkles className="w-3 h-3 text-[#A8E600]" />
                          <span className="text-[10px] font-semibold">Click to reveal answer</span>
                        </div>

                      </div>

                    </div>

                  </div>

                </div>
              ) : activeStepIndex === 2 ? (
                <div className="w-full relative flex items-center justify-between min-h-[320px] animate-in fade-in zoom-in-95 duration-400 py-1 px-1 z-20">
                  
                  {/* 1. Left Center Node: AI Question Generator Engine Box */}
                  <div className="relative shrink-0 z-20 ml-2">
                    <div className="w-24 h-24 rounded-[26px] bg-[#E8FF3B] shadow-[0_8px_24px_rgba(200,240,0,0.35)] flex flex-col items-center justify-center text-center p-2.5">
                      <Sparkles className="w-7 h-7 text-[#0A0A0A] fill-[#0A0A0A] mb-1" />
                      <span className="font-extrabold text-[12px] text-[#0A0A0A] tracking-tight leading-tight">AI Engine</span>
                      <span className="text-[9.5px] font-semibold text-[#4D5D00] leading-tight mt-1">Generate Questions</span>
                    </div>
                  </div>

                  {/* 2. Connecting Wires SVG: 3 wires branching out from AI Engine to the 3 Cards */}
                  <div className="w-14 relative h-[320px] z-10 flex items-center justify-center">
                    <svg className="w-full h-full pointer-events-none" viewBox="0 0 50 320" preserveAspectRatio="none">
                      {/* Static Background Wires */}
                      <path d="M 0 160 Q 25 160 50 52" stroke="#C5F030" strokeWidth="2.5" fill="none" opacity="0.5" />
                      <path d="M 0 160 L 50 160" stroke="#C5F030" strokeWidth="2.5" fill="none" opacity="0.5" />
                      <path d="M 0 160 Q 25 160 50 268" stroke="#C5F030" strokeWidth="2.5" fill="none" opacity="0.5" />

                      {/* Animated Active Data Stream Wires */}
                      {checkedCount >= 1 && <path d="M 0 160 Q 25 160 50 52" stroke="#A8E600" strokeWidth="3.5" fill="none" className="animate-wire-flow" />}
                      {checkedCount >= 2 && <path d="M 0 160 L 50 160" stroke="#A8E600" strokeWidth="3.5" fill="none" className="animate-wire-flow" />}
                      {checkedCount >= 3 && <path d="M 0 160 Q 25 160 50 268" stroke="#A8E600" strokeWidth="3.5" fill="none" className="animate-wire-flow" />}
                    </svg>
                  </div>

                  {/* 3. Right Column: 3 Question Cards popping out from the AI Engine */}
                  <div className="flex-1 max-w-[390px] space-y-2.5 z-20 pr-1">
                    
                    {/* Card 1: TECHNICAL */}
                    <div className={`p-3 rounded-2xl bg-white border transition-all duration-400 ${
                      checkedCount >= 1 
                        ? 'border-[#0A0A0A] shadow-md translate-x-0 opacity-100' 
                        : 'border-[#ECECE8] shadow-2xs -translate-x-6 opacity-30'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-xl bg-[#E8F1FF] text-[#0066FF] flex items-center justify-center shrink-0">
                          <Code2 className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <span className="font-black text-[10px] text-[#0066FF] tracking-wider uppercase">TECHNICAL</span>
                      </div>
                      <p className="text-[11px] font-bold text-[#0A0A0A] leading-snug mb-1.5">
                        How does the Node.js event loop handle asynchronous I/O operations?
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-[#F2F2EE] text-[#555555] px-2 py-0.5 rounded-full text-[9px] font-medium">Node.js</span>
                        <span className="bg-[#F2F2EE] text-[#555555] px-2 py-0.5 rounded-full text-[9px] font-medium">Event Loop</span>
                        <span className="bg-[#F2F2EE] text-[#555555] px-2 py-0.5 rounded-full text-[9px] font-medium">Asynchronous</span>
                      </div>
                    </div>

                    {/* Card 2: BEHAVIOURAL */}
                    <div className={`p-3 rounded-2xl bg-white border transition-all duration-400 ${
                      checkedCount >= 2 
                        ? 'border-[#0A0A0A] shadow-md translate-x-0 opacity-100 ring-2 ring-[#E8FF00]' 
                        : 'border-[#ECECE8] shadow-2xs -translate-x-6 opacity-30'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-xl bg-[#EEF7E8] text-[#3B8216] flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <span className="font-black text-[10px] text-[#3B8216] tracking-wider uppercase">BEHAVIOURAL</span>
                      </div>
                      <p className="text-[11px] font-bold text-[#0A0A0A] leading-snug mb-1.5">
                        Tell me about a time you handled a production incident. What was the impact and how did you resolve it?
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-[#F2F2EE] text-[#555555] px-2 py-0.5 rounded-full text-[9px] font-medium">Problem Solving</span>
                        <span className="bg-[#F2F2EE] text-[#555555] px-2 py-0.5 rounded-full text-[9px] font-medium">Ownership</span>
                        <span className="bg-[#F2F2EE] text-[#555555] px-2 py-0.5 rounded-full text-[9px] font-medium">Communication</span>
                      </div>
                    </div>

                    {/* Card 3: SYSTEM DESIGN */}
                    <div className={`p-3 rounded-2xl bg-white border transition-all duration-400 ${
                      checkedCount >= 3 
                        ? 'border-[#0A0A0A] shadow-md translate-x-0 opacity-100' 
                        : 'border-[#ECECE8] shadow-2xs -translate-x-6 opacity-30'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-xl bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center shrink-0">
                          <Database className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <span className="font-black text-[10px] text-[#8B5CF6] tracking-wider uppercase">SYSTEM DESIGN</span>
                      </div>
                      <p className="text-[11px] font-bold text-[#0A0A0A] leading-snug mb-1.5">
                        Design a scalable URL shortener. What components would you include and how would you handle high traffic?
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-[#F2F2EE] text-[#555555] px-2 py-0.5 rounded-full text-[9px] font-medium">System Design</span>
                        <span className="bg-[#F2F2EE] text-[#555555] px-2 py-0.5 rounded-full text-[9px] font-medium">Scalability</span>
                        <span className="bg-[#F2F2EE] text-[#555555] px-2 py-0.5 rounded-full text-[9px] font-medium">Databases</span>
                      </div>
                    </div>

                  </div>

                </div>
              ) : activeStepIndex === 1 ? (
                <div className="w-full relative flex items-center justify-between min-h-[320px] animate-in fade-in zoom-in-95 duration-400 py-1 px-1">
                  
                  {/* 1. Left Column: 5 Source Site Nodes (Theme matching reference image) */}
                  <div className="space-y-2.5 shrink-0 z-20">
                    {[
                      { 
                        label: 'Company Website', 
                        sub: 'About, Products, Mission',
                        renderIcon: () => (
                          <div className="w-8 h-8 rounded-xl bg-[#F0F4FA] flex items-center justify-center shrink-0 border border-[#E2E8F0]">
                            <Globe className="w-4.5 h-4.5 text-[#0B2545] stroke-[2.2]" />
                          </div>
                        )
                      },
                      { 
                        label: 'LinkedIn', 
                        sub: 'Culture, People, Updates',
                        renderIcon: () => (
                          <div className="w-8 h-8 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                            in
                          </div>
                        )
                      },
                      { 
                        label: 'News & Blogs', 
                        sub: 'Latest developments',
                        renderIcon: () => (
                          <div className="w-8 h-8 rounded-xl bg-[#F0F4FA] flex items-center justify-center shrink-0 border border-[#E2E8F0]">
                            <Newspaper className="w-4.5 h-4.5 text-[#0B2545] stroke-[2.2]" />
                          </div>
                        )
                      },
                      { 
                        label: 'Interview Platforms', 
                        sub: 'Real candidate experiences',
                        renderIcon: () => (
                          <div className="w-8 h-8 rounded-xl bg-[#F0F4FA] flex items-center justify-center shrink-0 border border-[#E2E8F0]">
                            <MessageSquare className="w-4.5 h-4.5 text-[#0B2545] stroke-[2.2]" />
                          </div>
                        )
                      },
                      { 
                        label: 'Careers Page', 
                        sub: 'Open roles & requirements',
                        renderIcon: () => (
                          <div className="w-8 h-8 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0 border border-[#DBE5FF]">
                            <FileText className="w-4.5 h-4.5 text-[#0052FF] stroke-[2.2]" />
                          </div>
                        )
                      }
                    ].map((src, sIdx) => {
                      const isItemActive = sIdx < leftActiveCount;
                      return (
                        <div 
                          key={sIdx} 
                          className={`px-3.5 py-2.5 rounded-2xl transition-all duration-300 flex items-center gap-3 w-[195px] bg-white border ${
                            isItemActive 
                              ? 'border-[#0A0A0A] shadow-lg scale-[1.03] ring-2 ring-[#E8FF00]' 
                              : 'border-[#ECECE8] shadow-[0_4px_16px_rgba(0,0,0,0.05)] opacity-90'
                          }`}
                        >
                          {src.renderIcon()}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="font-extrabold text-[11.5px] text-[#0A0A0A] truncate">{src.label}</h5>
                              {isItemActive && (
                                <div className="w-3.5 h-3.5 rounded-full bg-[#E8FF00] border border-[#0A0A0A] flex items-center justify-center shrink-0 animate-tick-pop">
                                  <Search className="w-2.5 h-2.5 stroke-[2.8] text-[#0A0A0A]" />
                                </div>
                              )}
                            </div>
                            <p className="text-[9.5px] text-[#777777] truncate font-normal">{src.sub}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. Left Input SVG Wires: All 5 lines go INTO the AI Research box */}
                  <div className="flex-1 relative h-[320px] mx-1 z-10 flex items-center justify-center">
                    <svg className="w-full h-full pointer-events-none" viewBox="0 0 100 320" preserveAspectRatio="none">
                      {/* Background Static Wires */}
                      <path d="M 0 32 Q 55 32 100 160" stroke="#C5F030" strokeWidth="2.5" fill="none" opacity="0.6" />
                      <path d="M 0 96 Q 55 96 100 160" stroke="#C5F030" strokeWidth="2.5" fill="none" opacity="0.6" />
                      <path d="M 0 160 L 100 160" stroke="#C5F030" strokeWidth="3" fill="none" opacity="0.6" />
                      <path d="M 0 224 Q 55 224 100 160" stroke="#C5F030" strokeWidth="2.5" fill="none" opacity="0.6" />
                      <path d="M 0 288 Q 55 288 100 160" stroke="#C5F030" strokeWidth="2.5" fill="none" opacity="0.6" />

                      {/* Animated Active Data Streams into AI Research box as sources are scraped */}
                      {leftActiveCount > 0 && <path d="M 0 32 Q 55 32 100 160" stroke="#A8E600" strokeWidth="3.5" fill="none" className="animate-wire-flow" />}
                      {leftActiveCount > 1 && <path d="M 0 96 Q 55 96 100 160" stroke="#A8E600" strokeWidth="3.5" fill="none" className="animate-wire-flow" />}
                      {leftActiveCount > 2 && <path d="M 0 160 L 100 160" stroke="#A8E600" strokeWidth="4" fill="none" className="animate-wire-flow" />}
                      {leftActiveCount > 3 && <path d="M 0 224 Q 55 224 100 160" stroke="#A8E600" strokeWidth="3.5" fill="none" className="animate-wire-flow" />}
                      {leftActiveCount > 4 && <path d="M 0 288 Q 55 288 100 160" stroke="#A8E600" strokeWidth="3.5" fill="none" className="animate-wire-flow" />}
                    </svg>
                  </div>

                  {/* 3. Center Node: AI Research Box */}
                  <div className="relative shrink-0 z-20">
                    
                    {/* Radar Pulse Aura expanding behind AI box during calculation */}
                    {isAiProcessing && (
                      <div className="absolute -inset-2 rounded-[30px] bg-[#E8FF3B]/40 animate-ping pointer-events-none"></div>
                    )}

                    {/* AI Research Node Box */}
                    <div className={`w-24 h-24 rounded-[26px] bg-[#E8FF3B] shadow-[0_8px_24px_rgba(200,240,0,0.35)] flex flex-col items-center justify-center text-center p-2.5 transition-all duration-300 ${
                      isAiProcessing ? 'scale-108 shadow-[0_0_30px_rgba(232,255,0,0.8)] ring-4 ring-[#0A0A0A]' : ''
                    }`}>
                      {/* Rotating Star Icon during Calculation Phase */}
                      <Sparkles className={`w-7 h-7 text-[#0A0A0A] fill-[#0A0A0A] mb-1 transition-transform duration-700 ${
                        isAiProcessing ? 'rotate-180 scale-125' : ''
                      }`} />
                      <span className="font-extrabold text-[12px] text-[#0A0A0A] tracking-tight leading-tight">AI Research</span>
                      <span className="text-[9.5px] font-semibold text-[#4D5D00] leading-tight mt-1">
                        Analyze & Summarize
                      </span>
                    </div>
                  </div>

                  {/* 4. Output Wire: ONE single arrow from AI Research Box to ACME Corp Card (Active during Phase 3) */}
                  <div className="w-14 relative h-[320px] z-10 flex items-center justify-center">
                    <svg className="w-full h-8 pointer-events-none" viewBox="0 0 50 24" fill="none">
                      <path 
                        d="M 0 12 L 38 12" 
                        stroke="#A8E600" 
                        strokeWidth="3.5" 
                        className={isOutputActive ? "animate-wire-flow" : ""} 
                        strokeDasharray={isOutputActive ? "6 4" : "none"} 
                        opacity={isOutputActive ? 1 : 0.3}
                      />
                      <path 
                        d="M 28 5 L 40 12 L 28 19" 
                        stroke="#A8E600" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        fill="none" 
                        opacity={isOutputActive ? 1 : 0.3}
                      />
                    </svg>
                  </div>

                  {/* 5. Right Output Browser Card with Checkmarks (Styled exactly per user reference image) */}
                  <div className="relative bg-white p-4 rounded-3xl border-2 border-[#0A0A0A] shadow-xl w-[190px] shrink-0 z-20 space-y-2.5">
                    
                    {/* Fun Lime Burst Rays at Top-Right */}
                    <div className="absolute -top-3.5 -right-2.5 text-[#E8FF00] pointer-events-none">
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#DCE000" strokeWidth="3" strokeLinecap="round">
                        <line x1="12" y1="2" x2="12" y2="6" />
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                        <line x1="19.07" y1="4.93" x2="16.24" y2="7.76" />
                      </svg>
                    </div>

                    {/* Browser Window Header Dots */}
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D5D5CD]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D5D5CD]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D5D5CD]"></div>
                    </div>

                    {/* Brand Logo Box: Styled ACME Header */}
                    <div className="bg-[#F6F6F2] py-2 px-3 rounded-2xl border border-[#E8E8E0] flex items-center justify-center gap-2">
                      {/* Stylized Blue Triangle Mark */}
                      <svg className="w-5 h-5 text-[#0052FF]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" />
                      </svg>
                      <span className="font-black text-sm text-[#0A0A0A] tracking-wider">ACME</span>
                    </div>

                    {/* Skeleton Text Bars */}
                    <div className="space-y-1.5 py-0.5">
                      <div className="h-2 bg-[#F0F0EB] rounded-full w-full"></div>
                      <div className="h-2 bg-[#F0F0EB] rounded-full w-4/5"></div>
                    </div>

                    {/* Checklist Items with Square Lime Checkmarks */}
                    <div className="space-y-2 pt-0.5">
                      {[
                        'Company overview',
                        'Culture & values',
                        'Tech stack',
                        'Recent news',
                        'Interview insights'
                      ].map((itemLabel, iIdx) => {
                        const isChecked = iIdx < rightActiveCount;
                        return (
                          <div key={iIdx} className="flex items-center gap-2 text-[10.5px]">
                            {isChecked ? (
                              <div className="w-4 h-4 rounded-md bg-[#E8FF00] border border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] shrink-0 animate-tick-pop shadow-2xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-md border border-[#D5D5D0] shrink-0 bg-[#FAFAFA]"></div>
                            )}
                            <span className={`truncate ${isChecked ? 'font-extrabold text-[#0A0A0A]' : 'text-[#888888]'}`}>
                              {itemLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : activeStepIndex === 4 ? (
                /* STEP 5 CUSTOM GRAPHIC: Build Adaptive Study Plan */
                <div className="w-full relative flex items-center justify-between min-h-[320px] animate-in fade-in zoom-in-95 duration-400 py-1 px-2 z-20">
                  
                  {/* Left Column: Main 9-Day Study Plan Window Card */}
                  <div className="bg-white rounded-3xl border-2 border-[#0A0A0A] shadow-xl p-4.5 w-[330px] shrink-0 z-20 space-y-3">
                    
                    {/* Header Row */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EB]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-[#EEF4FF] text-[#0052FF] flex items-center justify-center border border-[#DBE5FF]">
                          <Calendar className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <h4 className="font-extrabold text-sm text-[#0A0A0A] tracking-tight">Your 9-Day Study Plan</h4>
                      </div>
                      <span className="bg-[#F2F4F8] text-[#556677] px-2.5 py-1 rounded-xl text-[10.5px] font-bold">
                        9 days
                      </span>
                    </div>

                    {/* Main Inner Body: Left Vertical Timeline + Right Task Card */}
                    <div className="flex gap-3 pt-1">
                      
                      {/* Left Days Vertical Timeline Track */}
                      <div className="flex flex-col space-y-1.5 shrink-0 py-0.5 border-r border-[#F0F0EB] pr-2">
                        {[
                          { day: 'Day 1', active: true },
                          { day: 'Day 2', active: false },
                          { day: 'Day 3', active: false },
                          { day: 'Day 4', active: false },
                          { day: 'Day 5', active: false },
                          { day: 'Day 6', active: false },
                          { day: 'Day 7', active: false },
                          { day: 'Day 8', active: false },
                          { day: 'Day 9', active: false },
                        ].map((dItem, dIdx) => (
                          <div key={dIdx} className="flex items-center gap-1.5 text-[10px]">
                            <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center shrink-0 ${
                              dItem.active 
                                ? 'bg-[#0A0A0A] ring-2 ring-[#E8FF00]' 
                                : 'bg-[#E5E5DF]'
                            }`}>
                              {dItem.active && <div className="w-1 h-1 rounded-full bg-[#E8FF00]"></div>}
                            </div>
                            <span className={`font-bold ${dItem.active ? 'text-[#0A0A0A]' : 'text-[#A0A098]'}`}>
                              {dItem.day}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Right Task Details Window Card */}
                      <div className="flex-1 bg-[#FBFBF9] rounded-2xl border border-[#EAEAE4] p-3 space-y-2.5">
                        
                        {/* Day Title & Time */}
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#0A0A0A]">
                          <span>Day 1 – Core Fundamentals</span>
                          <span className="text-[10px] text-[#777777] font-semibold">~ 45 min</span>
                        </div>

                        {/* Checklist Items (Ticking sequentially with checkedCount) */}
                        <div className="space-y-1.5 pt-0.5">
                          {[
                            'Read company overview',
                            'Review key requirements',
                            'Practice 3 technical questions',
                            'Go through 5 flashcards',
                            'Note your weak areas'
                          ].map((tLabel, tIdx) => {
                            const isDone = tIdx < Math.min(5, checkedCount);
                            return (
                              <div key={tIdx} className="flex items-center gap-2 text-[10.5px]">
                                {isDone ? (
                                  <div className="w-4 h-4 rounded-md bg-[#E8FF00] border border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] shrink-0 animate-tick-pop shadow-2xs">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-md border border-[#D5D5D0] shrink-0 bg-white"></div>
                                )}
                                <span className={`truncate ${isDone ? 'font-extrabold text-[#0A0A0A]' : 'text-[#777777]'}`}>
                                  {tLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Start Day Button */}
                        <div className="pt-1">
                          <button className="w-full py-2 bg-[#0A0A0A] text-white rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md">
                            <span>Start Day 1</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* Right Side 3 Feature Badges */}
                  <div className="space-y-3 shrink-0 z-20 max-w-[200px]">
                    
                    {/* Badge 1: Personalized to your goals */}
                    <div className="px-3.5 py-3 rounded-2xl bg-[#EEF7E8] border border-[#C2E8AA] flex items-center gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-white text-[#3B8216] flex items-center justify-center shrink-0 border border-[#D0EEBF]">
                        <Target className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-[11px] text-[#2C6311] leading-tight">Personalized</h5>
                        <p className="text-[9.5px] text-[#4A802F] font-medium leading-tight">to your goals</p>
                      </div>
                    </div>

                    {/* Badge 2: Balanced mix of practice */}
                    <div className="px-3.5 py-3 rounded-2xl bg-[#F3E8FF] border border-[#DFB8FF] flex items-center gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-white text-[#8B5CF6] flex items-center justify-center shrink-0 border border-[#E9D5FF]">
                        <BarChart3 className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-[11px] text-[#6D28D9] leading-tight">Balanced mix</h5>
                        <p className="text-[9.5px] text-[#8B5CF6] font-medium leading-tight">of practice</p>
                      </div>
                    </div>

                    {/* Badge 3: Focus on weak spots */}
                    <div className="px-3.5 py-3 rounded-2xl bg-[#FFEAEA] border border-[#FFC7C7] flex items-center gap-3 shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-white text-[#E11D48] flex items-center justify-center shrink-0 border border-[#FFE4E6]">
                        <Brain className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-[11px] text-[#BE123C] leading-tight">Focus on</h5>
                        <p className="text-[9.5px] text-[#E11D48] font-medium leading-tight">weak spots</p>
                      </div>
                    </div>

                  </div>

                  {/* Sleek Glowing Pulsing Beacon Ring on Final Step Completion */}
                  {checkedCount >= 4 && (
                    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                      <div className="w-full h-full rounded-3xl border-2 border-[#E8FF00] animate-ping opacity-30"></div>
                    </div>
                  )}

                </div>
              ) : (
                /* DEFAULT CARDS (Step 1, 3, 4, 5) */
                <>
                  {/* Card 1: Main Job Description Input Card */}
                  <div className="absolute top-4 left-4 z-10 w-full max-w-[300px] bg-white p-5 rounded-2xl border border-[#E5E5DF] shadow-md animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-[#F4F4F0] border border-[#E5E5DF] flex items-center justify-center text-[#0A0A0A]">
                        <currentStep.primaryCard.icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="font-extrabold text-sm text-[#0A0A0A]">{currentStep.primaryCard.title}</span>
                    </div>
                    <div className="h-2 bg-[#F0F0EB] rounded-full w-full mb-2"></div>
                    <div className="h-2 bg-[#F0F0EB] rounded-full w-3/4 mb-3.5"></div>

                    {/* Yellow/Lime Skill Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentStep.primaryCard.pills.map((pill, pIdx) => (
                        <span key={pIdx} className="bg-[#E8FF00] text-[#0A0A0A] px-2.5 py-1 rounded-lg text-[10.5px] font-bold border border-[#D0E600] shadow-2xs">
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Green Curved Connecting Arrow from Card 1 to Top-Center of Card 2 */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" viewBox="0 0 600 360" fill="none">
                    <defs>
                      <marker
                        id="lime-arrow-tip"
                        viewBox="0 0 10 10"
                        refX="7"
                        refY="5"
                        markerWidth="7"
                        markerHeight="7"
                        orient="auto"
                      >
                        <path d="M 0 1.5 L 9 5 L 0 8.5 Z" fill="#A8E600" />
                      </marker>
                    </defs>
                    <path 
                      d="M 316 85 Q 475 75 460 170" 
                      stroke="#A8E600" 
                      strokeWidth="3.5" 
                      fill="none" 
                      strokeDasharray="6 4" 
                      strokeLinecap="round"
                      markerEnd="url(#lime-arrow-tip)"
                    />
                  </svg>

                  {/* Card 2: Overlapping Right Detail Checklist Card */}
                  <div className="absolute bottom-3 right-4 z-30 w-full max-w-[240px] bg-white p-4.5 rounded-2xl border border-[#E5E5DF] shadow-[0_12px_35px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-[#0A0A0A] fill-[#E8FF00]" />
                      <span className="font-extrabold text-xs text-[#0A0A0A] truncate">{currentStep.secondaryCard.title}</span>
                    </div>
                    <div className="space-y-2.5">
                      {currentStep.secondaryCard.checklist.map((chk, cIdx) => {
                        const isChecked = cIdx < checkedCount;
                        return (
                          <div key={cIdx} className="flex items-center gap-2 text-[11px] transition-all">
                            {isChecked ? (
                              <div className="w-4 h-4 rounded-full bg-[#E8FF00] border border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] shrink-0 animate-tick-pop shadow-2xs">
                                <Check className="w-2.8 h-2.8 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-[#D5D5D0] shrink-0 bg-[#FAFAFA]"></div>
                            )}
                            <span className={`truncate transition-colors ${isChecked ? 'font-bold text-[#0A0A0A]' : 'text-[#888888]'}`}>
                              {chk.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 sm:px-8 py-4 bg-[#FFFFFF] border-t border-[#F0F0EB] flex items-center justify-between">
          
          {/* Left: Play/Pause, Reset Step, Speed & Dot Indicators */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-[130px] shrink-0 py-2 px-3 rounded-full bg-[#FFFFFF] hover:bg-[#F4F4F0] border border-[#CCCCCC] text-[#0A0A0A] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-1.5 min-w-[58px]">
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current shrink-0 text-[#0A0A0A]" />
                    <span className="text-[#0A0A0A] font-bold">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current shrink-0 text-[#0A0A0A]" />
                    <span className="text-[#0A0A0A] font-bold">Play</span>
                  </>
                )}
              </div>
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[9.5px] font-mono font-bold bg-[#F4F4F0] text-[#555555] border border-[#DCDCDC] rounded-md shrink-0">
                Space
              </kbd>
            </button>

            <button
              onClick={handleResetCurrentStep}
              className="px-3 py-2 rounded-xl bg-[#F4F4F0] hover:bg-[#EAEAE4] border border-[#CCCCCC] text-[#0A0A0A] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Reset current step animation (Key: R)"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Reset Step</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9.5px] font-mono font-bold bg-white text-[#666666] border border-[#E2E2DC] rounded-md ml-0.5">
                R
              </kbd>
            </button>

            {/* Speed Multiplier Pill Buttons (0.5x, 1x, 1.5x, 2x) */}
            <div className="flex items-center gap-1 bg-[#F4F4F0] p-1 rounded-xl border border-[#E2E2DC]">
              {[0.5, 1, 1.5, 2].map((sVal) => (
                <button
                  key={sVal}
                  onClick={() => setSpeed(sVal)}
                  className={`px-2 py-1 rounded-lg text-[10.5px] font-black transition-all cursor-pointer ${
                    speed === sVal
                      ? 'bg-[#0A0A0A] text-[#E8FF00] shadow-xs'
                      : 'text-[#666666] hover:text-[#0A0A0A]'
                  }`}
                >
                  {sVal}x
                </button>
              ))}
            </div>

            {/* Dot Indicators */}
            <div className="flex items-center gap-2 pl-1">
              {STEP_DATA.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === activeStepIndex ? 'bg-[#E8FF00] w-6' : 'bg-[#E0E0DA] hover:bg-[#CCCCCC]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right: Previous / Next Buttons */}
          <div className="flex items-center gap-3">
            {activeStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#0A0A0A] border border-[#CCCCCC] text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            {activeStepIndex < STEP_DATA.length - 1 ? (
              <button
                onClick={handleNext}
                className="bg-[#0A0A0A] hover:bg-[#222222] text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <a
                href="/kits/new"
                className={`py-2.5 px-5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  checkedCount >= 4
                    ? 'bg-[#E8FF00] text-[#0A0A0A] border-2 border-[#0A0A0A] scale-108 shadow-[0_0_25px_rgba(232,255,0,0.85)] ring-4 ring-[#E8FF00]/40'
                    : 'bg-[#0A0A0A] hover:bg-[#222222] text-white shadow-md hover:scale-105'
                }`}
              >
                <span>Create your prep kit</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.8]" />
              </a>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}



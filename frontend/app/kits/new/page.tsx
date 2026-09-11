'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import {
  ArrowRight,
  AlertCircle,
  Clock,
  Check,
  Globe,
  Building2,
  Cpu,
  FileText,
  Users
} from 'lucide-react';

interface GenerationStepItem {
  id: string;
  title: string;
  description: string;
  threshold: number;
}

const FIVE_GENERATION_STEPS: GenerationStepItem[] = [
  {
    id: 'parsing',
    title: 'Parsing job description',
    description: 'Understanding the role, skills, and requirements',
    threshold: 20
  },
  {
    id: 'researching',
    title: 'Researching company',
    description: 'Gathering insights from the official website and public sources',
    threshold: 45
  },
  {
    id: 'mapping',
    title: 'Mapping key requirements',
    description: 'Identifying must-have skills and topics',
    threshold: 65
  },
  {
    id: 'questions',
    title: 'Generating question bank',
    description: 'Creating targeted practice questions with detailed solutions',
    threshold: 85
  },
  {
    id: 'schedule',
    title: 'Building study plan',
    description: 'Personalizing your day-by-day preparation roadmap',
    threshold: 100
  }
];

export default function CreateKitPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const [jobDescription, setJobDescription] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [daysAvailable, setDaysAvailable] = useState<number>(5);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeKitId, setActiveKitId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('queued');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!jobDescription.trim() || jobDescription.trim().length < 10) {
      setError('Please enter a detailed job description (minimum 10 characters).');
      return;
    }

    if (!companyUrl.trim()) {
      setError('Please enter the company website URL.');
      return;
    }

    try {
      new URL(companyUrl);
    } catch {
      setError('Please enter a valid company website URL (e.g., https://acme.com).');
      return;
    }

    if (!daysAvailable || daysAvailable < 1 || daysAvailable > 60) {
      setError('Days available must be between 1 and 60 days.');
      return;
    }

    try {
      setIsSubmitting(true);
      setProgressPercent(15);

      const res = await api.createKit({
        jobDescription,
        companyUrl,
        daysAvailable
      });

      setActiveKitId(res.id);
      startPollingStatus(res.id);
    } catch (err: any) {
      setError(err.message || 'Failed to start kit generation pipeline.');
      setIsSubmitting(false);
    }
  };

  // Poll status endpoint until completion or error
  const startPollingStatus = (kitId: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        const kit = await api.getKitById(kitId);
        setCurrentStep(kit.status);
        const newProgress = Math.max(15, kit.progressPercent || 0);
        setProgressPercent(newProgress);

        if (kit.status === 'completed') {
          setProgressPercent(100);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setTimeout(() => {
            router.push(`/kits/${kitId}`);
          }, 800);
        } else if (kit.status === 'failed') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setError(kit.error?.message || 'Generation pipeline failed. Please retry.');
          setIsSubmitting(false);
        }
      } catch (pollErr: any) {
        console.warn('Polling error:', pollErr);
      }
    }, 1500);
  };

  const handleCancelGeneration = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setIsSubmitting(false);
    setProgressPercent(0);
    setActiveKitId(null);
  };

  // Helper to get step status ('Completed' | 'In progress' | 'Pending')
  const getStepStatus = (index: number) => {
    const step = FIVE_GENERATION_STEPS[index];
    const prevThreshold = index > 0 ? FIVE_GENERATION_STEPS[index - 1].threshold : 0;

    if (progressPercent >= step.threshold) {
      return 'Completed';
    }
    if (progressPercent > prevThreshold && progressPercent < step.threshold) {
      return 'In progress';
    }
    return 'Pending';
  };

  // =========================================================================
  // IF GENERATING KIT (isSubmitting === true): Exact Reference Design View
  // =========================================================================
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-[#F9F9F6] text-[#0A0A0A] font-sans selection:bg-[#CCFF00] selection:text-black select-none relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        
        {/* Fine Technical Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.035) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.035) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        ></div>

        <div className="max-w-[1360px] w-full mx-auto relative z-10">
          
          {/* TOP HEADER BADGE */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-[#888888] tracking-[0.2em] uppercase">
              <span className="w-[3px] h-3.5 bg-[#CCFF00] inline-block"></span>
              <span>BUILDING YOUR ADVANTAGE</span>
            </div>
          </div>

          {/* MAIN HEADING & SUBTITLE */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0A0A0A] tracking-tight leading-tight">
              Generating your prep kit...
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed max-w-xl mx-auto">
              Our AI is researching the company, analyzing requirements, and creating a personalized study plan. This usually takes 1–2 minutes.
            </p>
          </div>

          {/* CENTER GRID CONTAINER (Left Decor + 5 Steps List + Right Decor) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            
            {/* LEFT FLOATING DECOR CARD (Visible on LG) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col justify-between items-start h-full min-h-[360px] relative">
              
              {/* Stacked Floating Brand Cards */}
              <div className="relative w-48 h-48 mt-4">
                {/* Yellow Glow Accent Box */}
                <div className="absolute top-10 left-2 w-24 h-24 bg-[#CCFF00] rounded-2xl opacity-90 blur-xs"></div>

                {/* Notion Card */}
                <div className="absolute top-0 left-6 bg-white p-3.5 rounded-2xl shadow-lg border border-[#E5E7EB] z-20 hover:scale-105 transition-transform">
                  <div className="w-9 h-9 rounded-xl bg-black text-white font-extrabold flex items-center justify-center text-lg font-serif">
                    N
                  </div>
                </div>

                {/* Figma Card */}
                <div className="absolute top-8 left-24 bg-white p-3.5 rounded-2xl shadow-lg border border-[#E5E7EB] z-20 hover:scale-105 transition-transform">
                  <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] flex items-center justify-center p-1.5">
                    <svg className="w-6 h-6" viewBox="0 0 38 57" fill="none">
                      <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38H19V28.5Z" fill="#FF7262"/>
                      <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
                      <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#1ABCFE"/>
                      <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
                      <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
                    </svg>
                  </div>
                </div>

                {/* Google Card */}
                <div className="absolute top-24 left-14 bg-white p-3.5 rounded-2xl shadow-xl border border-[#E5E7EB] z-30 hover:scale-105 transition-transform">
                  <div className="w-9 h-9 rounded-xl bg-white border border-black/5 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Vertical Label & Accent Line */}
              <div className="space-y-1.5 pt-6">
                <div className="font-mono text-[10px] font-bold text-[#8A92A6] uppercase tracking-[0.18em] leading-tight">
                  REAL<br />
                  COMPANIES<br />
                  REAL<br />
                  QUESTIONS
                </div>
                <div className="w-5 h-[2px] bg-[#CCFF00]"></div>
              </div>

            </div>

            {/* CENTER 5-STEP VERTICAL TIMELINE LIST */}
            <div className="lg:col-span-6 space-y-6 relative py-2">
              
              {/* Vertical Timeline Connection Line */}
              <div className="absolute left-[19px] top-6 bottom-8 w-[2px] bg-[#E5E7EB] z-0"></div>

              {FIVE_GENERATION_STEPS.map((step, idx) => {
                const status = getStepStatus(idx);
                const isCompleted = status === 'Completed';
                const isInProgress = status === 'In progress';

                return (
                  <div key={step.id} className="relative z-10 flex items-center justify-between gap-4">
                    
                    {/* Left Icon Node & Text */}
                    <div className="flex items-center gap-4 min-w-0">
                      
                      {/* Step Circle Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-[#E8FF00] text-black shadow-xs'
                          : isInProgress
                          ? 'bg-white border-2 border-[#CCFF00] text-[#0A0A0A] shadow-[0_0_12px_rgba(204,255,0,0.6)]'
                          : 'bg-white border-2 border-[#D1D5DB] text-transparent'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-5 h-5 text-black stroke-[3]" />
                        ) : isInProgress ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-[#CCFF00] animate-pulse"></div>
                        ) : null}
                      </div>

                      {/* Title & Description */}
                      <div className="min-w-0">
                        <h4 className={`text-sm font-bold leading-tight ${
                          isInProgress || isCompleted ? 'text-[#0A0A0A]' : 'text-[#6B7280]'
                        }`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-[#8A92A6] truncate mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Right Status Badge */}
                    <div className="shrink-0 text-right font-mono text-xs">
                      {isCompleted && (
                        <span className="text-[#8A92A6]">Completed</span>
                      )}
                      {isInProgress && (
                        <span className="text-[#99D600] font-bold">In progress</span>
                      )}
                      {status === 'Pending' && (
                        <span className="text-[#9CA3AF]">Pending</span>
                      )}
                    </div>

                  </div>
                );
              })}

            </div>

            {/* RIGHT FLOATING DECOR CARD (Visible on LG) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col justify-between items-end h-full min-h-[360px] relative">
              
              {/* Floating Company Preview Card */}
              <div className="relative w-full max-w-[210px] bg-white rounded-2xl p-4 shadow-xl border border-[#E5E7EB] mt-2 space-y-3">
                
                {/* Floating Globe Badge */}
                <div className="absolute -top-4 -right-3 w-11 h-11 rounded-2xl bg-white shadow-lg border border-[#E5E7EB] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#0A0A0A]" />
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-[11px] font-bold text-[#0A0A0A]">
                    Analyzing company...
                  </div>
                  <div className="w-16 h-1.5 bg-[#E5E7EB] rounded-full"></div>
                </div>

                {/* Sub-items list */}
                <div className="space-y-2.5 pt-1 text-[11px] font-sans text-[#555555]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#888888]" />
                      <span>Company info</span>
                    </div>
                    <div className="w-8 h-1 bg-[#E5E7EB] rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#888888]" />
                      <span>Tech stack</span>
                    </div>
                    <div className="w-10 h-1 bg-[#E5E7EB] rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#888888]" />
                      <span>Recent news</span>
                    </div>
                    <div className="w-7 h-1 bg-[#E5E7EB] rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#888888]" />
                      <span>Culture & values</span>
                    </div>
                    <div className="w-9 h-1 bg-[#E5E7EB] rounded-full"></div>
                  </div>
                </div>

              </div>

              {/* Vertical Label & Accent Line */}
              <div className="space-y-1.5 pt-6 text-right">
                <div className="font-mono text-[10px] font-bold text-[#8A92A6] uppercase tracking-[0.18em] leading-tight">
                  FROM<br />
                  JOB DESCRIPTION<br />
                  TO CONFIDENCE
                </div>
                <div className="flex justify-end">
                  <div className="w-5 h-[2px] bg-[#CCFF00]"></div>
                </div>
              </div>

            </div>

          </div>

          {/* BOTTOM NOTIFICATION BOX & CANCEL BUTTON */}
          <div className="mt-10 space-y-5 text-center">
            
            {/* Gray Callout Pill */}
            <div className="inline-flex items-center gap-3 bg-[#F0F1EC] border border-[#E5E5DF] rounded-2xl px-5 py-3 text-xs text-[#555555] max-w-xl mx-auto shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 border border-black/5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#0A0A0A]" />
              </div>
              <span className="text-left leading-relaxed">
                This usually takes 1–2 minutes. You can safely leave this page — we'll notify you when it's ready.
              </span>
            </div>

            {/* Cancel Button */}
            <div>
              <button
                onClick={handleCancelGeneration}
                className="bg-white hover:bg-[#F9FAFB] text-[#0A0A0A] border border-[#D0D0CA] text-xs font-semibold py-2.5 px-6 rounded-xl transition-all shadow-2xs"
              >
                Cancel Generation
              </button>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // =========================================================================
  // STANDARD INPUT FORM VIEW (When not submitting yet)
  // =========================================================================
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      
      {/* Top Workspace Header */}
      <div className="border-b border-[#E5E5E0] pb-6 mb-8">
        <div className="flex items-center gap-3 font-mono text-xs text-[#666666] tracking-widest uppercase mb-2">
          <span>INPUT TERMINAL</span>
          <span className="text-[#E5E5E0]">|</span>
          <span>AUTONOMOUS PIPELINE INVOCATION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-normal text-[#0A0A0A] tracking-tight uppercase">
          CREATE INTERVIEW PREP KIT
        </h1>
      </div>

      {error && !isSubmitting && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 font-mono text-xs flex items-center justify-between rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>[ERROR] {error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Input Form (8 columns) */}
        <div className="lg:col-span-8 tech-panel p-6 sm:p-8 border-[#0A0A0A] bg-white rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Step 01 / Job Description */}
            <div className="space-y-2">
              <label className="font-mono text-xs text-[#0A0A0A] uppercase tracking-wider block font-bold flex items-center justify-between">
                <span>01 / JOB CONTEXT *</span>
                <span className="text-[#8A8A8A] font-normal">PASTE FULL JOB DESCRIPTION</span>
              </label>
              <textarea
                required
                rows={9}
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste job description text here... (e.g. Senior Backend Engineer with 5+ years of Node.js, microservices, MongoDB, distributed caching...)"
                className="w-full p-4 border border-[#E5E5E0] focus:border-[#0A0A0A] focus:outline-none font-mono text-xs text-[#0A0A0A] bg-[#F7F7F3] leading-relaxed resize-y rounded-lg"
              />
            </div>

            {/* Step 02 & 03 / Company URL & Days */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-mono text-xs text-[#0A0A0A] uppercase tracking-wider block font-bold">
                  02 / COMPANY WEBSITE URL *
                </label>
                <input
                  type="url"
                  required
                  value={companyUrl}
                  onChange={e => setCompanyUrl(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full px-4 py-3 border border-[#E5E5E0] focus:border-[#0A0A0A] focus:outline-none font-mono text-xs text-[#0A0A0A] bg-[#F7F7F3] rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-[#0A0A0A] uppercase tracking-wider block font-bold">
                  03 / DAYS UNTIL INTERVIEW *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={60}
                  value={daysAvailable}
                  onChange={e => setDaysAvailable(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-4 py-3 border border-[#E5E5E0] focus:border-[#0A0A0A] focus:outline-none font-mono text-xs text-[#0A0A0A] bg-[#F7F7F3] rounded-lg"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-[#E5E5E0] flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0A0A0A] hover:bg-[#222222] text-white text-xs font-semibold py-3.5 px-8 rounded-lg transition-all flex items-center justify-center gap-3 w-full sm:w-auto font-mono uppercase shadow-sm"
              >
                <span>GENERATE PREP KIT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right System Feature Preview Panel (4 columns) */}
        <div className="lg:col-span-4 border border-[#E5E5E0] rounded-xl p-6 bg-[#F7F7F3] font-mono text-xs space-y-4">
          <div className="text-[10px] text-[#8A8A8A] uppercase tracking-widest pb-3 border-b border-[#E5E5E0]">
            GENERATED ARTIFACTS INCLUDED
          </div>

          <div className="space-y-3 font-sans">
            {[
              { label: 'COMPANY RESEARCH', desc: 'Autonomous website crawl & hiring signals' },
              { label: 'REQUIREMENT ANALYSIS', desc: 'Extracted must-have requirement matrix' },
              { label: 'TARGETED QUESTIONS', desc: 'Technical, System Design, Behavioural' },
              { label: 'PRACTICE FLASHCARDS', desc: 'Interactive review cards with confidence scale' },
              { label: 'STUDY PLAN', desc: 'Day-by-day arithmetic allocation' },
              { label: 'WEAK SPOT ANALYSIS', desc: 'Real-time readiness risk matrix' }
            ].map(item => (
              <div key={item.label} className="p-3 bg-white border border-[#E5E5E0] rounded-lg">
                <div className="font-bold text-[#0A0A0A] text-xs">{item.label}</div>
                <div className="text-[10px] text-[#666666] mt-0.5 font-mono">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

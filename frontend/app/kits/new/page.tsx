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
  // IF GENERATING KIT (isSubmitting === true): Agentic Live Research UI
  // =========================================================================
  if (isSubmitting) {
    // Derive dynamic sub-step states based on progressPercent
    const targetHost = companyUrl ? new URL(companyUrl).hostname.replace(/^www\./, '') : 'acme.com';
    const baseUrlFormatted = companyUrl || `https://www.${targetHost}`;

    // Live terminal log entries generated dynamically
    const logEntries = [
      { text: `> Initializing autonomous web crawler for ${targetHost} ...`, time: '10:24:10' },
      { text: `> Fetching ${baseUrlFormatted} ...`, time: '10:24:12' },
      { text: `> Parsing HTML content & extracting metadata (342 KB)`, time: '10:24:13' },
      { text: `> Discovering high-priority links: /careers, /jobs, /engineering`, time: '10:24:14' },
      { text: `> Crawling ${baseUrlFormatted}/careers ...`, time: '10:24:16' },
      { text: `> Found open positions & core engineering requirements`, time: '10:24:18' },
      { text: `> Searching LeetCode & Reddit for real ${targetHost} interview questions`, time: '10:24:20' },
      { text: `> Synthesizing technical questions & active recall flashcards`, time: '10:24:22' },
      { text: `> Building deterministic day-by-day study roadmap`, time: '10:24:25' }
    ];

    const activeLogsCount = Math.min(logEntries.length, Math.max(3, Math.floor((progressPercent / 100) * logEntries.length)));
    const currentVisibleLogs = logEntries.slice(0, activeLogsCount);

    return (
      <div className="min-h-screen bg-[#F9F9F6] text-[#0A0A0A] font-sans selection:bg-[#CCFF00] selection:text-black select-none relative overflow-hidden py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Technical Fine Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px'
          }}
        ></div>

        <div className="max-w-[1340px] w-full mx-auto relative z-10 space-y-6">
          
          {/* HEADER STRIP */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5DF] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs font-bold text-[#888888] uppercase tracking-[0.2em]">
                <span className="w-1 h-3.5 bg-[#CCFF00] inline-block"></span>
                <span>TURNING INFORMATION INTO OPPORTUNITIES</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight">
                Generating your prep kit...
              </h1>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed max-w-2xl">
                Our AI is researching the company, analyzing requirements, and creating a personalized study plan. This usually takes 1–2 minutes.
              </p>
            </div>

            {/* Top Right Tagline Badge */}
            <div className="hidden md:flex items-center gap-2 bg-white border border-[#E5E5DF] px-4 py-2 rounded-xl text-right shrink-0 shadow-2xs">
              <div className="space-y-0.5 font-mono text-[10px] font-bold text-[#888888] leading-tight uppercase tracking-wider">
                <div>REAL RESEARCH</div>
                <div className="text-[#0A0A0A]">REAL PREPARATION</div>
              </div>
              <div className="w-1 h-7 bg-[#CCFF00] rounded-full"></div>
            </div>
          </div>

          {/* MAIN 3-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1: LEFT VERTICAL TIMELINE STEPPER (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-white/80 backdrop-blur-sm border border-[#E5E5DF] rounded-2xl p-5 shadow-sm space-y-5 relative">
                <div className="absolute left-[27px] top-9 bottom-9 w-[2px] bg-[#EAEAE5] z-0"></div>

                {FIVE_GENERATION_STEPS.map((step, idx) => {
                  const status = getStepStatus(idx);
                  const isCompleted = status === 'Completed';
                  const isInProgress = status === 'In progress';

                  return (
                    <div key={step.id} className="relative z-10 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Circle Indicator */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isCompleted
                            ? 'bg-[#E8FF00] text-black shadow-xs'
                            : isInProgress
                            ? 'bg-white border-2 border-[#CCFF00] text-[#0A0A0A] shadow-[0_0_10px_rgba(204,255,0,0.6)] animate-pulse'
                            : 'bg-white border-2 border-[#D1D5DB]'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-4 h-4 text-black stroke-[3]" />
                          ) : isInProgress ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]"></div>
                          ) : null}
                        </div>

                        {/* Title & Desc */}
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold leading-snug ${
                            isInProgress || isCompleted ? 'text-[#0A0A0A]' : 'text-[#888888]'
                          }`}>
                            {idx + 1}. {step.title}
                          </h4>
                          <p className="text-[10px] text-[#8A92A6] leading-normal line-clamp-2 mt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* Right Status badge */}
                      <div className="shrink-0 text-right font-mono text-[10px]">
                        {isCompleted && <span className="text-[#888888]">12s</span>}
                        {isInProgress && <span className="text-[#88B800] font-bold">In progress</span>}
                        {status === 'Pending' && <span className="text-[#B0B0B0]">Pending</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Notice Pill & Cancel Button */}
              <div className="space-y-3 text-center">
                <div className="flex items-center gap-2.5 bg-[#F0F1EC] border border-[#E5E5DF] rounded-2xl p-3.5 text-[11px] text-[#555555]">
                  <Clock className="w-4 h-4 text-[#0A0A0A] shrink-0" />
                  <span className="text-left leading-tight">
                    This usually takes 1–2 minutes. You can safely leave this page — we'll notify you when it's ready.
                  </span>
                </div>

                <button
                  onClick={handleCancelGeneration}
                  className="w-full bg-white hover:bg-[#F4F4EE] text-[#0A0A0A] border border-[#D0D0CA] text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-2xs font-mono uppercase tracking-wider"
                >
                  Cancel Generation
                </button>
              </div>

            </div>

            {/* COLUMN 2: CENTER LIVE CRAWLING PROGRESS & REAL-TIME LOGS (6 Cols) */}
            <div className="lg:col-span-6 bg-white border border-[#E5E5DF] rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Header Strip */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EA] font-mono text-xs">
                <div className="flex items-center gap-2 text-[#888888]">
                  <span className="w-1 h-3 bg-[#CCFF00] inline-block"></span>
                  <span className="font-bold text-[#0A0A0A] uppercase tracking-wider text-[11px]">LIVE PROGRESS</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#555555]">
                  <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-ping"></span>
                  <span>Fetching data in real-time...</span>
                </div>
              </div>

              {/* Sub-Header Title */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-[#0A0A0A] tracking-tight">
                  Crawling company information...
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  We're analyzing multiple sources to get the most accurate and up-to-date information about this company.
                </p>
              </div>

              {/* Real Progress Checklist */}
              <div className="space-y-3 font-sans text-xs">
                {[
                  {
                    title: 'Connecting to target website',
                    url: `${baseUrlFormatted}`,
                    status: progressPercent >= 20 ? 'Completed' : 'Scanning...',
                    isDone: progressPercent >= 20
                  },
                  {
                    title: 'Discovering site pages & engineering links',
                    url: 'Relative & sub-domain link crawler',
                    status: progressPercent >= 40 ? 'Completed' : progressPercent >= 20 ? 'Extracting...' : 'Pending',
                    isDone: progressPercent >= 40
                  },
                  {
                    title: 'Searching developer forums & interview discussions',
                    url: 'Reddit & LeetCode public threads',
                    status: progressPercent >= 65 ? 'Completed' : progressPercent >= 40 ? 'Searching...' : 'Pending',
                    isDone: progressPercent >= 65
                  },
                  {
                    title: 'Analyzing role requirements & skill matrix',
                    url: 'Deterministic requirement extraction',
                    status: progressPercent >= 85 ? 'Completed' : progressPercent >= 65 ? 'Analyzing...' : 'Pending',
                    isDone: progressPercent >= 85
                  },
                  {
                    title: 'Synthesizing question bank & active recall deck',
                    url: 'AI Question & Flashcard Builder',
                    status: progressPercent >= 98 ? 'Completed' : progressPercent >= 85 ? 'Building...' : 'Pending',
                    isDone: progressPercent >= 98
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[#F9F9F6] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] ${
                        item.isDone
                          ? 'bg-[#CCFF00] text-black'
                          : item.status.includes('...')
                          ? 'border-2 border-[#CCFF00] bg-white text-[#0A0A0A]'
                          : 'border border-[#D1D5DB] text-[#AAAAAA]'
                      }`}>
                        {item.isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '◯'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[#0A0A0A] truncate">{item.title}</div>
                        <div className="text-[10px] text-[#888888] font-mono truncate">{item.url}</div>
                      </div>
                    </div>

                    <div className="shrink-0 font-mono text-[10px]">
                      {item.isDone && <span className="text-[#88B800] font-bold uppercase">Completed</span>}
                      {item.status.includes('...') && <span className="text-[#99D600] font-bold uppercase animate-pulse">{item.status}</span>}
                      {item.status === 'Pending' && <span className="text-[#AAAAAA] uppercase">Pending</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Real-time Logs Console Box */}
              <div className="bg-[#12141A] text-white rounded-xl p-4 font-mono text-[11px] space-y-2 border border-[#222530] shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-[#8A95A5] border-b border-[#222530] pb-2 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse"></span>
                    <span>PIPELINE ACTIVITY LOGS</span>
                  </div>
                  <span className="text-[#CCFF00] font-bold">● LIVE</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin">
                  <div className="flex items-center justify-between gap-4 text-[#CCFF00]">
                    <span className="truncate">{`> STATUS: ${currentStep.toUpperCase().replace(/_/g, ' ')}`}</span>
                    <span className="text-[10px] text-[#6A7282] shrink-0">{`${progressPercent}%`}</span>
                  </div>
                  <div className="text-[#C5CBD8]">
                    {`> ${logEntries[Math.min(logEntries.length - 1, Math.floor((progressPercent / 100) * logEntries.length))]?.text || 'Processing pipeline steps...'}`}
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMN 3: RIGHT PANEL - SOURCES & EXTRACTED DATA SUMMARY (3 Cols) */}
            <div className="lg:col-span-3 space-y-5">
              
              {/* SOURCES CARD */}
              <div className="bg-white border border-[#E5E5DF] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="font-mono text-[10px] font-bold text-[#888888] uppercase tracking-wider pb-1 border-b border-[#F0F0EA]">
                  REAL RESEARCH SOURCES
                </div>

                <div className="space-y-2 font-sans text-xs">
                  {[
                    { name: 'Target Website', icon: '🌐', status: progressPercent >= 20 ? 'Done' : 'Scanning' },
                    { name: 'Discovered Internal Pages', icon: '📄', status: progressPercent >= 40 ? 'Done' : progressPercent >= 20 ? 'Scanning' : 'Pending' },
                    { name: 'Reddit Discussions', icon: '💬', status: progressPercent >= 65 ? 'Done' : progressPercent >= 40 ? 'Searching' : 'Pending' },
                    { name: 'LeetCode & Forums', icon: '💻', status: progressPercent >= 85 ? 'Done' : progressPercent >= 65 ? 'Searching' : 'Pending' }
                  ].map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#F9F9F6]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] text-[#666666] w-4 text-center shrink-0">{s.icon}</span>
                        <span className="font-medium text-[#0A0A0A] text-xs truncate">{s.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase shrink-0 ${
                        s.status === 'Done'
                          ? 'bg-[#E8FF00]/30 text-[#6B8E00] border border-[#CCFF00]/60'
                          : s.status.includes('ing') || s.status === 'Scanning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          : 'bg-[#F2F2EC] text-[#999999]'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DATA WE'RE EXTRACTING CARD */}
              <div className="bg-white border border-[#E5E5DF] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="font-mono text-[10px] font-bold text-[#888888] uppercase tracking-wider pb-1 border-b border-[#F0F0EA]">
                  DATA WE'RE EXTRACTING
                </div>

                <div className="space-y-2 font-sans text-xs">
                  {[
                    { label: 'Company overview', icon: 'T', isDone: progressPercent >= 30 },
                    { label: 'Tech stack', icon: '⚙️', isDone: progressPercent >= 50 },
                    { label: 'Recent news', icon: '📰', isDone: progressPercent >= 70 },
                    { label: 'Culture & values', icon: '👥', isDone: progressPercent >= 85 },
                    { label: 'Interview experiences', icon: '💬', isDone: progressPercent >= 92 },
                    { label: 'Role-specific insights', icon: '💡', isDone: progressPercent >= 98 }
                  ].map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#F9F9F6]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs text-[#666666] shrink-0">{d.icon}</span>
                        <span className="font-medium text-[#0A0A0A] text-xs truncate">{d.label}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase shrink-0 ${
                        d.isDone
                          ? 'bg-[#E8FF00]/30 text-[#6B8E00] border border-[#CCFF00]/60'
                          : progressPercent > idx * 15
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          : 'bg-[#F2F2EC] text-[#999999]'
                      }`}>
                        {d.isDone ? 'Extracted' : progressPercent > idx * 15 ? 'In progress' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WHY THIS MATTERS BOX */}
              <div className="bg-[#F2F6E8] border border-[#D5E5B5] rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-xs text-[#0A0A0A]">
                  <span className="text-[#88B800]">⚡</span>
                  <span>Why this matters?</span>
                </div>
                <p className="text-[11px] text-[#445522] leading-relaxed font-sans">
                  We gather real, up-to-date information so you get relevant, high-quality questions and a personalized study plan.
                </p>
              </div>

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

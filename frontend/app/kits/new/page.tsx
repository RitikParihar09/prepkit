'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Users,
  Sparkles,
  Clipboard,
  Loader2,
  Trash2,
  Upload
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
  const [interviewNotes, setInterviewNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [activeKitId, setActiveKitId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('queued');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Simulation interval for Play/Pause in Preview Mode
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlayingPreview) {
      timer = setInterval(() => {
        setProgressPercent(prev => {
          if (prev >= 100) {
            setIsPlayingPreview(false);
            return 100;
          }
          if (prev < 20) return 20;
          if (prev < 45) return 45;
          if (prev < 65) return 65;
          if (prev < 85) return 85;
          return 100;
        });
      }, 1400);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlayingPreview]);

  // Check URL for ?preview=true or ?generating=true to open live generating UI directly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview') === 'true' || params.get('generating') === 'true' || params.get('demo') === 'true') {
        setIsPreviewMode(true);
        setIsSubmitting(true);
        setProgressPercent(45);
        setCompanyUrl('https://stripe.com');
        setCurrentStep('researching_company');
      }

      const handleToggle = () => setIsPlayingPreview(prev => !prev);
      const handleReset = () => {
        setIsPlayingPreview(false);
        setProgressPercent(15);
      };
      window.addEventListener('toggle-sim-play', handleToggle);
      window.addEventListener('reset-sim-play', handleReset);
      return () => {
        window.removeEventListener('toggle-sim-play', handleToggle);
        window.removeEventListener('reset-sim-play', handleReset);
      };
    }
  }, []);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [linePathD, setLinePathD] = useState<string | null>(null);
  const [landingCoords, setLandingCoords] = useState<{ x: number; y: number } | null>(null);

  // Fill realistic mock data for instant testing
  const handleFillDemoData = () => {
    setJobDescription(
      `Senior Full-Stack & System Design Engineer at Stripe\n\n` +
      `Responsibilities:\n` +
      `• Build & scale global payment infrastructure handling millions of transactions/sec.\n` +
      `• Design resilient microservices in Node.js/Go, MongoDB, Redis, and Kafka.\n` +
      `• Collaborate across product & engineering to optimize API latency and fraud detection.\n\n` +
      `Requirements:\n` +
      `• 5+ years of experience with distributed systems, high concurrency, and database tuning.\n` +
      `• Strong algorithmic problem solving, API security, and system architecture fundamentals.`
    );
    setCompanyUrl('https://stripe.com');
    setDaysAvailable(7);
    setInterviewNotes('Round 2 is a 48h system design take-home assignment building an idempotent webhook delivery system in Node.js.');
    setValidationErrors({});
  };

  // Clear all input fields back to empty state
  const handleClearAllData = () => {
    setJobDescription('');
    setCompanyUrl('');
    setDaysAvailable(5);
    setInterviewNotes('');
    setValidationErrors({});
    setError(null);
  };

  // Upload file of description and company pairs (JSON or TXT)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        // Try parsing JSON array or single object
        const parsed = JSON.parse(content);
        const item = Array.isArray(parsed) ? parsed[0] : parsed;

        if (item.jobDescription || item.jd || item.description) {
          setJobDescription(item.jobDescription || item.jd || item.description);
        }
        if (item.companyUrl || item.url || item.company) {
          setCompanyUrl(item.companyUrl || item.url || item.company);
        }
        if (item.interviewNotes || item.notes) {
          setInterviewNotes(item.interviewNotes || item.notes);
        }
      } catch {
        // Fallback text format parsing (e.g. "URL: https://...\nJD: ...")
        const lines = content.split('\n');
        let url = '';
        const jdLines: string[] = [];

        for (const line of lines) {
          if (/^https?:\/\//i.test(line.trim())) {
            url = line.trim();
          } else if (line.toLowerCase().startsWith('company:') || line.toLowerCase().startsWith('url:')) {
            url = line.split(':').slice(1).join(':').trim();
          } else {
            jdLines.push(line);
          }
        }

        if (url) setCompanyUrl(url);
        if (jdLines.length > 0) setJobDescription(jdLines.join('\n').trim());
      }
    };
    reader.readAsText(file);
  };

  // Paste text from system clipboard directly into Job Description
  const handlePasteJobDescription = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJobDescription(text);
        if (validationErrors.jobDescription) {
          setValidationErrors(prev => ({ ...prev, jobDescription: undefined }));
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard text:', err);
    }
  };

  // Auto-scroll live terminal logs as new queries arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [progressPercent]);

  const calculateLinePath = useCallback(() => {
    if (!buttonRef.current || !cardRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const btnRect = buttonRef.current.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();

    // Start point: right edge, vertical center of Generate button wrapper
    const x1 = btnRect.right - containerRect.left;
    const y1 = btnRect.top + btnRect.height / 2 - containerRect.top;

    // End point: bottom center of the step-by-step process list card
    const x2 = cardRect.left + cardRect.width / 2 - containerRect.left;
    const y2 = cardRect.bottom - containerRect.top;

    // Smooth control points swooping into the bottom-middle of the card
    const cx1 = x1 + (x2 - x1) * 0.45;
    const cy1 = y1 + 55;
    const cx2 = x2;
    const cy2 = y2 + 50;

    setLinePathD(`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`);
    setLandingCoords({ x: x2, y: y2 });
  }, []);

  // Update line path on window resize
  useEffect(() => {
    window.addEventListener('resize', calculateLinePath);
    return () => window.removeEventListener('resize', calculateLinePath);
  }, [calculateLinePath]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const [validationErrors, setValidationErrors] = useState<{ jobDescription?: string; companyUrl?: string; daysAvailable?: string }>({});

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: { jobDescription?: string; companyUrl?: string; daysAvailable?: string } = {};

    if (!jobDescription.trim()) {
      errors.jobDescription = 'Please paste the job description text to continue.';
    } else if (jobDescription.trim().length < 10) {
      errors.jobDescription = 'Job description is too short (minimum 10 characters required).';
    }

    if (!companyUrl.trim()) {
      errors.companyUrl = 'Please enter the company website URL.';
    } else {
      try {
        const formattedUrl = companyUrl.startsWith('http://') || companyUrl.startsWith('https://') 
          ? companyUrl 
          : `https://${companyUrl}`;
        new URL(formattedUrl);
      } catch {
        errors.companyUrl = 'Please enter a valid website URL (e.g., https://company.com).';
      }
    }

    if (!daysAvailable || daysAvailable < 1 || daysAvailable > 60) {
      errors.daysAvailable = 'Preparation timeline must be between 1 and 60 days.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    calculateLinePath();

    try {
      setIsSubmitting(true);

      const formattedCompanyUrl = companyUrl.startsWith('http://') || companyUrl.startsWith('https://') 
        ? companyUrl 
        : `https://${companyUrl}`;

      const res = await api.createKit({
        jobDescription,
        companyUrl: formattedCompanyUrl,
        daysAvailable,
        interviewNotes
      });

      // Navigate directly to the real kit page where live websocket/polling logs run seamlessly
      router.push(`/kits/${res.id}`);
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
    const thresholds = [20, 45, 65, 85, 100];
    const prevThreshold = index > 0 ? thresholds[index - 1] : 0;
    const currThreshold = thresholds[index];

    if (progressPercent >= currThreshold) {
      return 'Completed';
    }
    if (progressPercent >= prevThreshold && progressPercent < currThreshold) {
      return 'In progress';
    }
    return 'Pending';
  };

  // =========================================================================
  // IF GENERATING KIT (isSubmitting === true): Agentic Live Research UI
  // =========================================================================
  if (isSubmitting) {
    const targetHost = companyUrl ? new URL(companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`).hostname.replace(/^www\./, '') : 'acme.com';
    const baseUrlFormatted = companyUrl || `https://www.${targetHost}`;

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
    
    // Calculate current step (1 to 5) accurately
    const displayStepNum = progressPercent >= 100 ? 5 : Math.min(5, Math.max(1, Math.floor(FIVE_GENERATION_STEPS.findIndex((_, idx) => getStepStatus(idx) === 'In progress')) + 1));

    // Dynamic Step Header Information based on progress percent
    const getActiveStepDetails = (percent: number) => {
      if (percent >= 90) {
        return {
          title: 'Building day-by-day study roadmap...',
          desc: 'Personalizing schedule allocation, requirement coverage matrix, and weak spot risk matrix.',
          Icon: Building2
        };
      } else if (percent >= 70) {
        return {
          title: 'Synthesizing question bank & flashcards...',
          desc: 'Generating technical, system design, and STAR-method behavioral practice questions.',
          Icon: Cpu
        };
      } else if (percent >= 50) {
        return {
          title: 'Searching developer forums & discussions...',
          desc: 'Analyzing candidate reported interview questions, Glassdoor loops, and Reddit threads.',
          Icon: Users
        };
      } else if (percent >= 25) {
        return {
          title: 'Crawling company information & engineering links...',
          desc: 'Analyzing multiple sources to get the most accurate and up-to-date information.',
          Icon: FileText
        };
      } else {
        return {
          title: 'Parsing job description context...',
          desc: 'Extracting must-have technical requirements, seniority level, and skill matrix.',
          Icon: Globe
        };
      }
    };

    const currentStepMeta = getActiveStepDetails(progressPercent);
    const ActiveStepIconComp = currentStepMeta.Icon;

    return (
      <div className="h-[calc(100vh-4rem)] bg-[#F9F9F6] text-[#0A0A0A] font-sans selection:bg-[#CCFF00] selection:text-black relative overflow-hidden px-4 sm:px-6 lg:px-8 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
        
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

        <div className="max-w-[1400px] w-full mx-auto relative z-10 space-y-6">
          
          {/* MAIN 3-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* COLUMN 1: LEFT STEPPER & NOTICE (3 Cols) */}
            <div className="lg:col-span-3 space-y-4 pt-1 sm:pt-2">

              {/* Steps Card with vertical connector */}
              <div className="bg-white border border-[#E5E5DF] rounded-2xl shadow-sm overflow-hidden p-4 relative">

                <div className="relative space-y-4">
                  {/* Dynamic Vertical connector line centered at 21px */}
                  <div className="absolute left-[21px] top-6 bottom-10 w-[2px] bg-[#EAEAE5] z-0" />
                  <div
                    className="absolute left-[21px] top-6 w-[2px] bg-[#E8FF00] z-0 transition-all duration-700 ease-out"
                    style={{
                      height: `${Math.min(100, Math.max(0, (progressPercent / 100) * 88))}%`
                    }}
                  />

                  {FIVE_GENERATION_STEPS.map((step, idx) => {
                    const status = getStepStatus(idx);
                    const isCompleted = status === 'Completed';
                    const isInProgress = status === 'In progress';

                    return (
                      <div
                        key={step.id}
                        className={`relative z-10 flex items-start gap-3 p-2 rounded-xl transition-colors ${
                          isInProgress ? 'bg-[#F5FFD6]' : 'bg-white'
                        }`}
                      >
                        {/* Circle */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 transition-all ${
                          isCompleted
                            ? 'bg-[#E8FF00] border-[#E8FF00]'
                            : isInProgress
                            ? 'bg-white border-[#E8FF00] shadow-[0_0_8px_rgba(232,255,0,0.6)]'
                            : 'bg-white border-[#D1D5DB]'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                          ) : isInProgress ? (
                            <div className="w-2 h-2 rounded-full bg-[#E8FF00] animate-pulse" />
                          ) : null}
                        </div>

                        {/* Text */}
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-bold leading-snug ${
                            isCompleted ? 'text-[#0A0A0A]'
                            : isInProgress ? 'text-[#0A0A0A]'
                            : 'text-[#AAAAAA]'
                          }`}>
                            {idx + 1}. {step.title}
                          </div>
                          <div className={`text-[10px] leading-normal mt-0.5 ${
                            isInProgress ? 'text-[#5566AA]' : 'text-[#AAAAAA]'
                          }`}>
                            {step.description}
                          </div>
                        </div>

                        {/* Time */}
                        <div className="shrink-0 font-mono text-[10px] text-[#999999] mt-1">
                          {isCompleted && <span>12s</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notice */}
              <div className="flex items-start gap-2.5 px-1 text-[11px] text-[#555555] leading-snug">
                <span className="text-base shrink-0">💡</span>
                <span>This usually takes 1–2 minutes. You can safely leave this page — we'll notify you when it's ready.</span>
              </div>

              {/* Cancel button */}
              <button
                onClick={handleCancelGeneration}
                className="w-full bg-white hover:bg-[#F4F4EE] text-[#0A0A0A] border border-[#D0D0CA] text-xs font-bold py-3 px-4 rounded-xl transition-all font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <div className="w-3 h-3 bg-[#0A0A0A] rounded-sm shrink-0" />
                Cancel Generation
              </button>

            </div>

            {/* COLUMN 2: CENTER PROGRESS & LOGS (6 Cols) */}
            <div className="lg:col-span-6 bg-white border border-[#E5E5DF] rounded-2xl p-6 shadow-sm space-y-5">

              {/* Header: Step Counter + Live dot */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EA]">
                <div className="font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-ping"></span>
                  <span>LIVE PROGRESS</span>
                </div>
                <span className="font-mono text-xs font-bold bg-[#F0F0EA] px-2.5 py-1 rounded-lg text-[#333333]">
                  Step {displayStepNum} of 5
                </span>
              </div>

              {/* Dynamic Icon + Title + Subtitle + Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 min-h-[48px]">
                  <div className="w-10 h-10 bg-[#F0F0EA] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <ActiveStepIconComp className="w-5 h-5 text-[#333333]" />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center min-h-[44px]">
                    <div className="font-extrabold text-[#0A0A0A] text-base leading-snug">
                      {currentStepMeta.title}
                    </div>
                    <p className="text-xs text-[#666666] leading-relaxed mt-0.5">
                      {currentStepMeta.desc}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-[#EAEAE5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#AAEE00] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="font-mono font-extrabold text-sm text-[#0A0A0A] shrink-0 w-10 text-right">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              {/* Checklist with Icons (Zero-shift fixed height containers) */}
              <div className="space-y-2 font-sans text-xs">
                {[
                  { title: 'Connecting to target website', url: baseUrlFormatted, icon: Globe, minProgress: 15, threshold: 20 },
                  { title: 'Discovering site pages & engineering links', url: 'Subdomain & career path crawler', icon: FileText, minProgress: 20, threshold: 45 },
                  { title: 'Searching developer forums & discussions', url: 'Reddit & LeetCode public threads', icon: Users, minProgress: 45, threshold: 65 },
                  { title: 'Analyzing role requirements & skill matrix', url: 'Deterministic requirement extraction', icon: Cpu, minProgress: 65, threshold: 85 },
                  { title: 'Synthesizing question bank & flashcards', url: 'AI Question & Active Recall Builder', icon: Building2, minProgress: 85, threshold: 100 }
                ].map((item, i) => {
                  const isDone = progressPercent >= item.threshold;
                  const isCurr = progressPercent >= item.minProgress && !isDone;
                  const IconComp = item.icon;

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all h-[52px] border ${
                        isDone
                          ? 'bg-[#F7F9EE] border-[#D5E5B5]'
                          : isCurr
                          ? 'bg-[#FAFAF6] border-[#E8E8E0] shadow-xs'
                          : 'bg-white border-transparent hover:bg-[#F4F4F0]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? 'bg-[#E8FF00] text-black font-bold border border-[#CCFF00]'
                            : isCurr
                            ? 'bg-[#0A0A0A] text-[#E8FF00]'
                            : 'bg-[#EAEAE5] text-[#999999]'
                        }`}>
                          {isDone ? <Check className="w-4 h-4 text-black stroke-[3]" /> : <IconComp className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#0A0A0A] truncate text-xs">{item.title}</div>
                          <div className="text-[10px] text-[#999999] font-mono truncate">{item.url}</div>
                        </div>
                      </div>

                      <div className="shrink-0 font-mono text-[10px]">
                        {isDone ? (
                          <span className="text-[#557700] font-bold uppercase bg-[#E8FF00]/40 px-2 py-0.5 rounded border border-[#CCFF00]">Done</span>
                        ) : isCurr ? (
                          <span className="text-[#88BB00] font-bold uppercase animate-pulse bg-[#E8FF00]/20 px-2 py-0.5 rounded border border-[#CCFF00]/40">Active</span>
                        ) : (
                          <span className="text-[#AAAAAA] uppercase px-2 py-0.5">Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Terminal */}
              <div className="bg-[#12141A] text-white rounded-xl p-4 font-mono text-[11px] border border-[#222530] shadow-sm">
                <div className="flex items-center justify-between text-[10px] text-[#8A95A5] border-b border-[#222530] pb-2 mb-2.5 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse"></span>
                    <span>LIVE TERMINAL LOGS</span>
                  </div>
                  <span className="text-[#CCFF00] font-bold">● ACTIVE</span>
                </div>
                <div className="h-[104px] overflow-y-auto scrollbar-none space-y-2 pr-1 scroll-smooth">
                  {currentVisibleLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-4 text-[#C5CBD8] leading-tight">
                      <span className="truncate">{log.text}</span>
                      <span className="text-[#6A7282] shrink-0 font-mono text-[10px]">{log.time}</span>
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              </div>

            </div>


            {/* COLUMN 3: RIGHT PANEL (Sources, Extracting grid, Why this matters) (3 Cols) */}
            <div className="lg:col-span-3 space-y-5">
              
              {/* 6 Sources Card */}
              <div className="bg-white border border-[#E5E5DF] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="font-mono text-[10px] font-bold text-[#888888] uppercase tracking-wider pb-2 border-b border-[#F0F0EA] flex items-center justify-between">
                  <span>Research Sources</span>
                  <span className="text-[#0A0A0A] font-bold font-mono">6 Active</span>
                </div>

                <div className="space-y-1.5 font-sans text-xs">
                  {[
                    { name: 'Target Company Website', icon: '🌐', status: progressPercent >= 20 ? 'Indexed' : 'Scanning' },
                    { name: 'Careers & Job Board', icon: '📄', status: progressPercent >= 40 ? 'Indexed' : 'Pending' },
                    { name: 'Engineering Tech Blog', icon: '📰', status: progressPercent >= 55 ? 'Indexed' : 'Pending' },
                    { name: 'Github Repositories', icon: '💻', status: progressPercent >= 70 ? 'Indexed' : 'Pending' },
                    { name: 'Reddit Discussions', icon: '💬', status: progressPercent >= 85 ? 'Indexed' : 'Pending' },
                    { name: 'LeetCode & Glassdoor', icon: '⭐', status: progressPercent >= 95 ? 'Indexed' : 'Pending' }
                  ].map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#FAFAF7]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs shrink-0">{s.icon}</span>
                        <span className="font-medium text-[#0A0A0A] text-xs truncate">{s.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase shrink-0 ${
                        s.status === 'Indexed'
                          ? 'bg-[#E8FF00]/30 text-[#557700] border border-[#CCFF00]/60'
                          : 'bg-[#F2F2EC] text-[#888888]'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DATA WE'RE EXTRACTING — 2-column dot grid */}
              <div className="bg-white border border-[#E5E5DF] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="font-mono text-[10px] font-bold text-[#888888] uppercase tracking-wider pb-2 border-b border-[#F0F0EA]">
                  DATA WE'RE EXTRACTING
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {[
                    { label: 'Company overview',      doneAt: 25 },
                    { label: 'Interview experiences', doneAt: 70 },
                    { label: 'Tech stack',            doneAt: 40 },
                    { label: 'Role-specific insights',doneAt: 80 },
                    { label: 'Recent news',           doneAt: 55 },
                    { label: 'Key skills & tools',    doneAt: 88 },
                    { label: 'Culture & values',      doneAt: 65 },
                    { label: 'Team structure',        doneAt: 95 }
                  ].map((d, i) => {
                    const isDone = progressPercent >= d.doneAt;
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                          isDone ? 'bg-[#E8FF00]' : 'bg-[#DDDDDD]'
                        }`} />
                        <span className={`text-[10px] leading-tight font-sans ${
                          isDone ? 'text-[#0A0A0A]' : 'text-[#AAAAAA]'
                        }`}>{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* WHY THIS MATTERS — subtle lime card with pencil icon */}
              <div className="bg-[#E8FF00]/20 border border-[#E8FF00]/50 rounded-2xl p-4 relative">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#0A0A0A]">
                    <span>✦</span>
                    <span>Why this matters?</span>
                  </div>
                  <div className="w-5 h-5 bg-[#0A0A0A] text-white rounded-md flex items-center justify-center shrink-0">
                    <ArrowRight className="w-3 h-3 -rotate-45" />
                  </div>
                </div>
                <p className="text-[11px] text-[#444444] leading-relaxed">
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-4.25rem)] overflow-hidden flex flex-col justify-between font-sans">

      {/* Workspace Top Header — matches dashboard exactly */}
      <div className="border-b border-[#E5E5E0] pb-4 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-3 font-mono text-xs text-[#666666] tracking-widest uppercase mb-2">
            <span>INPUT TERMINAL</span>
            <span className="text-[#E5E5E0]">|</span>
            <span>AUTONOMOUS PIPELINE INVOCATION</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A] tracking-wider uppercase">
              CREATE&nbsp;&nbsp;INTERVIEW&nbsp;&nbsp;PREP&nbsp;&nbsp;KIT
            </h1>
          </div>
        </div>

        {/* Demo Quick Fill & Clear All Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleClearAllData}
            className="px-3.5 py-2 bg-white hover:bg-red-50 text-[#444444] hover:text-red-700 border border-[#D8D8D0] hover:border-red-300 font-mono text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            title="Clear all form fields"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR&nbsp;&nbsp;ALL</span>
          </button>

          <button
            type="button"
            onClick={handleFillDemoData}
            className="px-4 py-2 bg-[#E8FF00] hover:bg-[#d4ea00] text-[#0A0A0A] border border-[#0A0A0A] font-mono text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-[#0A0A0A] text-[#0A0A0A]" />
            <span>FILL&nbsp;&nbsp;DEMO&nbsp;&nbsp;DATA</span>
          </button>
        </div>
      </div>

      {error && !isSubmitting && (
        <div className="max-w-5xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-800 font-mono text-xs flex items-center gap-2 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>[ERROR] {error}</span>
        </div>
      )}

      {/* Centered Sleek Form Panel Wrapper */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center min-h-0">
        <div ref={containerRef} className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Animated Connecting Laser Beam line from Generate Button to bottom-middle of step list */}
        {linePathD && isSubmitting && (
          <svg className="absolute inset-0 pointer-events-none z-30 w-full h-full overflow-visible">
            <defs>
              <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0A0A0A" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#E8FF00" stopOpacity="1" />
                <stop offset="100%" stopColor="#E8FF00" stopOpacity="0.9" />
              </linearGradient>
              <filter id="laser-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ambient track glow */}
            <path
              d={linePathD}
              stroke="#E8FF00"
              strokeWidth="4"
              fill="none"
              opacity="0.35"
              filter="url(#laser-glow)"
            />

            {/* Main animated laser line */}
            <path
              d={linePathD}
              stroke="url(#beam-grad)"
              strokeWidth="2.5"
              fill="none"
              className="animate-laser-flow"
              filter="url(#laser-glow)"
            />

            {/* Energy traveling particle */}
            <circle r="4.5" fill="#E8FF00" filter="url(#laser-glow)">
              <animateMotion path={linePathD} dur="0.9s" repeatCount="indefinite" />
            </circle>

            {/* Arrival Pulse Dot at bottom-middle of process card */}
            {landingCoords && (
              <g transform={`translate(${landingCoords.x}, ${landingCoords.y})`}>
                <circle r="8" fill="#E8FF00" opacity="0.4" className="animate-ping" />
                <circle r="4" fill="#E8FF00" filter="url(#laser-glow)" />
              </g>
            )}
          </svg>
        )}

        {/* Main Form Panel — Full Screen Width */}
        <div className="lg:col-span-12 tech-panel p-5 sm:p-7 border-[#0A0A0A] bg-white rounded-xl shadow-sm mb-10">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Step 01 / Job Description */}
            <div className="space-y-1.5">
              <label className="font-mono text-xs text-[#0A0A0A] uppercase tracking-wider font-bold flex items-center justify-between min-h-[20px]">
                <div className="flex items-center gap-3">
                  <span>01 / JOB CONTEXT *</span>
                  <button
                    type="button"
                    onClick={handlePasteJobDescription}
                    className="font-mono text-[10px] bg-[#F7F7F3] hover:bg-[#EAEAE4] text-[#0A0A0A] border border-[#E5E5E0] px-2 py-0.5 rounded flex items-center gap-1 font-bold cursor-pointer transition-colors normal-case tracking-normal"
                    title="Paste text from system clipboard"
                  >
                    <Clipboard className="w-3 h-3 text-[#666666]" />
                    <span>PASTE FROM CLIPBOARD</span>
                  </button>

                  <label className="font-mono text-[10px] bg-[#F7F7F3] hover:bg-[#EAEAE4] text-[#0A0A0A] border border-[#E5E5E0] px-2 py-0.5 rounded flex items-center gap-1 font-bold cursor-pointer transition-colors normal-case tracking-normal">
                    <Upload className="w-3 h-3 text-[#666666]" />
                    <span>UPLOAD FILE OF PAIRS</span>
                    <input
                      type="file"
                      accept=".json,.txt,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {validationErrors.jobDescription ? (
                  <span className="text-red-600 font-bold text-xs flex items-center gap-1 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{validationErrors.jobDescription}</span>
                  </span>
                ) : (
                  <span className="text-[#8A8A8A] font-normal normal-case tracking-normal">Paste full job description</span>
                )}
              </label>
              <textarea
                rows={4}
                value={jobDescription}
                onChange={e => {
                  setJobDescription(e.target.value);
                  if (validationErrors.jobDescription) {
                    setValidationErrors(prev => ({ ...prev, jobDescription: undefined }));
                  }
                }}
                placeholder="Paste job description text here... (e.g. Senior Backend Engineer with 5+ years of Node.js, microservices, MongoDB, distributed caching...)"
                className={`w-full p-3.5 border font-mono text-xs text-[#0A0A0A] bg-[#F7F7F3] leading-relaxed resize-y rounded-lg transition-colors focus:outline-none ${
                  validationErrors.jobDescription
                    ? 'border-red-500 ring-2 ring-red-500/20'
                    : 'border-[#E5E5E0] focus:border-[#0A0A0A]'
                }`}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-[#E5E5E0]" />

            {/* Step 02 & Step 03 in Single Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Step 02 / Company Website URL */}
              <div className="lg:col-span-5 space-y-1.5">
                <label className="font-mono text-xs text-[#0A0A0A] uppercase tracking-wider font-bold flex items-center justify-between min-h-[20px]">
                  <span>02 / COMPANY WEBSITE URL *</span>
                  {validationErrors.companyUrl && (
                    <span className="text-red-600 font-bold text-xs flex items-center gap-1 animate-in fade-in duration-200">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{validationErrors.companyUrl}</span>
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={companyUrl}
                  onChange={e => {
                    setCompanyUrl(e.target.value);
                    if (validationErrors.companyUrl) {
                      setValidationErrors(prev => ({ ...prev, companyUrl: undefined }));
                    }
                  }}
                  placeholder="https://company.com"
                  className={`w-full px-4 py-3 border font-mono text-xs text-[#0A0A0A] bg-[#F7F7F3] rounded-lg transition-colors focus:outline-none ${
                    validationErrors.companyUrl
                      ? 'border-red-500 ring-2 ring-red-500/20'
                      : 'border-[#E5E5E0] focus:border-[#0A0A0A]'
                  }`}
                />
              </div>

              {/* Step 03 / Preparation Timeline Days Selector */}
              <div className="lg:col-span-7 space-y-1.5">
                <div className="flex items-center justify-between min-h-[20px]">
                  <label className="font-mono text-xs text-[#0A0A0A] uppercase tracking-wider font-bold">
                    03 / PREPARATION TIMELINE *
                  </label>
                  <span className="font-mono text-xs text-[#666666]">
                    Sprint Target:&nbsp;<strong className="text-[#0A0A0A] bg-[#E8FF00] px-2 py-0.5 font-bold">{daysAvailable} Days</strong>
                  </span>
                </div>

                {/* Segment Option Cards */}
                <div className="grid grid-cols-5 gap-2 font-mono text-xs">
                  {[
                    { label: '3 Days', days: 3, sub: 'Express' },
                    { label: '7 Days', days: 7, sub: 'Standard' },
                    { label: '14 Days', days: 14, sub: 'Deep' },
                    { label: '30 Days', days: 30, sub: 'Master' }
                  ].map(p => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setDaysAvailable(p.days)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        daysAvailable === p.days
                          ? 'bg-[#0A0A0A] text-[#E8FF00] border-[#0A0A0A] shadow-xs scale-[1.02]'
                          : 'bg-[#F7F7F3] text-[#0A0A0A] border-[#E5E5E0] hover:border-[#0A0A0A] hover:bg-white'
                      }`}
                    >
                      <span className="font-extrabold text-xs">{p.label}</span>
                      <span className={`text-[9px] uppercase mt-0.5 ${daysAvailable === p.days ? 'text-[#E8FF00]/80 font-bold' : 'text-[#888888]'}`}>
                        {p.sub}
                      </span>
                    </button>
                  ))}

                  {/* Custom Days Stepper */}
                  <div className="bg-[#F7F7F3] border border-[#E5E5E0] focus-within:border-[#0A0A0A] rounded-xl p-1.5 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => setDaysAvailable(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 flex items-center justify-center font-bold text-sm text-[#0A0A0A] hover:bg-[#EAEAE4] rounded-md transition-colors cursor-pointer shrink-0"
                    >
                      −
                    </button>
                    <div className="text-center font-mono font-bold text-xs flex-1">
                      <span className="text-[#0A0A0A] text-xs leading-none">{daysAvailable}d</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDaysAvailable(prev => Math.min(60, prev + 1))}
                      className="w-7 h-7 flex items-center justify-center font-bold text-sm text-[#0A0A0A] hover:bg-[#EAEAE4] rounded-md transition-colors cursor-pointer shrink-0"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-[#E5E5E0]" />

            {/* Step 04 / Interview Process & Assignment Notes (Optional) */}
            <div className="space-y-1.5">
              <label className="font-mono text-xs text-[#0A0A0A] uppercase tracking-wider font-bold flex items-center justify-between min-h-[20px]">
                <span>04 / INTERVIEW PROCESS & ASSIGNMENT (OPTIONAL)</span>
                <span className="text-[#8A8A8A] font-normal normal-case tracking-normal">Recruiter notes or take-home details</span>
              </label>
              <input
                type="text"
                value={interviewNotes}
                onChange={e => setInterviewNotes(e.target.value)}
                placeholder="e.g. Round 2 is a 48h take-home assignment building a REST API in Node.js/React..."
                className="w-full px-4 py-3 border font-mono text-xs text-[#0A0A0A] bg-[#F7F7F3] rounded-lg transition-colors focus:outline-none border-[#E5E5E0] focus:border-[#0A0A0A]"
              />
            </div>

            {/* Submit CTA — matches dashboard's tech-button-primary */}
            <div className="pt-8 mt-8 border-t border-[#E5E5E0] flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="tech-button-primary text-xs py-3.5 px-10 rounded-none font-sans font-bold uppercase tracking-wider text-white disabled:opacity-80 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#E8FF00] animate-spin" />
                    <span>INITIALIZING&nbsp;&nbsp;PIPELINE...</span>
                  </>
                ) : (
                  <>
                    <span>GENERATE&nbsp;&nbsp;PREP&nbsp;&nbsp;KIT</span>
                    <ArrowRight className="w-4 h-4 text-[#E8FF00] animate-arrow-nudge" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>

    </div>
  );
}

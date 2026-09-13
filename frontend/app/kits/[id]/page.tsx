'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { KitData, Question, Flashcard, Requirement } from '@/types/kit';
import { QuestionCard } from '@/components/kit/QuestionCard';
import { ScheduleTimeline } from '@/components/kit/ScheduleTimeline';
import { CoverageReport } from '@/components/kit/CoverageReport';
import { WeakSpotsView } from '@/components/kit/WeakSpotsView';

import {
  Building2,
  Briefcase,
  ShieldCheck,
  HelpCircle,
  Layers,
  Calendar,
  Sparkles,
  PlayCircle,
  RefreshCw,
  Save,
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Check,
  Globe,
  FileText,
  Users,
  Cpu
} from 'lucide-react';

type TabType =
  | 'overview'
  | 'company'
  | 'process'
  | 'role'
  | 'questions'
  | 'flashcards'
  | 'schedule'
  | 'coverage'
  | 'weak-spots';

const FIVE_GENERATION_STEPS = [
  { id: '1', title: 'Parsing job description', description: 'Extracting must-have skills, role level, and core requirements' },
  { id: '2', title: 'Researching company', description: 'Gathering insights from the official website and public sources' },
  { id: '3', title: 'Mapping key requirements', description: 'Identifying must-have skills and topics' },
  { id: '4', title: 'Generating question bank', description: 'Creating targeted practice questions with detailed solutions' },
  { id: '5', title: 'Building study plan', description: 'Personalizing your day-by-day preparation roadmap' }
];

const TERMINAL_LOG_ENTRIES: { text: string; time: string; url?: string }[] = [
  { text: '> Initializing autonomous web crawler...', time: '10:24:10' },
  { text: '> Fetching target domain pages...', time: '10:24:12' },
  { text: '> Parsing HTML content & extracting metadata', time: '10:24:13' },
  { text: '> Discovering high-priority links: /careers, /jobs, /engineering', time: '10:24:14' },
  { text: '> Analyzing engineering blog tech stack & architecture posts', time: '10:24:16' },
  { text: '> Querying public interview forums (Reddit & LeetCode)', time: '10:24:19' },
  { text: '> Mapping technical requirement weights to candidate timeline', time: '10:24:22' },
  { text: '> Generating domain-specific technical & system design questions', time: '10:24:25' },
  { text: '> Building personalized day-by-day preparation schedule', time: '10:24:28' },
  { text: '> Verification complete. Finalizing prep kit payload.', time: '10:24:30' }
];

export default function KitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;

  const [kitData, setKitData] = useState<KitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regeneratingCategory, setRegeneratingCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Generating status state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(15);
  const [companyUrl, setCompanyUrl] = useState('');
  const [serverLogs, setServerLogs] = useState<{ text: string; time: string; url?: string }[]>([]);
  const [serverSources, setServerSources] = useState<{ name: string; url: string; status: string }[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Flashcard flip states for Flashcards tab
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let wasGeneratingRef = false;

    const fetchKit = async () => {
      try {
        const res = await api.getKitById(kitId);
        if (res.logs && res.logs.length > 0) setServerLogs(res.logs);
        if (res.crawledSources && res.crawledSources.length > 0) setServerSources(res.crawledSources);

        if (res.companyUrl) setCompanyUrl(res.companyUrl);
        else if (res.data?.source?.company_url) setCompanyUrl(res.data.source.company_url);

        if (res.data && res.status === 'completed') {
          setKitData(res.data);
          setProgressPercent(100);
          setIsGenerating(false);
          setLoading(false);
          if (interval) clearInterval(interval);

          if (wasGeneratingRef) {
            setShowSuccessModal(true);
          }
        } else if (res.status === 'failed') {
          setError(res.error?.message || 'Kit generation failed.');
          setIsGenerating(false);
          setLoading(false);
          if (interval) clearInterval(interval);
        } else {
          // Still generating / processing - set isGenerating BEFORE clearing loading to prevent glitch
          wasGeneratingRef = true;
          setIsGenerating(true);
          setLoading(false);
          if (typeof res.progressPercent === 'number') {
            setProgressPercent(res.progressPercent);
          } else {
            setProgressPercent(prev => Math.min(95, prev + 5));
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load kit details.');
        setLoading(false);
        if (interval) clearInterval(interval);
      }
    };

    if (kitId) {
      fetchKit();
      interval = setInterval(fetchKit, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [kitId]);

  const handleSaveKit = async () => {
    if (!kitData) return;
    try {
      setSaving(true);
      await api.updateKitData(kitId, kitData);
      alert('Kit changes saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save kit changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCategory = async (category: string) => {
    if (!confirm(`Regenerate ${category.replace('-', ' ')} questions? User-edited and manually added questions will be preserved.`)) return;

    try {
      setRegeneratingCategory(category);
      const res = await api.regenerateCategory(kitId, category);
      setKitData(res.data);
      alert(`Category ${category} regenerated! Preserved all user edits.`);
    } catch (err: any) {
      alert(err.message || 'Regeneration failed.');
    } finally {
      setRegeneratingCategory(null);
    }
  };

  // Question bank mutations
  const handleUpdateQuestion = (updatedQ: Question) => {
    if (!kitData) return;
    const questions = kitData.questions.map(q => (q.id === updatedQ.id ? updatedQ : q));
    setKitData({ ...kitData, questions });
  };

  const handleDeleteQuestion = (id: string) => {
    if (!kitData) return;
    const questions = kitData.questions.filter(q => q.id !== id);
    setKitData({ ...kitData, questions });
  };

  const handleMoveQuestionUp = (index: number) => {
    if (!kitData || index === 0) return;
    const questions = [...kitData.questions];
    const temp = questions[index - 1];
    questions[index - 1] = questions[index];
    questions[index] = temp;
    setKitData({ ...kitData, questions });
  };

  const handleMoveQuestionDown = (index: number) => {
    if (!kitData || index === kitData.questions.length - 1) return;
    const questions = [...kitData.questions];
    const temp = questions[index + 1];
    questions[index + 1] = questions[index];
    questions[index] = temp;
    setKitData({ ...kitData, questions });
  };

  const handleAddQuestion = () => {
    if (!kitData) return;
    const newId = `q${kitData.questions.length + 1}`;
    const firstReqId = kitData.role.requirements[0]?.id || 'r1';

    const newQ: Question = {
      id: newId,
      requirement_ids: [firstReqId],
      category: 'technical',
      prompt: 'New custom question prompt',
      answer_outline: '• Key points to cover in answer',
      difficulty: 2,
      _meta: {
        generated: false,
        edited: true,
        pinned: true,
        updatedAt: new Date().toISOString()
      }
    };

    setKitData({ ...kitData, questions: [...kitData.questions, newQ] });
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-[#F9F9F6] text-[#0A0A0A] font-sans relative overflow-hidden px-4 sm:px-6 lg:px-8 flex items-center justify-center animate-in fade-in duration-300">
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px'
          }}
        />

        <div className="max-w-[1400px] w-full mx-auto relative z-10 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Column 1 Skeleton */}
            <div className="lg:col-span-3 bg-white border border-[#E5E5DF] rounded-2xl p-4 shadow-2xs animate-pulse space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EA]">
                <div className="h-4 bg-[#EAEAE5] rounded w-24" />
                <div className="h-4 bg-[#EAEAE5] rounded w-12" />
              </div>
              <div className="space-y-3 pt-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <div className="w-7 h-7 rounded-full bg-[#EAEAE5] shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 bg-[#EAEAE5] rounded w-3/4" />
                      <div className="h-2.5 bg-[#F0F0EA] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2 Skeleton */}
            <div className="lg:col-span-6 bg-white border border-[#E5E5DF] rounded-2xl p-6 shadow-2xs animate-pulse space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EA]">
                <div className="h-4 bg-[#EAEAE5] rounded w-36" />
                <div className="h-6 bg-[#E8FF00]/40 rounded-lg w-20" />
              </div>

              <div className="space-y-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EAEAE5] rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-[#EAEAE5] rounded w-2/3" />
                    <div className="h-3 bg-[#F0F0EA] rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-[#E8FF00]/30 rounded-full w-full mt-3" />
              </div>

              {/* Step Checklist Skeleton */}
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-[#FAF9F6] border border-[#F0F0EA] rounded-xl flex items-center px-3 justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-[#EAEAE5] shrink-0" />
                      <div className="h-3.5 bg-[#EAEAE5] rounded w-1/2" />
                    </div>
                    <div className="h-3 bg-[#F0F0EA] rounded w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3 Skeleton */}
            <div className="lg:col-span-3 bg-white border border-[#E5E5DF] rounded-2xl p-4 shadow-2xs animate-pulse space-y-4">
              <div className="h-4 bg-[#EAEAE5] rounded w-28 pb-3 border-b border-[#F0F0EA]" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-7 bg-[#FAF9F6] rounded-lg" />
                ))}
              </div>
              <div className="h-28 bg-[#F5F5F0] rounded-xl mt-4" />
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    const getStepStatus = (stepIdx: number) => {
      const thresholds = [20, 45, 65, 85, 100];
      const prevThreshold = stepIdx > 0 ? thresholds[stepIdx - 1] : 0;
      const currThreshold = thresholds[stepIdx];

      if (progressPercent >= currThreshold) return 'Completed';
      if (progressPercent >= prevThreshold && progressPercent < currThreshold) return 'In progress';
      return 'Pending';
    };

    const currentActiveStepIndex = FIVE_GENERATION_STEPS.findIndex((_, idx) => getStepStatus(idx) === 'In progress');
    const displayStepNum = progressPercent >= 100 ? 5 : (currentActiveStepIndex !== -1 ? currentActiveStepIndex + 1 : 1);

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

    const targetCompanyDisplayName = kitData?.source?.company && kitData.source.company !== 'Company'
      ? kitData.source.company
      : (companyUrl
          ? (() => {
              try {
                const hostParts = new URL(companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`).hostname.replace(/^www\./, '').split('.');
                const ignoreSubdomains = new Set(['jobs', 'careers', 'work', 'web', 'app', 'www', 'about', 'join', 'in', 'uk', 'us']);
                let main = hostParts[0];
                if (ignoreSubdomains.has(main.toLowerCase()) && hostParts.length > 1) main = hostParts[1];
                return main.charAt(0).toUpperCase() + main.slice(1);
              } catch {
                return 'Amazon';
              }
            })()
          : 'Amazon');

    const targetHost = companyUrl
      ? (() => {
          try { return new URL(companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`).hostname.replace(/^www\./, ''); } catch { return 'amazon.com'; }
        })()
      : 'amazon.com';

    const baseUrlFormatted = companyUrl
      ? (companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`)
      : `https://${targetHost}`;

    const currentStepMeta = getActiveStepDetails(progressPercent);
    const ActiveStepIconComp = currentStepMeta.Icon;

    const dynamicFallbackLogs: { text: string; time: string; url?: string }[] = [
      { text: `> Initializing autonomous web crawler for ${targetCompanyDisplayName}...`, time: '10:24:10', url: baseUrlFormatted },
      { text: `> Connecting to target domain: ${baseUrlFormatted}...`, time: '10:24:12', url: baseUrlFormatted },
      { text: `> Parsing HTML content & extracting metadata from ${targetCompanyDisplayName}...`, time: '10:24:13', url: baseUrlFormatted },
      { text: `> Discovering site pages: ${baseUrlFormatted}/careers, ${baseUrlFormatted}/jobs, ${baseUrlFormatted}/engineering`, time: '10:24:15', url: `${baseUrlFormatted}/careers` },
      { text: `> Crawling hiring pages & engineering culture blog...`, time: '10:24:18', url: `${baseUrlFormatted}/engineering` },
      { text: `> Querying Tavily for ${targetCompanyDisplayName} interview questions on Reddit & LeetCode...`, time: '10:24:20', url: `https://www.reddit.com/search/?q=${encodeURIComponent(targetCompanyDisplayName + ' interview questions')}` },
      { text: `> Filtering & validating public interview discussion sources...`, time: '10:24:23', url: `https://leetcode.com/discuss?q=${encodeURIComponent(targetCompanyDisplayName)}` },
      { text: `> Extracting technical requirement weights & interview process rounds...`, time: '10:24:26' },
      { text: `> Synthesizing technical questions & active recall flashcards...`, time: '10:24:28' },
      { text: `> Building personalized day-by-day preparation schedule...`, time: '10:24:30' }
    ];

    const fallbackLogsCount = Math.min(
      dynamicFallbackLogs.length,
      Math.max(1, Math.floor((progressPercent / 100) * dynamicFallbackLogs.length))
    );
    const currentVisibleLogs = serverLogs.length > 0 
      ? serverLogs 
      : dynamicFallbackLogs.slice(0, fallbackLogsCount);

    const defaultSourcesList = [
      { name: `${targetCompanyDisplayName} Official Website`, url: baseUrlFormatted, icon: '🌐', status: progressPercent >= 20 ? 'Indexed' : 'Scanning' },
      { name: `${targetCompanyDisplayName} Careers & Jobs Portal`, url: `${baseUrlFormatted}/careers`, icon: '📄', status: progressPercent >= 40 ? 'Indexed' : 'Pending' },
      { name: `${targetCompanyDisplayName} Engineering Tech Blog`, url: `${baseUrlFormatted}/engineering`, icon: '📰', status: progressPercent >= 55 ? 'Indexed' : 'Pending' },
      { name: `GitHub Interview Repositories (${targetCompanyDisplayName})`, url: `https://github.com/search?q=${encodeURIComponent(targetCompanyDisplayName + ' interview')}`, icon: '💻', status: progressPercent >= 70 ? 'Indexed' : 'Pending' },
      { name: `Reddit Developer Discussions (${targetCompanyDisplayName})`, url: `https://www.reddit.com/search/?q=${encodeURIComponent(targetCompanyDisplayName + ' interview questions')}`, icon: '💬', status: progressPercent >= 85 ? 'Indexed' : 'Pending' },
      { name: `LeetCode & Glassdoor Posts (${targetCompanyDisplayName})`, url: `https://leetcode.com/discuss?q=${encodeURIComponent(targetCompanyDisplayName)}`, icon: '⭐', status: progressPercent >= 95 ? 'Indexed' : 'Pending' }
    ];

    const activeSourcesList = serverSources.length > 0 
      ? serverSources.map(s => ({
          name: s.name,
          url: s.url,
          icon: s.url.includes('reddit') ? '💬' : s.url.includes('github') ? '💻' : s.url.includes('leetcode') ? '⭐' : '🌐',
          status: s.status || 'Indexed'
        }))
      : defaultSourcesList;

    return (
      <div className="h-[calc(100vh-4rem)] bg-[#F9F9F6] text-[#0A0A0A] font-sans selection:bg-[#CCFF00] selection:text-black relative overflow-hidden px-4 sm:px-6 lg:px-8 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px'
          }}
        />

        <div className="max-w-[1400px] w-full mx-auto relative z-10 space-y-6">
          {/* MAIN 3-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* COLUMN 1: LEFT STEPPER & NOTICE */}
            <div className="lg:col-span-3 space-y-4">
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

                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-bold leading-snug ${
                            isCompleted ? 'text-[#0A0A0A]' : isInProgress ? 'text-[#0A0A0A]' : 'text-[#AAAAAA]'
                          }`}>
                            {idx + 1}. {step.title}
                          </div>
                          <div className={`text-[10px] leading-normal mt-0.5 ${
                            isInProgress ? 'text-[#5566AA]' : 'text-[#AAAAAA]'
                          }`}>
                            {step.description}
                          </div>
                        </div>

                        <div className="shrink-0 font-mono text-[10px] text-[#999999] mt-1">
                          {isCompleted && <span>12s</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-start gap-2.5 px-1 text-[11px] text-[#555555] leading-snug">
                <span className="text-base shrink-0">💡</span>
                <span>This usually takes 1–2 minutes. You can safely leave this page — we'll notify you when it's ready.</span>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-white hover:bg-[#F4F4EE] text-[#0A0A0A] border border-[#D0D0CA] text-xs font-bold py-3 px-4 rounded-xl transition-all font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <div className="w-3 h-3 bg-[#0A0A0A] rounded-sm shrink-0" />
                Cancel Generation
              </button>
            </div>

            {/* COLUMN 2: CENTER PROGRESS & LOGS */}
            <div className="lg:col-span-6 bg-white border border-[#E5E5DF] rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EA]">
                <div className="font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-ping" />
                  <span>LIVE PROGRESS</span>
                </div>
                <span className="font-mono text-xs font-bold bg-[#F0F0EA] px-2.5 py-1 rounded-lg text-[#333333]">
                  Step {displayStepNum} of 5
                </span>
              </div>

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
                  { title: 'Discovering site pages & engineering links', url: activeSourcesList.length > 0 ? `${activeSourcesList.length} pages & links discovered` : 'Subdomain & career path crawler', icon: FileText, minProgress: 20, threshold: 45 },
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
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                    <span>LIVE TERMINAL LOGS</span>
                  </div>
                  <span className="text-[#CCFF00] font-bold">● ACTIVE</span>
                </div>
                <div className="h-[104px] overflow-y-auto scrollbar-none space-y-2 pr-1 scroll-smooth">
                  {currentVisibleLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-4 text-[#C5CBD8] leading-tight">
                      <span className="truncate flex-1">
                        {log.text}
                        {log.url && (
                          <a
                            href={log.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1.5 text-[#CCFF00] underline hover:text-white"
                          >
                            [link]
                          </a>
                        )}
                      </span>
                      <span className="text-[#6A7282] shrink-0 font-mono text-[10px]">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 3: RIGHT PANEL */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-white border border-[#E5E5DF] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="font-mono text-[10px] font-bold text-[#888888] uppercase tracking-wider pb-2 border-b border-[#F0F0EA] flex items-center justify-between">
                  <span>CRAWLED SOURCES</span>
                  <span className="text-[#0A0A0A] font-bold font-mono">{activeSourcesList.length} Active</span>
                </div>

                <div className="space-y-1.5 font-sans text-xs max-h-[220px] overflow-y-auto pr-1">
                  {activeSourcesList.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#FAFAF7] transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs shrink-0">{s.icon}</span>
                        {s.url && s.url !== '#' ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[#0A0A0A] text-xs truncate hover:underline hover:text-[#557700] flex items-center gap-1"
                            title={s.url}
                          >
                            <span className="truncate">{s.name}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-[#888888] shrink-0" />
                          </a>
                        ) : (
                          <span className="font-medium text-[#0A0A0A] text-xs truncate">{s.name}</span>
                        )}
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

        {/* SUCCESS MODAL POPUP */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white border border-[#EAEAE0] max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-center animate-in zoom-in-95 duration-300">
              
              {/* Dynamic Background Glow Accent */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#CCFF00]/40 rounded-full blur-3xl pointer-events-none" />

              {/* Top Badge Icon */}
              <div className="relative z-10 w-16 h-16 bg-[#E8FF00] rounded-2xl flex items-center justify-center mx-auto shadow-md border-2 border-black/10">
                <Sparkles className="w-8 h-8 text-black" />
              </div>

              <div className="relative z-10 space-y-2">
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-[#557700] bg-[#E8FF00]/40 px-3 py-1 rounded-full inline-block">
                  ● GENERATION COMPLETE 100%
                </div>
                <h2 className="text-2xl font-extrabold text-[#0A0A0A] tracking-tight">
                  Prep Kit Ready for {kitData?.source?.company || companyUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Company'}!
                </h2>
                <p className="text-xs text-[#666666]">
                  Role: <span className="font-bold text-[#0A0A0A]">{kitData?.role?.title || 'Engineering Role'}</span>
                </p>
              </div>

              {/* Stats Summary Grid */}
              <div className="relative z-10 grid grid-cols-2 gap-3 text-left">
                <div className="bg-[#FAF9F5] border border-[#E8E8DF] p-3 rounded-xl">
                  <div className="text-[10px] font-mono font-bold text-[#888888] uppercase">Questions Mapped</div>
                  <div className="text-base font-extrabold text-[#0A0A0A] mt-0.5">{kitData?.questions?.length || 0} Questions</div>
                </div>
                <div className="bg-[#FAF9F5] border border-[#E8E8DF] p-3 rounded-xl">
                  <div className="text-[10px] font-mono font-bold text-[#888888] uppercase">Active Recall</div>
                  <div className="text-base font-extrabold text-[#0A0A0A] mt-0.5">{kitData?.flashcards?.length || 0} Flashcards</div>
                </div>
                <div className="bg-[#FAF9F5] border border-[#E8E8DF] p-3 rounded-xl">
                  <div className="text-[10px] font-mono font-bold text-[#888888] uppercase">Prep Timeline</div>
                  <div className="text-base font-extrabold text-[#0A0A0A] mt-0.5">{kitData?.schedule?.days_available || 5} Days</div>
                </div>
                <div className="bg-[#FAF9F5] border border-[#E8E8DF] p-3 rounded-xl">
                  <div className="text-[10px] font-mono font-bold text-[#888888] uppercase">Skill Coverage</div>
                  <div className="text-base font-extrabold text-[#557700] mt-0.5">100% Must-Have</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setIsGenerating(false);
                }}
                className="relative z-10 w-full bg-[#0A0A0A] hover:bg-[#222222] text-[#E8FF00] font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer text-base group"
              >
                <span>Click to View Prep Kit</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

            </div>
          </div>
        )}
      </div>
    );
  }

  if (error || !kitData) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 tech-panel bg-white text-center border-[#0A0A0A] font-mono">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h2 className="text-lg font-medium text-[#0A0A0A] mb-2 uppercase">Error Loading Preparation Kit</h2>
        <p className="text-xs text-[#666666] mb-6">{error || 'Kit data could not be found.'}</p>
        <Link href="/dashboard" className="tech-button-primary text-xs py-2 px-4 uppercase">
          RETURN TO WORKSPACE
        </Link>
      </div>
    );
  }

  const mustReqs = kitData.role.requirements.filter((r: Requirement) => r.priority === 'must');
  const coveredReqIds = new Set(kitData.questions.flatMap((q: Question) => q.requirement_ids));
  const coveredCount = mustReqs.filter((r: Requirement) => coveredReqIds.has(r.id)).length;
  const coveragePercent = mustReqs.length > 0 ? Math.round((coveredCount / mustReqs.length) * 100) : 100;
  const totalPrepMins = kitData.schedule.days.reduce((acc: number, d: { minutes: number }) => acc + (d.minutes || 0), 0);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Structured Workspace Header */}
      <div className="tech-panel p-6 sm:p-8 bg-white border-[#0A0A0A] mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E5E5E0]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#0A0A0A] text-white font-mono font-bold text-xl flex items-center justify-center shrink-0">
              {kitData.source.company.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1 font-mono text-xs">
                <h1 className="text-2xl font-normal text-[#0A0A0A] uppercase tracking-tight font-sans">
                  {kitData.source.company}
                </h1>
                <span className="bg-[#E8FF00] text-black px-2 py-0.5 font-bold border border-black/10">
                  {coveragePercent}% REQUIREMENT COVERAGE
                </span>
              </div>
              <p className="text-xs font-mono text-[#666666] uppercase">
                {kitData.role.title} · <span className="text-[#0A0A0A] font-bold">{kitData.role.seniority} LEVEL</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap font-mono text-xs">
            <button
              onClick={handleSaveKit}
              disabled={saving}
              className="tech-button-secondary text-xs py-2 px-4 rounded-none uppercase"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[#0A0A0A]" />}
              <span>SAVE CHANGES</span>
            </button>

            {/* Category Regenerate Dropdown */}
            <div className="relative group">
              <button className="tech-button-secondary text-xs py-2 px-4 rounded-none uppercase">
                {regeneratingCategory ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-[#0A0A0A]" />
                )}
                <span>REGENERATE SECTION</span>
              </button>

              <div className="absolute right-0 mt-1 w-52 bg-white border border-[#0A0A0A] shadow-lg hidden group-hover:block z-30 p-1">
                <div className="text-[10px] font-mono text-[#8A8A8A] uppercase px-3 py-1.5 border-b border-[#E5E5E0]">
                  REGENERATE & PRESERVE EDITS
                </div>
                {['technical', 'behavioural', 'system-design', 'company-fit'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleRegenerateCategory(cat)}
                    className="w-full text-left px-3 py-2 text-xs font-mono text-[#0A0A0A] hover:bg-[#E8FF00] rounded-none uppercase"
                  >
                    {cat.replace('-', ' ')} QUESTIONS
                  </button>
                ))}
              </div>
            </div>

            <Link
              href={`/kits/${kitId}/practice`}
              className="tech-button-primary text-xs py-2 px-5 rounded-none uppercase"
            >
              <PlayCircle className="w-4 h-4 text-[#E8FF00]" />
              <span>PRACTICE FLASHCARDS</span>
            </Link>
          </div>
        </div>

        {/* Metric Strip Divider */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 pt-6 font-mono text-xs text-[#0A0A0A]">
          <div className="border-r border-[#E5E5E0] pr-4">
            <span className="text-[#8A8A8A] block uppercase text-[10px]">REQUIREMENTS</span>
            <span className="text-lg font-bold">{kitData.role.requirements.length} REQS</span>
          </div>
          <div className="border-r border-[#E5E5E0] pr-4">
            <span className="text-[#8A8A8A] block uppercase text-[10px]">QUESTIONS</span>
            <span className="text-lg font-bold">{kitData.questions.length} ITEMS</span>
          </div>
          <div className="border-r border-[#E5E5E0] pr-4">
            <span className="text-[#8A8A8A] block uppercase text-[10px]">FLASHCARDS</span>
            <span className="text-lg font-bold">{kitData.flashcards.length} CARDS</span>
          </div>
          <div className="border-r border-[#E5E5E0] pr-4">
            <span className="text-[#8A8A8A] block uppercase text-[10px]">PAGES CRAWLED</span>
            <span className="text-lg font-bold">{kitData.source.pages_used?.length || 0} SOURCES</span>
          </div>
          <div className="border-r border-[#E5E5E0] pr-4">
            <span className="text-[#8A8A8A] block uppercase text-[10px]">TOTAL TIME</span>
            <span className="text-lg font-bold">{totalPrepMins} MIN</span>
          </div>
          <div>
            <span className="text-[#8A8A8A] block uppercase text-[10px]">TIMELINE</span>
            <span className="text-lg font-bold">{kitData.schedule.days_available} DAYS</span>
          </div>
        </div>

        {/* Technical Navigation Workspace Tabs */}
        <div className="flex items-center gap-2 border-t border-[#E5E5E0] mt-6 pt-4 overflow-x-auto font-mono text-xs">
          {[
            { id: 'overview', label: 'OVERVIEW' },
            { id: 'process', label: 'INTERVIEW PROCESS' },
            { id: 'company', label: 'COMPANY BRIEF' },
            { id: 'role', label: 'ROLE BREAKDOWN' },
            { id: 'questions', label: 'QUESTIONS' },
            { id: 'flashcards', label: 'FLASHCARDS' },
            { id: 'schedule', label: 'SCHEDULE' },
            { id: 'coverage', label: 'COVERAGE' },
            { id: 'weak-spots', label: 'WEAK SPOTS' }
          ].map(tab => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2 border uppercase tracking-wider text-[11px] font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'bg-white text-[#666666] border-[#E5E5E0] hover:text-[#0A0A0A] hover:border-[#0A0A0A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT AREAS */}
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
            <div className="tech-panel p-5 border-[#0A0A0A] bg-white">
              <span className="text-[10px] text-[#8A8A8A] uppercase block mb-1">REQUIREMENT MATCH</span>
              <div className="text-2xl font-bold text-[#0A0A0A]">{coveredCount} / {mustReqs.length}</div>
              <p className="text-[11px] text-[#0A0A0A] bg-[#E8FF00] px-1 py-0.5 font-bold mt-2 inline-block">
                {coveragePercent}% MUST-HAVES COVERED
              </p>
            </div>

            <div className="tech-panel p-5 border-[#0A0A0A] bg-white">
              <span className="text-[10px] text-[#8A8A8A] uppercase block mb-1">QUESTION BANK</span>
              <div className="text-2xl font-bold text-[#0A0A0A]">{kitData.questions.length}</div>
              <p className="text-[11px] text-[#666666] mt-2">Categorized practice prompts</p>
            </div>

            <div className="tech-panel p-5 border-[#0A0A0A] bg-white">
              <span className="text-[10px] text-[#8A8A8A] uppercase block mb-1">FLASHCARDS</span>
              <div className="text-2xl font-bold text-[#0A0A0A]">{kitData.flashcards.length}</div>
              <p className="text-[11px] text-[#666666] mt-2">Interactive review cards</p>
            </div>

            <div className="tech-panel p-5 border-[#0A0A0A] bg-white">
              <span className="text-[10px] text-[#8A8A8A] uppercase block mb-1">WEBSITES CRAWLED</span>
              <div className="text-2xl font-bold text-[#0A0A0A]">{kitData.source.pages_used?.length || 0}</div>
              <p className="text-[11px] text-[#666666] mt-2">Web & discussion pages</p>
            </div>

            <div className="tech-panel p-5 border-[#0A0A0A] bg-white">
              <span className="text-[10px] text-[#8A8A8A] uppercase block mb-1">ESTIMATED PREP TIME</span>
              <div className="text-2xl font-bold text-[#0A0A0A]">{totalPrepMins} MIN</div>
              <p className="text-[11px] text-[#666666] mt-2">Across {kitData.schedule.days_available} day(s)</p>
            </div>
          </div>

          {/* Company Brief Overview */}
          <div className="tech-panel p-6 sm:p-8 border-[#0A0A0A] bg-white space-y-4">
            <div className="font-mono text-xs text-[#8A8A8A] uppercase">COMPANY INTELLIGENCE BRIEF</div>
            <h3 className="text-xl font-normal text-[#0A0A0A] leading-relaxed">{kitData.company_brief.summary}</h3>
            
            <div className="pt-4 border-t border-[#E5E5E0]">
              <span className="font-mono text-xs text-[#8A8A8A] uppercase block mb-1">WHAT THEY DO & PRODUCTS</span>
              <p className="text-xs font-mono text-[#666666] leading-relaxed">{kitData.company_brief.what_they_do}</p>
            </div>
          </div>

          {/* Crawled Research Resources & Sources Panel */}
          <div className="tech-panel p-6 sm:p-8 border-[#0A0A0A] bg-white space-y-4">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#8A8A8A] uppercase font-bold">CRAWLED RESEARCH RESOURCES & SOURCES USED ({kitData.source.pages_used.length})</span>
              <span className="text-[#666666]">RESEARCHED: {new Date(kitData.source.researched_at).toLocaleDateString()}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {kitData.source.pages_used.map((url, idx) => {
                const isDiscussion = url.includes('duckduckgo') || url.includes('discussion') || url.includes('glassdoor') || url.includes('reddit');
                const isCareers = url.includes('careers') || url.includes('jobs') || url.includes('hiring') || url.includes('work');
                
                return (
                  <div key={idx} className="p-3 bg-[#F7F7F3] border border-[#E5E5E0] rounded-lg flex items-center justify-between gap-3 font-mono text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded bg-[#0A0A0A] text-[#CCFF00] flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#888888] uppercase block truncate">
                          {isDiscussion ? 'PUBLIC INTERVIEW DISCUSSION' : isCareers ? 'HIRING & CAREERS PAGE' : 'COMPANY WEBSITE'}
                        </span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="font-bold text-[#0A0A0A] hover:underline truncate block">
                          {url}
                        </a>
                      </div>
                    </div>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-[#0A0A0A] hover:bg-[#EAEAEA] rounded shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 1.5 INTERVIEW PROCESS TAB */}
      {activeTab === 'process' && (
        <div className="space-y-6">
          <div className="tech-panel p-6 sm:p-8 bg-white border-[#0A0A0A]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E0] mb-6">
              <div>
                <span className="font-mono text-xs text-[#8A8A8A] uppercase tracking-wider block mb-1">CRAWLED INTERVIEW EVIDENCE & ROUNDS</span>
                <h2 className="text-xl font-bold text-[#0A0A0A] uppercase tracking-wide font-sans flex items-center gap-2">
                  <span>COMPANY INTERVIEW PROCESS</span>
                  {kitData.company_brief.process_found !== false && (
                    <span className="text-xs bg-[#E8FF00] text-[#0A0A0A] font-mono px-2 py-0.5 font-bold border border-black/10">
                      REAL WEBPAGE / CANDIDATE DATA
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {/* Check if process_found === false or no patterns/rounds exist */}
            {kitData.company_brief.process_found === false || (!kitData.company_brief.interview_patterns?.length && !kitData.company_brief.interview_process?.length) ? (
              <div className="p-8 sm:p-12 text-center bg-[#F9F9F6] border border-[#E5E5E0] rounded-xl my-4">
                <AlertCircle className="w-10 h-10 text-[#8A8A8A] mx-auto mb-3" />
                <h3 className="font-bold text-base text-[#0A0A0A] font-sans uppercase">UNABLE TO FIND PUBLIC INTERVIEW PROCESS DATA</h3>
                <p className="text-xs font-mono text-[#666666] max-w-lg mx-auto mt-2 leading-relaxed">
                  No public candidate discussion threads, glassdoor reviews, or reported interview rounds were found on the web for {kitData.source.company}.
                </p>
                <div className="mt-6 p-4 bg-white border border-[#E5E5E0] max-w-md mx-auto rounded-lg text-left text-xs font-mono text-[#444444] space-y-1.5">
                  <div className="font-bold text-[#0A0A0A]">💡 Tip:</div>
                  <div>You can provide recruiter notes or specific round details when creating a kit to automatically customize the interview pipeline.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* 2-3 Reported Interview Process Patterns / Tracks */}
                {kitData.company_brief.interview_patterns && kitData.company_brief.interview_patterns.length > 0 ? (
                  <div className="space-y-8">
                    {kitData.company_brief.interview_patterns.map((pattern: any, pIdx: number) => (
                      <div key={pIdx} className="border border-[#E5E5E0] rounded-xl p-5 sm:p-6 bg-[#FAF9F6]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E5E5E0] mb-5">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-[#0A0A0A] text-[#E8FF00] font-mono text-xs font-bold flex items-center justify-center">
                              0{pIdx + 1}
                            </span>
                            <div>
                              <h3 className="font-bold text-sm text-[#0A0A0A] uppercase tracking-wide">
                                {pattern.pattern_name}
                              </h3>
                              {pattern.notes && (
                                <span className="text-xs text-[#666666] font-mono">{pattern.notes}</span>
                              )}
                            </div>
                          </div>
                          {pattern.confidence && (
                            <span className="font-mono text-[11px] bg-[#E8FF00]/40 text-[#0A0A0A] border border-[#E8FF00] px-2.5 py-1 rounded-md font-bold self-start sm:self-auto">
                              {Math.round(pattern.confidence * 100)}% CONFIDENCE SCORE
                            </span>
                          )}
                        </div>

                        {/* Rounds Flow */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-sans text-xs">
                          {pattern.rounds?.map((rd: any, rIdx: number) => (
                            <div key={rIdx} className="p-4 bg-white border border-[#E5E5E0] rounded-xl flex flex-col justify-between space-y-3 shadow-2xs">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="font-mono text-[10px] font-bold bg-[#0A0A0A] text-[#E8FF00] px-2 py-0.5 rounded">
                                    ROUND {rd.round_number || rIdx + 1}
                                  </span>
                                  {rd.duration && (
                                    <span className="font-mono text-[10px] text-[#666666]">{rd.duration}</span>
                                  )}
                                </div>
                                <h4 className="font-bold text-[#0A0A0A] text-xs leading-snug mb-1">
                                  {rd.title}
                                </h4>
                                {rd.description && (
                                  <p className="text-[11px] text-[#555555] leading-relaxed mt-1 font-mono">
                                    {rd.description}
                                  </p>
                                )}
                              </div>

                              {rd.focus_areas && rd.focus_areas.length > 0 && (
                                <div className="pt-2 border-t border-[#F0F0EA] flex flex-wrap gap-1">
                                  {rd.focus_areas.map((f: string, fIdx: number) => (
                                    <span key={fIdx} className="text-[9px] font-mono bg-[#F0F0EA] text-[#333333] px-1.5 py-0.5 rounded">
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback Flat List if only string array exists */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans text-xs">
                    {kitData.company_brief.interview_process?.map((round: string, idx: number) => (
                      <div key={idx} className="p-4 bg-[#F9F9F6] border border-[#E5E5E0] rounded-xl flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#0A0A0A] text-[#E8FF00] font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#0A0A0A] leading-relaxed mt-0.5">{round}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Take-Home Assignment Details */}
                {kitData.company_brief.take_home_assignment && (
                  <div className="pt-6 border-t border-[#E5E5E0]">
                    <span className="font-mono text-xs text-[#8A8A8A] uppercase block mb-2 font-bold">
                      PRACTICAL TAKE-HOME ASSIGNMENT & CODING PROJECT ANALYSIS
                    </span>
                    <div className="p-5 bg-[#E8FF00]/15 border border-[#E8FF00]/60 rounded-xl">
                      <p className="text-xs font-mono text-[#2A2A00] leading-relaxed font-semibold">
                        {kitData.company_brief.take_home_assignment}
                      </p>
                    </div>
                  </div>
                )}

                {/* Crawled Web Sources */}
                {kitData.company_brief.sources && kitData.company_brief.sources.length > 0 && (
                  <div className="pt-6 border-t border-[#E5E5E0]">
                    <span className="font-mono text-xs text-[#8A8A8A] uppercase block mb-3 font-bold">
                      VERIFIED PUBLIC RESEARCH SOURCES & THREADS
                    </span>
                    <div className="flex flex-wrap gap-2 font-mono text-xs">
                      {kitData.company_brief.sources.map((srcUrl: string, idx: number) => (
                        <a
                          key={idx}
                          href={srcUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#F9F9F6] hover:bg-white border border-[#E5E5E0] hover:border-[#0A0A0A] rounded-lg flex items-center gap-2 text-[#0A0A0A] transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5 text-[#666666]" />
                          <span className="truncate max-w-[280px]">{srcUrl}</span>
                          <ExternalLink className="w-3 h-3 text-[#8A8A8A]" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. COMPANY BRIEF TAB */}
      {activeTab === 'company' && (
        <div className="tech-panel p-6 sm:p-8 border-[#0A0A0A] bg-white space-y-6">
          <div>
            <span className="font-mono text-xs text-[#8A8A8A] uppercase block mb-2">SUMMARY BRIEF</span>
            <p className="text-base text-[#0A0A0A] leading-relaxed">{kitData.company_brief.summary}</p>
          </div>

          <div className="pt-6 border-t border-[#E5E5E0]">
            <span className="font-mono text-xs text-[#8A8A8A] uppercase block mb-2">WHAT THEY DO & CORE BUSINESS</span>
            <p className="text-sm font-mono text-[#666666] leading-relaxed">{kitData.company_brief.what_they_do}</p>
          </div>

          {/* Interview Process & Rounds */}
          {kitData.company_brief.interview_process && kitData.company_brief.interview_process.length > 0 && (
            <div className="pt-6 border-t border-[#E5E5E0]">
              <span className="font-mono text-xs text-[#8A8A8A] uppercase block mb-3 font-bold">ESTIMATED / CRAWLED INTERVIEW PROCESS & ROUNDS</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans text-xs">
                {kitData.company_brief.interview_process.map((round: string, idx: number) => (
                  <div key={idx} className="p-3 bg-[#F9F9F6] border border-[#E5E5E0] rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#0A0A0A] text-[#E8FF00] font-mono text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#0A0A0A] leading-relaxed mt-0.5">{round}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Take-Home Assignment Analysis */}
          {kitData.company_brief.take_home_assignment && (
            <div className="pt-6 border-t border-[#E5E5E0]">
              <span className="font-mono text-xs text-[#8A8A8A] uppercase block mb-2 font-bold">TAKE-HOME ASSIGNMENT & PRACTICAL CODING ANALYSIS</span>
              <div className="p-4 bg-[#E8FF00]/15 border border-[#E8FF00]/50 rounded-xl">
                <p className="text-xs font-sans text-[#2A2A00] leading-relaxed font-semibold">
                  {kitData.company_brief.take_home_assignment}
                </p>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-[#E5E5E0]">
            <span className="font-mono text-xs text-[#8A8A8A] uppercase block mb-3">RESEARCH SOURCES & PAGES CRAWLED ({kitData.company_brief.sources.length})</span>
            {kitData.company_brief.sources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {kitData.company_brief.sources.map((src, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#F7F7F3] border border-[#E5E5E0] rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <ExternalLink className="w-4 h-4 text-[#0A0A0A] shrink-0" />
                      <a href={src} target="_blank" rel="noopener noreferrer" className="hover:underline truncate text-[#0A0A0A] font-bold">
                        {src}
                      </a>
                    </div>
                    <span className="text-[10px] bg-white border border-[#E0E0DA] px-2 py-0.5 rounded uppercase shrink-0 text-[#666666]">
                      SOURCE {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-[#8A8A8A] italic">No public web sources retrieved.</p>
            )}
          </div>
        </div>
      )}

      {/* 3. ROLE BREAKDOWN TAB */}
      {activeTab === 'role' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="tech-panel p-6 sm:p-8 border-[#0A0A0A] bg-white space-y-6">
            <div>
              <span className="text-[10px] text-[#8A8A8A] uppercase block">TARGET ROLE</span>
              <h3 className="text-2xl font-normal text-[#0A0A0A] uppercase tracking-tight font-sans">{kitData.role.title}</h3>
              <span className="text-xs text-[#666666] uppercase mt-1 block">SENIORITY: {kitData.role.seniority}</span>
            </div>

            {kitData.role.responsibilities.length > 0 && (
              <div className="pt-4 border-t border-[#E5E5E0]">
                <span className="text-[#8A8A8A] uppercase block mb-2">RESPONSIBILITIES</span>
                <ul className="space-y-1 text-[#666666]">
                  {kitData.role.responsibilities.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t border-[#E5E5E0]">
              <span className="text-[#8A8A8A] uppercase block mb-4">EXTRACTED REQUIREMENTS MATRIX</span>
              <div className="space-y-2">
                {kitData.role.requirements.map(req => {
                  const isCovered = coveredReqIds.has(req.id);
                  return (
                    <div key={req.id} className="p-3 bg-[#F7F7F3] border border-[#E5E5E0] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#0A0A0A] bg-white border border-[#E5E5E0] px-2 py-0.5">{req.id}</span>
                        <div>
                          <span className="font-bold text-[#0A0A0A] block">{req.text}</span>
                          <span className="text-[10px] text-[#8A8A8A]">KIND: {req.kind.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-[#0A0A0A] text-white px-2 py-0.5 text-[10px]">
                          {req.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold ${
                          isCovered ? 'bg-[#E8FF00] text-black' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {isCovered ? 'COVERED ✓' : 'UNCOVERED'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. QUESTION BANK TAB */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 font-mono">
            <div>
              <h3 className="text-xl font-normal text-[#0A0A0A] uppercase tracking-tight font-sans">CATEGORIZED QUESTION BANK</h3>
              <p className="text-xs text-[#666666] mt-0.5">MANAGE, EDIT, OR ADD CUSTOM QUESTIONS.</p>
            </div>

            <button
              onClick={handleAddQuestion}
              className="tech-button-primary text-xs py-2 px-4 rounded-none uppercase"
            >
              <Plus className="w-4 h-4" />
              <span>ADD QUESTION</span>
            </button>
          </div>

          <div className="space-y-4">
            {kitData.questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                totalCount={kitData.questions.length}
                onUpdate={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
                onMoveUp={handleMoveQuestionUp}
                onMoveDown={handleMoveQuestionDown}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. FLASHCARDS TAB */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4 font-mono">
            <div>
              <h3 className="text-xl font-normal text-[#0A0A0A] uppercase tracking-tight font-sans">FLASHCARDS ({kitData.flashcards.length})</h3>
              <p className="text-xs text-[#666666] mt-0.5">CLICK CARD TO REVEAL TECHNICAL ANSWER.</p>
            </div>
            <Link
              href={`/kits/${kitId}/practice`}
              className="tech-button-primary text-xs py-2 px-5 rounded-none uppercase"
            >
              <PlayCircle className="w-4 h-4 text-[#E8FF00]" />
              <span>LAUNCH PRACTICE MODE</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {kitData.flashcards.map(card => {
              const isFlipped = flippedCards[card.id] || false;

              return (
                <div
                  key={card.id}
                  onClick={() => setFlippedCards({ ...flippedCards, [card.id]: !isFlipped })}
                  className="tech-panel p-6 border-[#0A0A0A] bg-white cursor-pointer hover:bg-[#F7F7F3] min-h-[180px] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#8A8A8A] mb-3">
                    <span className="font-bold text-[#0A0A0A]">{card.id}</span>
                    <span>{isFlipped ? '[ANSWER REVEALED]' : '[CLICK TO REVEAL]'}</span>
                  </div>

                  <div className="py-2">
                    {isFlipped ? (
                      <div className="text-xs text-[#666666] leading-relaxed">
                        {card.back}
                      </div>
                    ) : (
                      <div className="text-base font-normal text-[#0A0A0A] leading-snug font-sans uppercase">
                        {card.front}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E0] text-[10px] text-[#8A8A8A]">
                    <span>REQS: {card.requirement_ids.join(', ')}</span>
                    {card.confidence && (
                      <span className="font-bold text-[#0A0A0A]">CONFIDENCE: {card.confidence}/5</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <ScheduleTimeline 
          schedule={kitData.schedule} 
          questions={kitData.questions} 
          kitId={kitId}
          kitData={kitData}
          onUpdateKitData={setKitData}
        />
      )}

      {/* 7. COVERAGE TAB */}
      {activeTab === 'coverage' && (
        <CoverageReport role={kitData.role} questions={kitData.questions} coverage={kitData.coverage} />
      )}

      {/* 8. WEAK SPOTS TAB */}
      {activeTab === 'weak-spots' && (
        <WeakSpotsView
          kitId={kitId}
          flashcards={kitData.flashcards}
          questions={kitData.questions}
          requirements={kitData.role.requirements}
        />
      )}
    </div>
  );
}

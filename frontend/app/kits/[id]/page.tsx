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
  ArrowRight
} from 'lucide-react';

type TabType =
  | 'overview'
  | 'company'
  | 'role'
  | 'questions'
  | 'flashcards'
  | 'schedule'
  | 'coverage'
  | 'weak-spots';

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

  // Flashcard flip states for Flashcards tab
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (kitId) {
      fetchKit();
    }
  }, [kitId]);

  const fetchKit = async () => {
    try {
      setLoading(true);
      const res = await api.getKitById(kitId);
      if (res.data) {
        setKitData(res.data);
      } else if (res.status === 'failed') {
        setError(res.error?.message || 'Kit generation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load kit details.');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F7F7F3]">
        <div className="flex flex-col items-center gap-3 font-mono text-xs text-[#666666]">
          <Loader2 className="w-6 h-6 animate-spin text-[#0A0A0A]" />
          <p>LOADING PREPARATION WORKSPACE...</p>
        </div>
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

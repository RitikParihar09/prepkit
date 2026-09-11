'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { Plus, ArrowRight, Trash2, Loader2, Search, X, CheckCircle2, Filter } from 'lucide-react';

interface KitSummary {
  id: string;
  company: string;
  role: string;
  daysAvailable: number;
  status: string;
  stepMessage: string;
  progressPercent: number;
  coveragePercent: number;
  completedDaysCount?: number;
  totalDaysCount?: number;
  createdAt: string;
}

type FilterTab = 'all' | 'ready' | 'processing' | 'completed-schedule';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [kits, setKits] = useState<KitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterTab>('all');
  const [shortcutLabel, setShortcutLabel] = useState('⌘K');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect OS for shortcut label (⌘K on Mac, Ctrl+K on Windows)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform || '');
      setShortcutLabel(isMac ? '⌘K' : 'Ctrl+K');
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchKits();
    }
  }, [user, authLoading, router]);

  // Keyboard shortcut listener for ⌘K or Ctrl+K to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchKits = async () => {
    try {
      setLoading(true);
      const res = await api.getUserKits();
      setKits(res.kits);
    } catch (err: any) {
      setError(err.message || 'Failed to load interview kits.');
    } finally {
      setLoading(false);
    }
  };

  const [kitToDelete, setKitToDelete] = useState<{ id: string; company: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = (id: string, company: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setKitToDelete({ id, company });
  };

  const handleConfirmDelete = async () => {
    if (!kitToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteKit(kitToDelete.id);
      setKits(kits.filter(k => k.id !== kitToDelete.id));
      setKitToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete kit.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || (loading && kits.length === 0)) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans select-none">
        {/* Workspace Top Header Skeleton */}
        <div className="border-b border-[#E5E5E0] pb-6 mb-8 animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-36 h-3.5 bg-[#EAEAE5] rounded-xs"></div>
            <span className="text-[#E5E5E0]">|</span>
            <div className="w-56 h-3.5 bg-[#EAEAE5] rounded-xs"></div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="w-64 h-10 bg-[#E0E0DA] rounded-lg"></div>
            <div className="flex items-center gap-4">
              <div className="w-48 h-6 bg-[#EAEAE5] rounded-md"></div>
              <div className="w-32 h-10 bg-[#0A0A0A]/10 rounded-md"></div>
            </div>
          </div>
        </div>

        {/* 6 Skeleton Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-5 animate-pulse shadow-2xs"
            >
              {/* Header Skeleton */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EAEAE5] rounded-lg shrink-0"></div>
                  <div className="space-y-2">
                    <div className="w-28 h-4 bg-[#E0E0DA] rounded-sm"></div>
                    <div className="w-20 h-3 bg-[#EAEAE5] rounded-sm"></div>
                  </div>
                </div>
                <div className="w-6 h-6 bg-[#F0F0EC] rounded-md"></div>
              </div>

              {/* Details Strip Skeleton */}
              <div className="grid grid-cols-2 gap-3 py-4 border-y border-[#F0F0EC] font-mono text-xs">
                <div className="space-y-1.5">
                  <div className="w-12 h-2.5 bg-[#EAEAE5] rounded-xs"></div>
                  <div className="w-16 h-4 bg-[#E0E0DA] rounded-sm"></div>
                </div>
                <div className="space-y-1.5">
                  <div className="w-16 h-2.5 bg-[#EAEAE5] rounded-xs"></div>
                  <div className="w-20 h-5 bg-[#CCFF00]/40 rounded-sm"></div>
                </div>
              </div>

              {/* Footer Skeleton */}
              <div className="flex items-center justify-between pt-1">
                <div className="w-16 h-6 bg-[#EAEAE5] rounded-md"></div>
                <div className="w-20 h-4 bg-[#E0E0DA] rounded-sm"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const completedCount = kits.filter(k => k.status === 'completed').length;
  const generatingCount = kits.filter(k => k.status !== 'completed' && k.status !== 'failed').length;
  const scheduleCompletedCount = kits.filter(k => (k.completedDaysCount || 0) > 0 && (k.completedDaysCount === (k.totalDaysCount || k.daysAvailable))).length;

  // Filter kits based on search query and status tab
  const filteredKits = kits.filter(kit => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (kit.company && kit.company.toLowerCase().includes(q)) || (kit.role && kit.role.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'ready') return kit.status === 'completed';
    if (statusFilter === 'processing') return kit.status !== 'completed' && kit.status !== 'failed';
    if (statusFilter === 'completed-schedule') return (kit.completedDaysCount || 0) > 0 && (kit.completedDaysCount === (kit.totalDaysCount || kit.daysAvailable));

    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      
      {/* Workspace Top Header */}
      <div className="border-b border-[#E5E5E0] pb-6 mb-8">
        <div className="flex items-center gap-3 font-mono text-xs text-[#666666] tracking-widest uppercase mb-2">
          <span>INTERVIEW WORKSPACE</span>
          <span className="text-[#E5E5E0]">|</span>
          <span>ACTIVE PREPARATION ENVIRONMENTS</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal text-[#0A0A0A] tracking-tight uppercase">
              YOUR INTERVIEW KITS
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
            <div className="flex items-center gap-4 text-[#666666]">
              <span><strong className="text-[#0A0A0A]">{String(kits.length).padStart(2, '0')}</strong> TOTAL</span>
              <span>•</span>
              <span><strong className="text-[#0A0A0A]">{String(completedCount).padStart(2, '0')}</strong> READY</span>
              <span>•</span>
              <span><strong className="text-[#0A0A0A]">{String(generatingCount).padStart(2, '0')}</strong> PROCESSING</span>
            </div>

            <Link
              href="/kits/new"
              className="tech-button-primary text-xs py-2.5 px-4 rounded-none font-mono uppercase"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE KIT</span>
            </Link>
          </div>
        </div>

        {/* SEARCH BAR WITH KEYBOARD SHORTCUT & STATUS FILTER TABS */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-mono">
          
          {/* Search Input Box */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A8A8A]">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search by company or role title... (${shortcutLabel})`}
              className="w-full pl-10 pr-20 py-2.5 text-xs bg-white border border-[#E5E5E0] focus:border-[#0A0A0A] rounded-lg text-[#0A0A0A] placeholder-[#8A8A8A] transition-colors outline-none shadow-2xs font-mono"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#8A8A8A] hover:text-[#0A0A0A] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#777777] bg-[#F4F4F0] border border-[#D5D5D0] rounded">
                {shortcutLabel}
              </kbd>
            </div>
          </div>

          {/* Filter Status Flags / Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 uppercase text-[11px] font-bold rounded-lg border transition-all ${
                statusFilter === 'all'
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                  : 'bg-white text-[#666666] border-[#E5E5E0] hover:border-[#0A0A0A]'
              }`}
            >
              ALL ({kits.length})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-2 uppercase text-[11px] font-bold rounded-lg border transition-all ${
                statusFilter === 'ready'
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                  : 'bg-white text-[#666666] border-[#E5E5E0] hover:border-[#0A0A0A]'
              }`}
            >
              READY ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-3 py-2 uppercase text-[11px] font-bold rounded-lg border transition-all ${
                statusFilter === 'processing'
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                  : 'bg-white text-[#666666] border-[#E5E5E0] hover:border-[#0A0A0A]'
              }`}
            >
              PROCESSING ({generatingCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed-schedule')}
              className={`px-3 py-2 uppercase text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                statusFilter === 'completed-schedule'
                  ? 'bg-[#E8FF00] text-black border-[#0A0A0A]'
                  : 'bg-white text-[#666666] border-[#E5E5E0] hover:border-[#0A0A0A]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PRACTICE COMPLETED ({scheduleCompletedCount})</span>
            </button>
          </div>

        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-mono">
          [ERROR] {error}
        </div>
      )}

      {/* Empty State */}
      {kits.length === 0 ? (
        <div className="tech-panel p-16 text-center max-w-xl mx-auto my-12 border-[#0A0A0A] bg-white rounded-xl">
          <div className="font-mono text-xs text-[#8A8A8A] uppercase mb-2">[0 KITS FOUND]</div>
          <h2 className="text-xl font-medium text-[#0A0A0A] uppercase mb-3">No interview kits generated yet</h2>
          <p className="text-xs text-[#666666] mb-8 leading-relaxed max-w-md mx-auto font-mono">
            Paste a job description and company URL to initialize your first autonomous preparation kit.
          </p>
          <Link
            href="/kits/new"
            className="tech-button-primary inline-flex py-3 px-6 text-xs font-mono uppercase"
          >
            <span>CREATE FIRST PREP KIT</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : filteredKits.length === 0 ? (
        <div className="tech-panel p-12 text-center max-w-md mx-auto my-12 border-[#E5E5E0] bg-white rounded-xl font-mono text-xs space-y-3">
          <div className="text-[#8A8A8A] uppercase">[ NO MATCHES FOUND ]</div>
          <p className="text-[#666666]">
            No interview kits matched your search <strong className="text-[#0A0A0A]">"{searchQuery}"</strong>
            {statusFilter !== 'all' && <span> under <strong className="uppercase">{statusFilter}</strong> filter</span>}.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
            className="text-xs text-[#0A0A0A] underline hover:no-underline font-bold uppercase pt-2"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Responsive Grid Card Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKits.map(kit => {
            const isScheduleDone = (kit.completedDaysCount || 0) > 0 && (kit.completedDaysCount === (kit.totalDaysCount || kit.daysAvailable));
            return (
              <div
                key={kit.id}
                onClick={() => router.push(`/kits/${kit.id}`)}
                className="bg-white border border-[#E5E5E0] hover:border-[#0A0A0A] rounded-xl p-6 transition-all duration-200 hover:shadow-xl cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Card Header: Initial, Company, Role & Delete Action */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-[#0A0A0A] text-white font-mono font-bold text-base rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                        {kit.company ? kit.company.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#0A0A0A] text-lg leading-tight group-hover:text-black transition-colors truncate" title={kit.company || 'Company'}>
                          {kit.company || 'Company'}
                        </h3>
                        <p className="text-xs text-[#666666] font-mono mt-0.5 truncate" title={kit.role || 'Role'}>
                          {kit.role || 'Role'}
                        </p>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={e => openDeleteModal(kit.id, kit.company || 'Interview Kit', e)}
                      className="p-1.5 text-[#AAAAAA] hover:text-[#0A0A0A] hover:bg-[#F4F4F0] rounded-md transition-colors shrink-0"
                      title="Delete Kit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Key Details Strip */}
                  <div className="grid grid-cols-2 gap-3 py-4 border-y border-[#F0F0EC] my-4 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-[#888888] uppercase block mb-1">TIMELINE</span>
                      <span className="font-bold text-[#0A0A0A]">{String(kit.daysAvailable).padStart(2, '0')} DAYS</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#888888] uppercase block mb-1">SCHEDULE PROGRESS</span>
                      <span className={`inline-block font-bold px-2 py-0.5 border rounded text-[11px] ${
                        isScheduleDone 
                          ? 'bg-[#E8FF00] text-black border-black/20' 
                          : 'bg-[#F4F4F0] text-[#0A0A0A] border-[#E0E0DA]'
                      }`}>
                        {kit.completedDaysCount || 0} / {kit.totalDaysCount || kit.daysAvailable} COMPLETED
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Footer: Status Badges/Flags & Open Arrow */}
                <div className="flex items-center justify-between pt-2 font-mono text-xs gap-2">
                  {/* Status & Completed Flags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-1 uppercase text-[10px] font-bold rounded border ${
                      kit.status === 'completed'
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                        : kit.status === 'failed'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-[#E8FF00] text-black border-[#E8FF00] animate-pulse'
                    }`}>
                      {kit.status === 'completed' ? 'READY' : kit.status === 'failed' ? 'FAILED' : 'PROCESSING'}
                    </span>

                    {/* Schedule Completed Flag */}
                    {isScheduleDone && (
                      <span className="bg-[#E8FF00] text-black text-[10px] font-bold px-2 py-1 rounded border border-black/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-black" />
                        <span>DONE</span>
                      </span>
                    )}
                  </div>

                  {/* CTA Action */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0A] shrink-0">
                    <span>OPEN KIT</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:-rotate-45" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION POPUP MODAL */}
      {kitToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-2xl p-7 max-w-[440px] w-full space-y-6 relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
            
            {/* Subtle Tech Grid Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
                `,
                backgroundSize: '32px 32px'
              }}
            ></div>

            {/* Header: Icon + Monospace Tag & Title */}
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] text-[#CCFF00] flex items-center justify-center shrink-0 border border-black/20 shadow-md">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[10px] text-[#777777] uppercase tracking-widest">[ DELETION CONFIRMATION ]</div>
                <h3 className="font-extrabold text-xl text-[#0A0A0A] tracking-tight">
                  Delete{' '}
                  <span className="relative inline-block">
                    Interview Kit
                    <span className="absolute -bottom-0.5 left-0 w-full h-[3px] bg-[#CCFF00]"></span>
                  </span>
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="relative z-10 text-xs sm:text-sm text-[#555555] leading-relaxed font-sans">
              Are you sure you want to delete the prep kit for <strong className="text-[#0A0A0A] font-bold">{kitToDelete.company}</strong>? All generated company research, questions, flashcards, and study plans will be permanently removed.
            </p>

            {/* Bottom Actions Row */}
            <div className="relative z-10 flex items-center justify-end gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setKitToDelete(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 font-semibold text-[#0A0A0A] bg-[#F4F4F0] hover:bg-[#EAEAEA] rounded-xl border border-[#E0E0DA] transition-all uppercase tracking-wider disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 font-semibold text-white bg-[#0A0A0A] hover:bg-[#222222] rounded-xl shadow-md transition-all flex items-center gap-2 uppercase tracking-wider disabled:opacity-50 border border-[#0A0A0A]"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#CCFF00]" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-[#CCFF00]" />
                    <span>Delete Kit</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

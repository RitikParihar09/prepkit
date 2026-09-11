'use client';

import React from 'react';
import Link from 'next/link';
import { Flashcard, Question, Requirement } from '@/types/kit';
import { PlayCircle, ArrowRight } from 'lucide-react';

interface WeakSpotsViewProps {
  kitId: string;
  flashcards: Flashcard[];
  questions: Question[];
  requirements: Requirement[];
}

export function WeakSpotsView({ kitId, flashcards, questions, requirements }: WeakSpotsViewProps) {
  const reqMap = new Map(requirements.map(r => [r.id, r]));

  // Group flashcard confidence ratings by requirement ID
  const reqConfidenceMap = new Map<string, { total: number; count: number }>();

  flashcards.forEach(fc => {
    const conf = fc.confidence || 3;
    fc.requirement_ids.forEach(reqId => {
      const existing = reqConfidenceMap.get(reqId) || { total: 0, count: 0 };
      reqConfidenceMap.set(reqId, {
        total: existing.total + conf,
        count: existing.count + 1
      });
    });
  });

  const scores = requirements.map(r => {
    const data = reqConfidenceMap.get(r.id);
    const avgConfidence = data && data.count > 0 ? Number((data.total / data.count).toFixed(1)) : 3.0;
    return {
      requirement: r,
      avgConfidence
    };
  });

  // Sort scores ascending (lowest confidence first)
  scores.sort((a, b) => a.avgConfidence - b.avgConfidence);

  const weakSpots = scores.filter(s => s.avgConfidence < 3.5);
  const strongSpots = scores.filter(s => s.avgConfidence >= 3.5);

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="tech-panel p-6 bg-white border-[#0A0A0A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-[#8A8A8A] uppercase block mb-1">COMMAND CENTER ANALYTICS</span>
          <h3 className="text-xl font-normal text-[#0A0A0A] font-sans uppercase">WEAK SPOTS & RISK MATRIX</h3>
          <p className="text-xs text-[#666666] mt-0.5">
            READINESS INSIGHTS COMPILED FROM DRILL SESSION CONFIDENCE SCORES
          </p>
        </div>

        <Link
          href={`/kits/${kitId}/practice`}
          className="tech-button-primary py-2 px-5 text-xs rounded-none uppercase"
        >
          <PlayCircle className="w-4 h-4 text-[#E8FF00]" />
          <span>LAUNCH PRACTICE DRILL</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* High Risk / Weak Spots Panel */}
        <div className="tech-panel p-6 bg-white border-[#0A0A0A]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E0] mb-4">
            <span className="font-bold text-[#0A0A0A] uppercase">WEAK SPOTS & HIGH RISK AREAS</span>
            <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5">
              {weakSpots.length} HIGH RISK
            </span>
          </div>

          {weakSpots.length === 0 ? (
            <div className="p-4 bg-[#E8FF00] text-black font-bold border border-black/10">
              [ALL TOPICS HIGH CONFIDENCE] NO HIGH-RISK WEAK SPOTS DETECTED (≥ 3.5 / 5.0).
            </div>
          ) : (
            <div className="space-y-2">
              {weakSpots.map(s => (
                <div key={s.requirement.id} className="p-3 bg-red-50/50 border border-red-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-[#0A0A0A] block">{s.requirement.text}</span>
                    <span className="text-[10px] text-[#8A8A8A] uppercase">KIND: {s.requirement.kind}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-red-700 text-sm block">{s.avgConfidence} / 5.0</span>
                    <span className="text-[9px] bg-red-100 text-red-800 px-1 py-0.5 font-bold uppercase">HIGH RISK</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strong Proficiency Areas Panel */}
        <div className="tech-panel p-6 bg-white border-[#0A0A0A]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E0] mb-4">
            <span className="font-bold text-[#0A0A0A] uppercase">STRONG PROFICIENCY AREAS</span>
            <span className="bg-[#E8FF00] text-black text-[10px] font-bold px-2 py-0.5">
              {strongSpots.length} HIGH PROFICIENCY
            </span>
          </div>

          {strongSpots.length === 0 ? (
            <p className="text-xs text-[#8A8A8A] italic p-4 bg-[#F7F7F3] border border-[#E5E5E0]">
              Complete more flashcard practice rounds to identify high proficiency topics.
            </p>
          ) : (
            <div className="space-y-2">
              {strongSpots.map(s => (
                <div key={s.requirement.id} className="p-3 bg-[#F7F7F3] border border-[#E5E5E0] flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-[#0A0A0A] block">{s.requirement.text}</span>
                    <span className="text-[10px] text-[#8A8A8A] uppercase">KIND: {s.requirement.kind}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-[#0A0A0A] text-sm block">{s.avgConfidence} / 5.0</span>
                    <span className="text-[9px] bg-[#E8FF00] text-black px-1 py-0.5 font-bold uppercase">OPTIMAL</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Priority Recommendations */}
      <div className="tech-panel-dark p-6 space-y-3">
        <span className="text-[10px] text-[#8A8A8A] uppercase tracking-widest block font-bold">
          RECOMMENDED NEXT PRACTICE PRIORITY
        </span>
        <ol className="space-y-2 text-xs">
          {scores.slice(0, 3).map((s, i) => (
            <li key={s.requirement.id} className="flex items-center justify-between border-b border-[#222222] pb-2">
              <span className="text-white font-medium pr-4">
                <strong className="text-[#E8FF00] mr-2">0{i + 1}.</strong> {s.requirement.text}
              </span>
              <span className="text-[#8A8A8A] shrink-0 font-bold">SCORE: {s.avgConfidence}/5.0</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

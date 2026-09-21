'use client';

import React from 'react';
import { Role, Question, Coverage } from '@/types/kit';

interface CoverageReportProps {
  role: Role;
  questions: Question[];
  coverage: Coverage;
}

export function CoverageReport({ role, questions, coverage }: CoverageReportProps) {
  const mustReqs = role.requirements.filter(r => r.priority === 'must');
  const coveredReqIds = new Set(questions.flatMap(q => q.requirement_ids));

  const coveredCount = mustReqs.filter(r => coveredReqIds.has(r.id)).length;
  const coveragePercent = mustReqs.length > 0 ? Math.round((coveredCount / mustReqs.length) * 100) : 100;

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Coverage Score Overview Banner */}
      <div className="tech-panel p-6 bg-white border-[#0A0A0A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[10px] text-[#8A8A8A] uppercase block mb-1">DETERMINISTIC VERIFICATION</span>
            <h3 className="text-xl font-normal text-[#0A0A0A] font-sans uppercase">REQUIREMENT COVERAGE REPORT</h3>
            <p className="text-xs text-[#666666] mt-0.5">
              PASSES COMPLETED: {coverage.passes} PASS(ES)
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#8A8A8A] uppercase block">MUST-HAVES COVERED</span>
            <span className="text-2xl font-bold bg-[#E8FF00] text-black px-2 py-0.5 border border-black/10 inline-block mt-1">
              {coveragePercent}% MATCH
            </span>
          </div>
        </div>

        {/* Technical Progress Bar */}
        <div className="w-full bg-[#F7F7F3] border border-[#E5E5E0] h-2 overflow-hidden">
          <div
            className={`h-2 transition-all duration-500 ${
              coveragePercent === 100 ? 'bg-[#E8FF00]' : 'bg-[#0A0A0A]'
            }`}
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
      </div>

      {/* Must Have Requirements Checklist */}
      <div className="tech-panel p-6 bg-white border-[#0A0A0A]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E0] mb-4">
          <span className="font-bold text-[#0A0A0A] uppercase">
            MUST-HAVE REQUIREMENTS ({coveredCount} / {mustReqs.length} COVERED)
          </span>
          {coveragePercent === 100 && (
            <span className="bg-[#E8FF00] text-black text-[10px] font-bold px-2 py-0.5 border border-black/10">
              100% MUST-HAVES VERIFIED ✓
            </span>
          )}
        </div>

        <div className="space-y-2">
          {mustReqs.map(req => {
            const isCovered = coveredReqIds.has(req.id);
            const matchingQuestions = questions.filter(q => q.requirement_ids.includes(req.id));

            return (
              <div
                key={req.id}
                className="p-3 bg-[#F7F7F3] border border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold text-[#0A0A0A] bg-white border border-[#E5E5E0] px-2 py-0.5">
                    {req.id}
                  </span>
                  <div>
                    <span className="font-bold text-[#0A0A0A] block">{req.text}</span>
                    <span className="text-[10px] text-[#8A8A8A] uppercase mt-0.5 block">
                      KIND: {req.kind.toUpperCase()} · PRIORITY: MUST
                    </span>
                  </div>
                </div>

                <div className="text-[11px] shrink-0">
                  {isCovered ? (
                    <span className="bg-[#0A0A0A] text-white px-2 py-0.5 uppercase">
                      COVERED BY {matchingQuestions.length} QUESTION(S)
                    </span>
                  ) : (
                    <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 uppercase font-bold">
                      UNCOVERED GAP
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

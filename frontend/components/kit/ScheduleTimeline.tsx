'use client';

import React from 'react';
import { Schedule, Question } from '@/types/kit';
import { Clock } from 'lucide-react';

interface ScheduleTimelineProps {
  schedule: Schedule;
  questions: Question[];
}

export function ScheduleTimeline({ schedule, questions }: ScheduleTimelineProps) {
  const questionMap = new Map(questions.map(q => [q.id, q]));

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Schedule Top Header */}
      <div className="tech-panel p-6 bg-white border-[#0A0A0A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-[#8A8A8A] uppercase block mb-1">ARITHMETIC TIME ALLOCATION</span>
          <h3 className="text-xl font-normal text-[#0A0A0A] font-sans uppercase">PREPARATION SCHEDULE</h3>
          <p className="text-xs text-[#666666] mt-0.5">
            DISTRIBUTED ACROSS {schedule.days_available} DAY(S) BASED ON TOPIC PRIORITY
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#8A8A8A] uppercase block">TOTAL ESTIMATED STUDY TIME</span>
          <span className="text-lg font-bold bg-[#E8FF00] text-black px-2 py-0.5 border border-black/10 inline-block mt-1">
            {schedule.days.reduce((acc, d) => acc + (d.minutes || 0), 0)} MIN TOTAL
          </span>
        </div>
      </div>

      {/* Vertical Technical Timeline */}
      <div className="relative border-l border-[#0A0A0A] ml-4 pl-6 space-y-6">
        {schedule.days.map(day => {
          const dayQuestions = day.question_ids
            .map(id => questionMap.get(id))
            .filter(Boolean) as Question[];

          return (
            <div key={day.day} className="relative">
              {/* Timeline Technical Node */}
              <div className="absolute -left-[31px] top-1.5 w-5 h-5 bg-[#0A0A0A] text-white flex items-center justify-center text-[10px] font-bold">
                {day.day}
              </div>

              <div className="tech-panel p-5 bg-white border-[#0A0A0A]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-[#E5E5E0]">
                  <div>
                    <span className="text-[10px] text-[#8A8A8A] uppercase block">
                      DAY {String(day.day).padStart(2, '0')}
                    </span>
                    <h4 className="text-base font-normal text-[#0A0A0A] font-sans uppercase tracking-tight">{day.focus}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F7F3] border border-[#E5E5E0] text-[#0A0A0A] text-xs font-bold w-fit">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{day.minutes} MIN ALLOCATED</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] text-[#8A8A8A] uppercase mb-2">
                    TARGET QUESTIONS ({dayQuestions.length})
                  </div>
                  {dayQuestions.length > 0 ? (
                    dayQuestions.map(q => (
                      <div key={q.id} className="p-2.5 bg-[#F7F7F3] border border-[#E5E5E0] flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[#0A0A0A] font-mono">{q.id}:</span>
                          <span className="text-[#0A0A0A] font-sans text-xs">{q.prompt}</span>
                        </div>
                        <span className="bg-[#0A0A0A] text-white px-1.5 py-0.5 text-[9px] uppercase shrink-0">
                          {q.category}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#8A8A8A] italic">Review & mock practice session</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Schedule, Question, KitData } from '@/types/kit';
import { Clock, Check, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ScheduleTimelineProps {
  schedule: Schedule;
  questions: Question[];
  kitId?: string;
  kitData?: KitData;
  onUpdateKitData?: (updatedData: KitData) => void;
}

export function ScheduleTimeline({ schedule, questions, kitId, kitData, onUpdateKitData }: ScheduleTimelineProps) {
  const questionMap = new Map(questions.map(q => [q.id, q]));
  
  // Initialize completed days from schedule data
  const [completedDays, setCompletedDays] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    schedule.days.forEach(day => {
      if (day.isCompleted) {
        initial[day.day] = true;
      }
    });
    return initial;
  });

  useEffect(() => {
    const updated: Record<number, boolean> = {};
    schedule.days.forEach(day => {
      if (day.isCompleted) {
        updated[day.day] = true;
      }
    });
    setCompletedDays(updated);
  }, [schedule]);

  const toggleDayComplete = async (dayNumber: number) => {
    const nextState = !completedDays[dayNumber];
    
    // Local Optimistic Update
    const newCompletedDays = {
      ...completedDays,
      [dayNumber]: nextState
    };
    setCompletedDays(newCompletedDays);

    // If kitId and full kitData exist, persist to backend DB
    if (kitId && kitData) {
      try {
        const updatedDays = kitData.schedule.days.map(d => {
          if (d.day === dayNumber) {
            return { ...d, isCompleted: nextState };
          }
          return d;
        });

        const updatedKitData: KitData = {
          ...kitData,
          schedule: {
            ...kitData.schedule,
            days: updatedDays
          }
        };

        if (onUpdateKitData) {
          onUpdateKitData(updatedKitData);
        }

        await api.updateKitData(kitId, updatedKitData);
      } catch (err) {
        console.warn('Failed to save day completion to backend:', err);
      }
    }
  };

  const completedCount = Object.values(completedDays).filter(Boolean).length;

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
        <div className="flex items-center gap-4 text-right">
          <div className="bg-[#F7F7F3] border border-[#0A0A0A] p-2.5 text-center min-w-[110px]">
            <span className="text-[9px] text-[#777777] uppercase block font-bold">DAY PROGRESS</span>
            <span className="text-sm font-bold text-[#0A0A0A]">
              {completedCount} / {schedule.days.length} COMPLETED
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#8A8A8A] uppercase block">TOTAL ESTIMATED STUDY TIME</span>
            <span className="text-lg font-bold bg-[#E8FF00] text-black px-2 py-0.5 border border-black/10 inline-block mt-1">
              {schedule.days.reduce((acc, d) => acc + (d.minutes || 0), 0)} MIN TOTAL
            </span>
          </div>
        </div>
      </div>

      {/* Vertical Technical Timeline with Perfectly Centered Node Square */}
      <div className="relative border-l-2 border-[#0A0A0A] ml-6 pl-8 space-y-6">
        {schedule.days.map(day => {
          const isCompleted = !!completedDays[day.day];
          const dayQuestions = day.question_ids
            .map(id => questionMap.get(id))
            .filter(Boolean) as Question[];

          return (
            <div key={day.day} className="relative">
              {/* Timeline Technical Node - PERFECTLY CENTERED ON VERTICAL LINE (-left-[41px] calculated from ml-6 pl-8 border-2) */}
              <button
                onClick={() => toggleDayComplete(day.day)}
                title={isCompleted ? "Mark Day as Incomplete" : "Mark Day as Complete"}
                className={`absolute -left-[43px] top-4 w-6 h-6 border-2 border-[#0A0A0A] flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer z-10 ${
                  isCompleted 
                    ? 'bg-[#E8FF00] text-black border-black scale-110 shadow-xs' 
                    : 'bg-[#0A0A0A] text-white hover:bg-[#E8FF00] hover:text-black hover:scale-105'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : day.day}
              </button>

              <div 
                className={`tech-panel p-5 bg-white border-[#0A0A0A] transition-all ${
                  isCompleted ? 'bg-[#F9F9F4] border-black/60 opacity-90' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-[#E5E5E0]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8A8A8A] uppercase">
                        DAY {String(day.day).padStart(2, '0')}
                      </span>
                      {isCompleted && (
                        <span className="bg-[#E8FF00] text-black border border-black/20 text-[9px] font-bold px-1.5 py-0.2 uppercase">
                          ✓ COMPLETED
                        </span>
                      )}
                    </div>
                    <h4 className={`text-base font-normal font-sans uppercase tracking-tight ${
                      isCompleted ? 'line-through text-[#666666]' : 'text-[#0A0A0A]'
                    }`}>
                      {day.focus}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F7F3] border border-[#E5E5E0] text-[#0A0A0A] text-xs font-bold w-fit">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{day.minutes} MIN ALLOCATED</span>
                    </div>

                    <button
                      onClick={() => toggleDayComplete(day.day)}
                      className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase border transition-all cursor-pointer ${
                        isCompleted 
                          ? 'bg-[#E8FF00] text-black border-black shadow-xs' 
                          : 'bg-white text-[#0A0A0A] border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'COMPLETED' : 'MARK COMPLETE'}</span>
                    </button>
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

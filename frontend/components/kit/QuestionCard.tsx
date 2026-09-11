'use client';

import React, { useState } from 'react';
import { Question } from '@/types/kit';
import { Edit3, Trash2, ArrowUp, ArrowDown, Check, Lock } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
  totalCount: number;
  onUpdate: (updated: Question) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function QuestionCard({
  question,
  index,
  totalCount,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState(question.prompt);
  const [answerOutline, setAnswerOutline] = useState(question.answer_outline);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(question.difficulty);

  const isUserEdited = question._meta?.edited || question._meta?.pinned;

  const handleSave = () => {
    onUpdate({
      ...question,
      prompt,
      answer_outline: answerOutline,
      difficulty,
      _meta: {
        generated: question._meta?.generated ?? true,
        edited: true,
        pinned: question._meta?.pinned ?? false,
        updatedAt: new Date().toISOString()
      }
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setPrompt(question.prompt);
    setAnswerOutline(question.answer_outline);
    setDifficulty(question.difficulty);
    setIsEditing(false);
  };

  return (
    <div className={`tech-panel p-5 bg-white border ${isUserEdited ? 'border-[#0A0A0A]' : 'border-[#E5E5E0]'} font-sans`}>
      <div className="flex items-start justify-between gap-4 mb-3 font-mono text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#0A0A0A]">
            Q{String(index + 1).padStart(3, '0')}
          </span>
          
          <span className="bg-[#0A0A0A] text-white px-2 py-0.5 text-[10px] uppercase">
            {question.category.replace('-', ' ')}
          </span>

          <span className="text-[#666666] text-[11px] flex items-center gap-1">
            DIFFICULTY:
            <span className="font-bold text-[#0A0A0A]">
              LVL {question.difficulty}
            </span>
          </span>

          {isUserEdited && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#E8FF00] text-black font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              USER EDITED (PINNED)
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 text-[#666666]">
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-1 hover:text-[#0A0A0A] disabled:opacity-20"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === totalCount - 1}
            className="p-1 hover:text-[#0A0A0A] disabled:opacity-20"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 hover:text-[#0A0A0A]"
            title="Edit Question"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(question.id)}
            className="p-1 hover:text-red-600"
            title="Delete Question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3 mt-3 pt-3 border-t border-[#E5E5E0] font-mono text-xs">
          <div>
            <label className="block font-bold text-[#0A0A0A] uppercase mb-1">QUESTION PROMPT</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full p-3 border border-[#E5E5E0] focus:border-[#0A0A0A] focus:outline-none text-xs font-mono text-[#0A0A0A] bg-[#F7F7F3]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#0A0A0A] uppercase mb-1">ANSWER OUTLINE</label>
            <textarea
              rows={4}
              value={answerOutline}
              onChange={e => setAnswerOutline(e.target.value)}
              className="w-full p-3 border border-[#E5E5E0] focus:border-[#0A0A0A] focus:outline-none text-xs font-mono text-[#666666] leading-relaxed bg-[#F7F7F3]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="font-bold text-[#0A0A0A]">DIFFICULTY:</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(parseInt(e.target.value, 10) as 1 | 2 | 3)}
                className="text-xs p-1.5 border border-[#E5E5E0] font-mono bg-white"
              >
                <option value={1}>1 - EASY</option>
                <option value={2}>2 - INTERMEDIATE</option>
                <option value={3}>3 - HARD</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-mono text-[#666666] hover:text-[#0A0A0A]"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                className="tech-button-primary text-xs py-1.5 px-3 rounded-none uppercase font-mono"
              >
                <Check className="w-3.5 h-3.5" />
                <span>SAVE EDITS</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h4 className="text-base font-normal text-[#0A0A0A] mb-3 leading-snug uppercase tracking-tight">
            {question.prompt}
          </h4>

          <div className="p-3 bg-[#F7F7F3] border border-[#E5E5E0] font-mono text-xs text-[#666666] whitespace-pre-line leading-relaxed">
            <div className="font-bold text-[10px] uppercase text-[#8A8A8A] mb-1">
              STRUCTURAL ANSWER OUTLINE
            </div>
            {question.answer_outline}
          </div>

          <div className="mt-3 flex items-center gap-2 font-mono text-[11px]">
            <span className="text-[#8A8A8A] uppercase">REQUIREMENTS:</span>
            <div className="flex gap-1 flex-wrap">
              {question.requirement_ids.map(reqId => (
                <span key={reqId} className="px-1.5 py-0.5 bg-white border border-[#E5E5E0] text-[#0A0A0A] font-bold">
                  {reqId}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

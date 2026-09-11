'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

export function CtaBanner() {
  return (
    <section className="relative w-full bg-[#FBFBF8] text-[#0A0A0A] border-t border-b border-[#E5E5DF] py-16 sm:py-20 overflow-hidden font-sans select-none">
      
      {/* Background Technical Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      ></div>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[300px]">
          
          {/* LEFT GRAPHIC AREA: Exact 4-block diagonal grain/stipple steps + Neon Lime Arrow Tile */}
          <div className="hidden lg:flex lg:col-span-3 flex-col justify-between h-full min-h-[300px] relative">
            
            {/* Top Stipple Diagonal Matrix (40px per grid cell matching 40px bg grid) */}
            <div className="relative w-48 h-48 select-none">
              
              {/* Block 1 (Top-Left: Light grain) */}
              <div 
                className="absolute top-0 left-0 w-10 h-10 border border-black/10 mix-blend-multiply opacity-30"
                style={{
                  backgroundImage: `radial-gradient(#000 1.2px, transparent 1.2px)`,
                  backgroundSize: '4px 4px',
                  backgroundColor: '#E5E5DF'
                }}
              ></div>

              {/* Block 2 (Step 2: Medium grain) */}
              <div 
                className="absolute top-10 left-10 w-10 h-10 border border-black/10 mix-blend-multiply opacity-55"
                style={{
                  backgroundImage: `radial-gradient(#000 1.5px, transparent 1.5px)`,
                  backgroundSize: '3px 3px',
                  backgroundColor: '#CCCCCC'
                }}
              ></div>

              {/* Block 3 (Step 3: Dense dark grain) */}
              <div 
                className="absolute top-20 left-20 w-10 h-10 border border-black/10 mix-blend-multiply opacity-80"
                style={{
                  backgroundImage: `radial-gradient(#000 1.8px, transparent 1.8px)`,
                  backgroundSize: '2.5px 2.5px',
                  backgroundColor: '#333333'
                }}
              ></div>

              {/* Block 4 (Step 4: NEON LIME GREEN ARROW TILE - Exact match) */}
              <div className="absolute top-30 left-30 w-12 h-12 bg-[#E8FF00] border border-black/20 flex items-center justify-center shadow-md z-20 transition-transform hover:scale-105 cursor-pointer">
                <ArrowRight className="w-6 h-6 text-[#0A0A0A] -rotate-45 stroke-[2.5]" />
              </div>

            </div>

            {/* Bottom Left Monospace Labels with Neon Yellow Accent Line */}
            <div className="space-y-1.5 pt-4">
              <div className="font-mono text-[10px] font-bold text-[#888888] uppercase tracking-[0.2em] leading-tight">
                <div>BETTER</div>
                <div>PREPARATION</div>
                <div>BRIGHTER</div>
                <div className="text-[#555555]">FUTURES</div>
              </div>
              <div className="w-5 h-[2px] bg-[#E8FF00]"></div>
            </div>

          </div>

          {/* CENTER CONTENT COLUMN: Headline, Subtitle, and CTA Buttons */}
          <div className="lg:col-span-6 text-center space-y-6 max-w-xl mx-auto px-2 sm:px-0">
            
            {/* Top Category Label */}
            <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold text-[#777777] uppercase tracking-[0.2em]">
              <span className="w-1 h-3.5 bg-[#E8FF00] inline-block"></span>
              <span>NEXT STEP</span>
            </div>

            {/* Main Headline with Neon Yellow Box around "opportunity?" */}
            <h2 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold text-[#0A0A0A] tracking-tight leading-[1.08]">
              Ready to land your next<br className="hidden sm:inline" />{' '}
              <span className="bg-[#E8FF00] text-[#0A0A0A] px-3 py-0.5 rounded-sm inline-block font-extrabold mt-1">
                opportunity?
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm lg:text-base text-[#666666] leading-relaxed max-w-lg mx-auto font-normal">
              Join thousands of learners who are preparing smarter, not harder.<br className="hidden sm:inline" />{' '}
              Create <span className="text-[#333333] font-medium">your personalized interview prep kit in minutes.</span>
            </p>

            {/* Action Buttons Row */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/kits/new"
                className="w-full sm:w-auto bg-[#0A0A0A] hover:bg-[#222222] text-white text-xs sm:text-sm font-semibold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Get started for free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto bg-white hover:bg-[#F4F4F0] text-[#0A0A0A] border border-[#CCCCCC] text-xs sm:text-sm font-semibold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>See how it works</span>
              </Link>
            </div>

          </div>

          {/* RIGHT GRAPHIC COLUMN: Monospace Text Stack + Vertical Stipple Bar */}
          <div className="hidden lg:flex lg:col-span-3 justify-end items-stretch h-full min-h-[300px] relative">
            
            {/* Stacked Right Labels */}
            <div className="flex flex-col justify-end text-right py-2 pr-6">
              <div className="font-mono text-[10px] font-bold text-[#888888] tracking-[0.2em] space-y-1 leading-tight">
                <div>LEARN</div>
                <div>PRACTICE</div>
                <div>IMPROVE</div>
                <div className="text-[#333333] font-extrabold">SUCCEED</div>
                <div className="flex justify-end pt-1">
                  <div className="w-5 h-[2px] bg-[#E8FF00]"></div>
                </div>
              </div>
            </div>

            {/* Right Edge Stipple Texture Pillar */}
            <div 
              className="w-16 h-full border-l border-black/10 mix-blend-multiply opacity-50 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#000 1.4px, transparent 1.4px)`,
                backgroundSize: '3px 3px',
                backgroundColor: '#DCDCDC'
              }}
            ></div>

          </div>

        </div>
      </div>
    </section>
  );
}


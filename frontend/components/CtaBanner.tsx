'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CtaBanner() {
  return (
    <section className="relative w-full bg-white text-[#0A0A0A] border-t border-[#E5E7EB] py-12 sm:py-16 lg:py-20 overflow-hidden font-sans select-none">
      
      {/* Technical Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px'
        }}
      ></div>

      {/* SVG Noise Filter definition for realistic stipple art */}
      <svg className="hidden">
        <defs>
          <filter id="stipple-noise-cta" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.2 0" />
          </filter>
        </defs>
      </svg>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT COLUMN: Stipple Diagonal Matrix + Vertical Label (Visible on LG screens) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col justify-between h-full min-h-[260px] relative">
            
            {/* Diagonal Stipple Art Blocks */}
            <div className="relative w-48 h-48">
              {/* Block (0,0) Light Stipple */}
              <div 
                className="absolute top-0 left-0 w-12 h-12 border border-black/5 mix-blend-multiply opacity-40"
                style={{ filter: 'url(#stipple-noise-cta)', backgroundColor: '#444' }}
              ></div>
              {/* Block (1,0) */}
              <div 
                className="absolute top-0 left-12 w-12 h-12 border border-black/5 mix-blend-multiply opacity-20"
                style={{ filter: 'url(#stipple-noise-cta)', backgroundColor: '#666' }}
              ></div>

              {/* Block (1,1) Medium Stipple */}
              <div 
                className="absolute top-12 left-12 w-12 h-12 border border-black/5 mix-blend-multiply opacity-70"
                style={{ filter: 'url(#stipple-noise-cta)', backgroundColor: '#222' }}
              ></div>
              {/* Block (2,1) */}
              <div 
                className="absolute top-12 left-24 w-12 h-12 border border-black/5 mix-blend-multiply opacity-40"
                style={{ filter: 'url(#stipple-noise-cta)', backgroundColor: '#333' }}
              ></div>

              {/* Block (2,2) LIME GREEN ARROW SQUARE */}
              <div className="absolute top-24 left-24 w-12 h-12 bg-[#CCFF00] flex items-center justify-center shadow-sm z-20 group cursor-pointer hover:scale-105 transition-transform">
                <ArrowRight className="w-5 h-5 text-black -rotate-45 stroke-[2.5]" />
              </div>
              {/* Block (3,2) */}
              <div 
                className="absolute top-24 left-36 w-12 h-12 border border-black/5 mix-blend-multiply opacity-50"
                style={{ filter: 'url(#stipple-noise-cta)', backgroundColor: '#111' }}
              ></div>

              {/* Block (3,3) Dark Stipple */}
              <div 
                className="absolute top-36 left-24 w-12 h-12 border border-black/5 mix-blend-multiply opacity-90"
                style={{ filter: 'url(#stipple-noise-cta)', backgroundColor: '#000' }}
              ></div>
              {/* Block (3,3)-2 */}
              <div 
                className="absolute top-36 left-36 w-12 h-12 border border-black/5 mix-blend-multiply opacity-80"
                style={{ filter: 'url(#stipple-noise-cta)', backgroundColor: '#111' }}
              ></div>
            </div>

            {/* Left Vertical Label & Line */}
            <div className="space-y-2 pt-6">
              <div className="font-mono text-[10px] font-bold text-[#8A92A6] uppercase tracking-[0.18em] leading-tight">
                BETTER<br />
                PREPARATION<br />
                BRIGHTER<br />
                FUTURES
              </div>
              <div className="w-5 h-[2.5px] bg-[#CCFF00]"></div>
            </div>
          </div>

          {/* CENTER COLUMN: Main Banner Heading & CTAs */}
          <div className="lg:col-span-6 text-center space-y-5 sm:space-y-6 max-w-xl mx-auto px-2 sm:px-0">
            
            {/* Category Label */}
            <div className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold text-[#8A92A6] tracking-[0.2em] uppercase">
              <span className="w-[3px] h-3.5 bg-[#CCFF00] inline-block"></span>
              <span>NEXT STEP</span>
            </div>

            {/* Heading with Lime Green Highlight Box */}
            <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0A0A0A] tracking-tight leading-[1.2] sm:leading-[1.15]">
              Ready to land your next<br className="hidden sm:inline" />{' '}
              <span className="bg-[#CCFF00] text-[#0A0A0A] px-2.5 sm:px-3 py-0.5 rounded-md inline-block mt-1 font-extrabold">
                opportunity?
              </span>
            </h2>

            {/* Subtitle with matched inline muted text formatting */}
            <p className="text-xs sm:text-sm lg:text-[15px] text-[#333333] leading-relaxed max-w-lg mx-auto">
              Join thousands of learners who{' '}
              <span className="text-[#7A8499]">are preparing smarter, not harder.</span>
              <br className="hidden sm:inline" />{' '}
              <span className="font-semibold text-[#0A0A0A]">Create</span>{' '}
              <span className="text-[#7A8499]">your personalized interview prep kit in minutes.</span>
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-3.5 w-full sm:w-auto">
              <Link
                href="/kits/new"
                className="bg-[#111315] hover:bg-[#22252A] text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span>Get started for free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/#how-it-works"
                className="bg-white hover:bg-[#F9FAFB] text-[#111315] border border-[#D1D5DB] text-xs sm:text-sm font-semibold px-5 py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-2xs w-full sm:w-auto"
              >
                <span className="text-xs font-serif inline-block">▷</span>
                <span>See how it works</span>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Stacked Labels + Vertical Noise Column (Visible on LG screens) */}
          <div className="hidden lg:flex lg:col-span-3 justify-end items-stretch h-full relative">
            
            {/* Stacked Labels */}
            <div className="flex flex-col justify-between text-right py-2 pr-6">
              <div></div>
              <div className="font-mono text-[10px] font-bold text-[#8A92A6] tracking-[0.2em] space-y-1 leading-tight">
                <div>LEARN</div>
                <div>PRACTICE</div>
                <div>IMPROVE</div>
                <div className="text-[#0A0A0A] font-extrabold">SUCCEED</div>
                <div className="flex justify-end pt-1">
                  <div className="w-5 h-[2.5px] bg-[#CCFF00]"></div>
                </div>
              </div>
            </div>

            {/* Vertical Grain/Noise Column */}
            <div 
              className="w-16 h-full border-l border-black/5 mix-blend-multiply opacity-40 pointer-events-none"
              style={{ filter: 'url(#stipple-noise-cta)', backgroundColor: '#222' }}
            ></div>
          </div>

        </div>
      </div>
    </section>
  );
}

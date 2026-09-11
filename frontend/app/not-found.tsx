'use client';

import Link from 'next/link';
import { ArrowRight, Home, LayoutDashboard, PlusCircle, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FBFBF8] text-[#0A0A0A] font-sans selection:bg-[#CCFF00] selection:text-black flex flex-col items-center justify-center relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 select-none">
      
      {/* Technical Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      ></div>

      <div className="max-w-2xl w-full text-center relative z-10 space-y-8">
        
        {/* Monospace Error Tag Header */}
        <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-[#777777] tracking-[0.2em] uppercase bg-white border border-[#E5E5E0] px-3.5 py-1.5 rounded-full shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse"></span>
          <span>404 · PAGE NOT FOUND</span>
        </div>

        {/* Big Stylized 404 Hero Display */}
        <div className="relative inline-block my-2">
          {/* Background Lime Glow Square */}
          <div className="absolute inset-0 bg-[#CCFF00] rounded-3xl blur-xl opacity-50 transform -rotate-3"></div>

          <div className="relative bg-[#0A0A0A] text-white px-8 sm:px-12 py-6 sm:py-8 rounded-3xl border-2 border-black shadow-2xl flex items-center justify-center gap-4">
            <span className="font-mono text-6xl sm:text-8xl font-extrabold tracking-tighter text-white">
              404
            </span>
            <div className="h-12 sm:h-16 w-[2px] bg-[#333333]"></div>
            <div className="text-left font-mono text-xs sm:text-sm text-[#CCFF00] leading-tight space-y-1">
              <div>ROUTE_NOT_FOUND</div>
              <div className="text-[#888888] font-normal text-[10px]">ERR_INVALID_PATH</div>
            </div>
          </div>
        </div>

        {/* Heading & Explanation */}
        <div className="space-y-3 max-w-lg mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A] tracking-tight">
            Ventured off the preparation path?
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
            The page or preparation kit you are looking for doesn&apos;t exist, was moved, or has an invalid URL parameter.
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 max-w-md mx-auto">
          <Link
            href="/"
            className="bg-[#0A0A0A] hover:bg-[#222222] text-white text-xs sm:text-sm font-semibold py-3.5 px-6 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <Link
            href="/dashboard"
            className="bg-white hover:bg-[#F4F4F0] text-[#0A0A0A] border border-[#D0D0CA] text-xs sm:text-sm font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xs"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Workspace Dashboard</span>
          </Link>

          <Link
            href="/kits/new"
            className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-extrabold text-xs sm:text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span>Create Kit</span>
          </Link>
        </div>

        {/* Technical Footer Indicator */}
        <div className="pt-8 border-t border-[#E5E5E0] font-mono text-[10px] text-[#999999] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#0A0A0A]" />
            <span>SYSTEM NAVIGATION AID</span>
          </div>
          <div>PREPKIT ASSIGNMENT BUILD v1.0</div>
        </div>

      </div>
    </div>
  );
}

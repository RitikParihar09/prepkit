'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ArrowRight, 
  ArrowUp,
  CheckCircle2,
  Heart
} from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky button after 200px scroll
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide footer on dashboard and kit subpages if needed
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/kits/')) {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 4000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="w-full bg-[#111317] text-[#9EA3B0] pt-12 pb-8 font-sans select-none overflow-hidden border-t border-[#222630] relative">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-10 border-b border-[#222630]">
            
            {/* BRAND / ASSESSMENT INFO COLUMN */}
            <div className="lg:col-span-7 space-y-3">
              {/* Logo */}
              <Link href="/" className="inline-flex items-center text-2xl font-extrabold text-white tracking-tight">
                <span>prep</span>
                <span className="text-[#E8FF00]">Kit</span>
              </Link>

              {/* Assessment Project Info & Made with love tag */}
              <div className="space-y-1 text-xs text-[#A0A5B5]">
                <p className="font-medium text-white flex items-center gap-1.5 flex-wrap">
                  <span>Assessment project for</span>
                  <span className="bg-[#E8FF00] text-black font-extrabold px-2 py-0.5 rounded-sm">Trao</span>
                  <span>— Software Engineer Role</span>
                </p>
                <p className="text-[#7B8293] flex items-center gap-1 text-[11px] pt-1">
                  <span>Made with</span>
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-current inline-block animate-pulse" />
                  <span>by Ritik Parihar</span>
                </p>
              </div>
            </div>

            {/* STAY UPDATED / NEWSLETTER COLUMN */}
            <div className="lg:col-span-5 space-y-3 lg:border-l border-[#222630] lg:pl-8">
              <div className="space-y-1">
                <div className="font-mono text-[10px] font-bold text-[#7B8293] uppercase tracking-widest">
                  STAY UPDATED
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                  Get the latest interview tips, company insights, and product updates.
                </h4>
              </div>

              {/* Form Input + Square Lime Button */}
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-[#181B22] border border-[#2B303C] text-white placeholder:text-[#636A7E] rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#E8FF00] transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-[#E8FF00] hover:bg-[#d4ea00] text-black font-extrabold p-2 rounded-lg flex items-center justify-center shrink-0 transition-all shadow-sm cursor-pointer"
                    title="Subscribe"
                  >
                    {subscribed ? (
                      <CheckCircle2 className="w-4 h-4 text-black" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-black" />
                    )}
                  </button>
                </div>
                {subscribed ? (
                  <p className="font-mono text-[11px] text-[#E8FF00] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Subscribed! Thank you.</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-[#636A7E]">
                    No spam. Unsubscribe anytime.
                  </p>
                )}
              </form>
            </div>

          </div>

          {/* BOTTOM COPYRIGHT & LEGAL BAR */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7B8293]">
            <div>
              © 2026 prepKit. All rights reserved.
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-[2px] bg-[#E8FF00] inline-block"></span>
              <div className="font-mono text-[9px] uppercase tracking-widest text-right leading-tight">
                <span className="text-[#636A7E]">PREPARE TODAY. </span>
                <span className="text-[#A0A5B5] font-semibold">SUCCEED TOMORROW.</span>
              </div>
            </div>
          </div>

        </div>
      </footer>

      {/* SINGLE STICKY BACK-TO-TOP BUTTON (Visible on all screens including mobile) */}
      <div 
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 transform ${
          showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-90 pointer-events-none'
        }`}
      >
        <button
          onClick={scrollToTop}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E8FF00] hover:bg-[#d4ea00] text-black rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl border-2 border-black/20 transition-transform hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-[#E8FF00]/30"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>
      </div>
    </>
  );
}

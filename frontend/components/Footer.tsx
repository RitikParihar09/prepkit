'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ArrowRight, 
  CheckCircle2
} from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Hide footer on dashboard and kit pages
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/kits')) {
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

  return (
    <footer className="w-full bg-[#0E0F12] text-[#8E95A5] pt-12 sm:pt-16 pb-8 border-t border-[#1C1E24] font-sans select-none overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-6 pb-12 sm:pb-14 border-b border-[#1C1E24]">
          
          {/* BRAND COLUMN */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-3 space-y-4">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center text-2xl font-extrabold text-white tracking-tight">
              <span>prep</span>
              <span className="relative">
                Kit
                <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-[#CCFF00]"></span>
              </span>
            </Link>

            {/* Tagline */}
            <p className="text-xs text-[#A0A5B5]">
              AI-powered interview preparation for ambitious minds.
            </p>

            {/* Divider */}
            <div className="w-full h-[1px] bg-[#1C1E24]"></div>

            {/* Paragraph */}
            <p className="text-xs text-[#72798A] leading-relaxed max-w-sm">
              Turn job opportunities into success stories with personalized research, practice, and guidance.
            </p>

            {/* Social Icons */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md bg-[#181A20] border border-[#272B35] text-[#9EA5B5] hover:text-[#CCFF00] hover:border-[#CCFF00]/50 flex items-center justify-center transition-all"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md bg-[#181A20] border border-[#272B35] text-[#9EA5B5] hover:text-[#CCFF00] hover:border-[#CCFF00]/50 flex items-center justify-center transition-all"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md bg-[#181A20] border border-[#272B35] text-[#9EA5B5] hover:text-[#CCFF00] hover:border-[#CCFF00]/50 flex items-center justify-center transition-all"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md bg-[#181A20] border border-[#272B35] text-[#9EA5B5] hover:text-[#CCFF00] hover:border-[#CCFF00]/50 flex items-center justify-center transition-all"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md bg-[#181A20] border border-[#272B35] text-[#9EA5B5] hover:text-[#CCFF00] hover:border-[#CCFF00]/50 flex items-center justify-center transition-all"
                aria-label="Discord"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* PRODUCT COLUMN */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <h4 className="font-mono text-[11px] font-bold text-white uppercase tracking-widest">
              PRODUCT
            </h4>
            <ul className="space-y-2 text-xs font-normal">
              <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
              <li><Link href="/kits/new" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/kits/new" className="hover:text-white transition-colors">For Students</Link></li>
              <li><Link href="/kits/new" className="hover:text-white transition-colors">For Professionals</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Changelog</Link></li>
            </ul>
          </div>

          {/* RESOURCES COLUMN */}
          <div className="col-span-1 lg:col-span-2 space-y-3">
            <h4 className="font-mono text-[11px] font-bold text-white uppercase tracking-widest">
              RESOURCES
            </h4>
            <ul className="space-y-2 text-xs font-normal">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Interview Tips</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Company Guides</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Career Advice</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Templates</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>

          {/* COMPANY COLUMN */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-2 space-y-3">
            <h4 className="font-mono text-[11px] font-bold text-white uppercase tracking-widest">
              COMPANY
            </h4>
            <ul className="space-y-2 text-xs font-normal">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Sitemap</a></li>
            </ul>
          </div>

          {/* STAY UPDATED / NEWSLETTER COLUMN */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-3 space-y-4 border-t lg:border-t-0 lg:border-l border-[#1C1E24] pt-6 lg:pt-0 lg:pl-6">
            <div className="space-y-1.5">
              <div className="font-mono text-[10px] font-bold text-[#72798A] uppercase tracking-widest">
                STAY UPDATED
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                Get the latest interview tips, company insights, and product updates.
              </h4>
            </div>

            {/* Form Input + Lime Button */}
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-[#16181F] border border-[#282C37] text-white placeholder:text-[#5A6070] rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#CCFF00] transition-colors"
                />
                <button
                  type="submit"
                  className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-extrabold p-2.5 rounded-lg flex items-center justify-center shrink-0 transition-all shadow-sm"
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
                <p className="font-mono text-[11px] text-[#CCFF00] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Subscribed! Thank you for joining.</span>
                </p>
              ) : (
                <p className="text-[11px] text-[#5A6070]">
                  No spam. Unsubscribe anytime.
                </p>
              )}
            </form>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT & LEGAL BAR */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#72798A] text-center sm:text-left">
          <div>
            © 2026 prepKit. All rights reserved.
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 font-normal text-[11px]">
            <div className="flex items-center gap-3">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <span>|</span>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <span>|</span>
              <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
            </div>

            <div className="flex items-center gap-2 sm:pl-2">
              <span className="w-4 h-[2px] bg-[#CCFF00] inline-block"></span>
              <div className="font-mono text-[9px] uppercase tracking-widest text-center sm:text-right leading-tight">
                <div>PREPARE TODAY.</div>
                <div className="text-white font-bold">SUCCEED TOMORROW.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}

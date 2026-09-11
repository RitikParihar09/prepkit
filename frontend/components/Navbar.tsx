'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { ArrowRight, LogOut, User as UserIcon, AlertCircle } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Hide top navigation bar during fullscreen practice mode
  if (pathname?.endsWith('/practice')) {
    return null;
  }

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5E5E0]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-10">
            <Link href="/" className="font-extrabold text-2xl tracking-tighter hover:opacity-95 transition-opacity flex items-center bg-[#111317] px-3.5 py-1.5 rounded-lg shadow-sm">
              <span className="text-white font-extrabold text-2xl tracking-tight">prep</span>
              <span className="text-[#E8FF00] font-extrabold text-2xl tracking-tight">Kit</span>
            </Link>
          </div>

          {/* Right CTA / User Info & Auth Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-xs font-medium text-[#333333] hover:text-[#0A0A0A] px-3.5 py-2 border border-[#E5E5E0] rounded-md bg-white hover:bg-[#F7F7F3] transition-all"
                >
                  Dashboard
                </Link>
                
                <Link
                  href="/kits/new"
                  className="bg-[#0A0A0A] text-white hover:bg-[#222222] text-xs font-medium py-2 px-3.5 rounded-md transition-all flex items-center gap-1.5"
                >
                  <span>Create Kit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {/* Vertical Separator */}
                <div className="h-6 w-[1px] bg-[#D8D8D2] mx-0.5"></div>

                {/* Profile Pill & Logout Icon (Reference Image Match) */}
                <div className="flex items-center gap-3">
                  {/* User Profile Avatar & Name */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#EAEAEA] border border-[#E0E0DA] flex items-center justify-center text-[#222222] shadow-inner">
                      <UserIcon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <span className="text-sm font-medium text-[#0A0A0A] max-w-[140px] truncate">
                      {displayName}
                    </span>
                  </div>

                  {/* Logout Icon Button */}
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-1.5 text-[#0A0A0A] hover:text-red-600 hover:bg-[#F4F4F0] rounded-md transition-all flex items-center justify-center"
                    title="Log out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-medium text-[#333333] hover:text-[#0A0A0A] px-4 py-2 border border-[#CCCCCC] rounded-md bg-white hover:bg-[#F7F7F3] transition-all"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-[#0A0A0A] text-white hover:bg-[#222222] text-xs font-medium py-2 px-4 rounded-md transition-all"
                >
                  Get started for free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal Popup (New prepKit Theme Match) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-2xl p-7 max-w-[420px] w-full space-y-6 relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
            
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-tech-grid opacity-40 pointer-events-none"></div>

            {/* Header: Icon + Monospace Tag & Title */}
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] text-[#E8FF00] flex items-center justify-center shrink-0 border border-black/20 shadow-md">
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[10px] text-[#777777] uppercase tracking-widest">[ SESSION TERMINATION ]</div>
                <h3 className="font-extrabold text-xl text-[#0A0A0A] tracking-tight">
                  Confirm{' '}
                  <span className="relative inline-block">
                    Logout
                    <span className="absolute -bottom-0.5 left-0 w-full h-[3px] bg-[#E8FF00]"></span>
                  </span>
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="relative z-10 text-xs sm:text-sm text-[#555555] leading-relaxed font-sans">
              Are you sure you want to log out of your account? You will need to sign in again to access your preparation kits.
            </p>

            {/* Bottom Actions Row */}
            <div className="relative z-10 flex items-center justify-end gap-3 pt-2 font-mono text-xs">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2.5 font-semibold text-[#0A0A0A] bg-[#F4F4F0] hover:bg-[#EAEAEA] rounded-xl border border-[#E0E0DA] transition-all uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all flex items-center gap-2 uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

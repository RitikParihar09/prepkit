'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { ArrowRight, AlertCircle, Loader2, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both email and password fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({ email, password });
      login(res.token, res.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@example.com');
    setPassword('Password123!');
    setError(null);
    try {
      setLoading(true);
      const res = await api.login({ email: 'demo@example.com', password: 'Password123!' });
      login(res.token, res.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-tech-grid select-none">
      <div className="w-full max-w-md p-8 border border-[#E5E5E0] hover:border-[#0A0A0A] transition-all duration-200 shadow-2xl bg-white rounded-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block font-extrabold text-2xl text-[#0A0A0A] tracking-tight mb-1">
            prep<span className="relative">Kit<span className="absolute -bottom-1 left-0 w-full h-[3px] bg-[#E8FF00]"></span></span>
          </Link>
          <div className="font-mono text-[10px] text-[#777777] uppercase tracking-widest">[ AUTHENTICATION TERMINAL ]</div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">Welcome Back</h1>
          <p className="text-xs text-[#666666]">Sign in to access your interview prep kits & workspace</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-mono text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>[ERROR] {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[#0A0A0A] uppercase tracking-wider">
              EMAIL ADDRESS *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="demo@example.com"
              className="w-full px-4 py-3 rounded-lg border border-[#E5E5E0] focus:border-[#0A0A0A] focus:outline-none text-xs text-[#0A0A0A] bg-[#F7F7F3]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[#0A0A0A] uppercase tracking-wider">
              PASSWORD *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-[#E5E5E0] focus:border-[#0A0A0A] focus:outline-none text-xs text-[#0A0A0A] bg-[#F7F7F3]"
            />
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A0A0A] hover:bg-[#222222] text-white text-xs font-semibold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm font-mono"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E8FF00]" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO WORKSPACE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full bg-[#F4F4F0] hover:bg-[#EAEAEA] text-[#0A0A0A] border border-[#E0E0DA] font-mono text-xs font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all uppercase"
            >
              <Zap className="w-4 h-4 text-[#0A0A0A] fill-[#E8FF00]" />
              <span>INSTANT 1-CLICK DEMO LOGIN</span>
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-[#E5E5E0] text-center font-mono text-xs text-[#777777]">
          Don't have an account yet?{' '}
          <Link href="/register" className="font-bold text-[#0A0A0A] hover:underline underline-offset-4">
            Create an account →
          </Link>
        </div>

      </div>
    </div>
  );
}

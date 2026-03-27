'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

type Mode = 'loading' | 'setup' | 'confirm' | 'verify';

export default function PasswordEntryScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('loading');
  const [password, setPassword] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check if setup is required
    fetch('/api/pin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.setup_required) {
          setMode('setup');
        } else {
          setMode('verify');
        }
      })
      .catch((err) => {
        console.error('Error checking setup status:', err);
        setError('Connection error');
      });
  }, []);

  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setError('');
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChecking) return;
    
    setIsChecking(true);
    setError('');

    try {
      if (mode === 'setup') {
        setSetupPassword(password);
        setPassword('');
        setMode('confirm');
      } else if (mode === 'confirm') {
        if (password !== setupPassword) {
          triggerError('Passwords do not match');
          setSetupPassword('');
          setPassword('');
          setMode('setup');
        } else {
          const res = await fetch('/api/pin/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: password })
          });
          const data = await res.json();
          if (data.success) {
            sessionStorage.setItem('pin_authenticated', 'true');
            router.push('/dashboard');
          } else {
            triggerError('Failed to setup password');
          }
        }
      } else if (mode === 'verify') {
        const res = await fetch('/api/pin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: password })
        });
        const data = await res.json();
        
        if (data.success) {
          sessionStorage.setItem('pin_authenticated', 'true');
          router.push('/dashboard');
        } else {
          triggerError('Wrong password');
          setPassword('');
        }
      }
    } catch (err) {
      triggerError('Network error');
    } finally {
      setIsChecking(false);
    }
  };

  if (mode === 'loading') {
    return (
      <main className="flex min-h-screen bg-gray-950 text-white flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShieldCheck className="w-12 h-12 text-blue-500" />
          <h1 className="text-2xl font-semibold tracking-tight">CashAgent</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-gray-950 text-white flex-col items-center justify-center p-4 selection:bg-transparent">
      <div className={`w-full max-w-sm flex flex-col items-center gap-8 ${isShaking ? 'animate-shake' : ''}`}>
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CashAgent</h1>
          <p className="text-gray-400 text-sm font-medium h-5">
            {mode === 'setup' && 'Create a new master password'}
            {mode === 'confirm' && 'Confirm your new password'}
            {mode === 'verify' && 'Enter your password to continue'}
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isChecking}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-center tracking-widest text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-lg"
              placeholder="••••••••"
            />
          </div>

          {/* Error Message */}
          <div className="h-6 flex items-center justify-center">
            {error && <span className="text-red-400 text-sm font-medium animate-pulse">{error}</span>}
          </div>

          <button
            type="submit"
            disabled={isChecking || !password.trim()}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all transform active:scale-[0.98] outline-none disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {isChecking ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  );
}

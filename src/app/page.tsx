'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Delete } from 'lucide-react';

type Mode = 'loading' | 'setup' | 'confirm' | 'verify';

export default function PINEntryScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('loading');
  const [pin, setPin] = useState('');
  const [setupPin, setSetupPin] = useState('');
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

  useEffect(() => {
    if (pin.length === 4 && !isChecking) {
      handlePinComplete(pin);
    }
  }, [pin]);

  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setPin('');
    setTimeout(() => {
      setIsShaking(false);
      setError('');
    }, 1500);
  };

  const handlePinComplete = async (currentPin: string) => {
    setIsChecking(true);
    setError('');

    try {
      if (mode === 'setup') {
        setSetupPin(currentPin);
        setPin('');
        setMode('confirm');
      } else if (mode === 'confirm') {
        if (currentPin !== setupPin) {
          triggerError('PINs do not match');
          setSetupPin('');
          setMode('setup');
        } else {
          const res = await fetch('/api/pin/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: currentPin })
          });
          const data = await res.json();
          if (data.success) {
            router.push('/dashboard');
          } else {
            triggerError('Failed to setup PIN');
          }
        }
      } else if (mode === 'verify') {
        const res = await fetch('/api/pin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: currentPin })
        });
        const data = await res.json();
        
        if (data.success) {
          router.push('/dashboard');
        } else {
          triggerError('Wrong PIN');
        }
      }
    } catch (err) {
      triggerError('Network error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (isChecking || isShaking) return;
    
    if (key === 'backspace') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(prev => prev + key);
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
      <div className="w-full max-w-sm flex flex-col items-center gap-12">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CashAgent</h1>
          <p className="text-gray-400 text-sm font-medium h-5">
            {mode === 'setup' && 'Create a new 4-digit PIN'}
            {mode === 'confirm' && 'Confirm your new PIN'}
            {mode === 'verify' && 'Enter your PIN to continue'}
          </p>
        </div>

        {/* PIN Dots */}
        <div className={`flex gap-4 h-12 items-center ${isShaking ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                i < pin.length 
                  ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] scale-110' 
                  : 'bg-gray-800'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        <div className="h-6 flex items-center justify-center">
          {error && <span className="text-red-400 text-sm font-medium animate-pulse">{error}</span>}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full px-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              disabled={isChecking || isShaking}
              className="h-16 rounded-2xl bg-gray-900/50 hover:bg-gray-800 active:bg-gray-700 active:scale-95 transition-all text-2xl font-medium flex items-center justify-center border border-gray-800/50 outline-none"
            >
              {num}
            </button>
          ))}
          <div /> {/* Empty space for bottom left */}
          <button
            onClick={() => handleKeyPress('0')}
            disabled={isChecking || isShaking}
            className="h-16 rounded-2xl bg-gray-900/50 hover:bg-gray-800 active:bg-gray-700 active:scale-95 transition-all text-2xl font-medium flex items-center justify-center border border-gray-800/50 outline-none"
          >
            0
          </button>
          <button
            onClick={() => handleKeyPress('backspace')}
            disabled={isChecking || isShaking || pin.length === 0}
            className="h-16 rounded-2xl bg-gray-900/50 hover:bg-gray-800 active:bg-gray-700 active:scale-95 transition-all text-xl font-medium flex items-center justify-center border border-gray-800/50 outline-none disabled:opacity-50"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </main>
  );
}

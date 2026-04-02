'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

type Mode = 'loading' | 'setup' | 'confirm' | 'verify';

export default function PasswordEntryScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('loading');
  const [password, setPassword] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
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
        setMode('verify');
      });
  }, []);

  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setError('');
    }, 2000);
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
    } catch {
      triggerError('Network error');
    } finally {
      setIsChecking(false);
    }
  };

  const modeLabel = {
    setup: 'Create a new master password',
    confirm: 'Confirm your new password',
    verify: 'Enter your password to continue',
    loading: '',
  };

  if (mode === 'loading') {
    return (
      <main
        style={{
          display: 'flex',
          minHeight: '100dvh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--background)',
          padding: '24px',
        }}
      >
        <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="animate-pulse-glow" style={{
            padding: '16px',
            borderRadius: '20px',
            background: 'rgba(99, 102, 241, 0.08)',
          }}>
            <ShieldCheck style={{ width: 40, height: 40, color: 'var(--accent-light)' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
            CashAgent
          </h1>
          <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: 'var(--text-muted)' }} />
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100dvh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient orbs */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      <div
        className={`animate-fade-in-up ${isShaking ? 'animate-shake' : ''}`}
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '36px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="animate-pulse-glow" style={{
            padding: '18px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
            border: '1px solid rgba(99, 102, 241, 0.15)',
          }}>
            <ShieldCheck style={{ width: 36, height: 36, color: 'var(--accent-light)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--foreground)',
              marginBottom: '8px',
            }}>
              CashAgent
            </h1>
            <p style={{
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              minHeight: '22px',
            }}>
              {modeLabel[mode]}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Password Input */}
          <div style={{
            position: 'relative',
            width: '100%',
          }}>
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              id="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isChecking}
              placeholder="Enter password"
              autoComplete="off"
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: error
                  ? '1.5px solid rgba(239, 68, 68, 0.5)'
                  : '1.5px solid var(--surface-border)',
                borderRadius: '16px',
                padding: '18px 56px 18px 20px',
                color: 'var(--foreground)',
                fontSize: '17px',
                fontWeight: 500,
                fontFamily: 'inherit',
                letterSpacing: showPassword ? '0' : '0.15em',
                outline: 'none',
                transition: 'all 0.2s ease',
                WebkitAppearance: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? 'rgba(239, 68, 68, 0.5)' : 'var(--surface-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            {/* Show/Hide toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                transition: 'color 0.2s ease',
              }}
            >
              {showPassword
                ? <EyeOff style={{ width: 22, height: 22 }} />
                : <Eye style={{ width: 22, height: 22 }} />
              }
            </button>
          </div>

          {/* Error Message */}
          <div style={{
            minHeight: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            {error && (
              <span style={{
                color: '#f87171',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ fontSize: '16px' }}>⚠</span>
                {error}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="submit-button"
            disabled={isChecking || !password.trim()}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '16px',
              fontFamily: 'inherit',
              color: 'white',
              background: isChecking || !password.trim()
                ? 'rgba(99, 102, 241, 0.3)'
                : 'linear-gradient(135deg, #6366f1, #7c3aed)',
              border: 'none',
              cursor: isChecking || !password.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isChecking || !password.trim()
                ? 'none'
                : '0 4px 20px rgba(99, 102, 241, 0.3)',
              letterSpacing: '0.01em',
            }}
          >
            {isChecking ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
                Verifying...
              </>
            ) : (
              mode === 'setup' ? 'Set Password' :
              mode === 'confirm' ? 'Confirm Password' :
              'Unlock'
            )}
          </button>
        </form>

        {/* Subtle footer */}
        <p style={{
          fontSize: '12px',
          color: 'rgba(107, 114, 128, 0.5)',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginTop: '8px',
        }}>
          Secured locally
        </p>
      </div>
    </main>
  );
}

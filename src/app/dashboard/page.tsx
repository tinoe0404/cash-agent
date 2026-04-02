'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut, ArrowDownCircle, ArrowUpCircle,
  Wallet, AlertCircle, Plus, X, TrendingUp,
  TrendingDown, DollarSign, Loader2
} from 'lucide-react';

type Transaction = {
  id: number;
  type: 'deposit' | 'withdraw';
  amount: string;
  description: string;
  category: string;
  is_voided: boolean;
  is_owing: boolean;
  created_at: string;
};

type Stats = {
  total_deposited: number;
  total_withdrawn: number;
  total_owing: number;
  current_balance: number;
  potential_balance: number;
};

export default function Dashboard() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ total_deposited: 0, total_withdrawn: 0, total_owing: 0, current_balance: 0, potential_balance: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isOwing, setIsOwing] = useState(false);
  const [error, setError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setStats({
          total_deposited: data.total_deposited || 0,
          total_withdrawn: data.total_withdrawn || 0,
          total_owing: data.total_owing || 0,
          current_balance: data.current_balance || 0,
          potential_balance: data.potential_balance || 0,
        });
      } else {
        setGlobalError('Unable to reach the server. Please try again later.');
      }
    } catch {
      setGlobalError('Connection error. Is the database running?');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('pin_authenticated') !== 'true') {
      router.replace('/');
    } else {
      fetchData();
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (type === 'withdraw' && Number(amount) > stats.current_balance) {
      setError('Withdrawal exceeds balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount, description, category: 'Other', is_owing: type === 'withdraw' ? isOwing : false })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setAmount('');
      setDescription('');
      setIsOwing(false);
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val));
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}>
        <div className="animate-pulse-glow" style={{
          padding: '16px',
          borderRadius: '18px',
          background: 'rgba(99, 102, 241, 0.08)',
        }}>
          <Wallet style={{ width: 32, height: 32, color: 'var(--accent-light)' }} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500 }}>Loading...</p>
        <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: 'var(--text-muted)' }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--background)',
      color: 'var(--foreground)',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '100px',
    }}>

      {/* ===== HEADER ===== */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--surface-border)',
        padding: '0 20px',
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet style={{ width: 22, height: 22, color: 'var(--accent-light)' }} />
            <h1 style={{
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--foreground)',
            }}>CashAgent</h1>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('pin_authenticated');
              router.push('/');
            }}
            style={{
              padding: '8px',
              background: 'none',
              border: '1px solid var(--surface-border)',
              borderRadius: '12px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            title="Lock & Logout"
          >
            <LogOut style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </header>

      <main style={{
        maxWidth: '600px',
        margin: '0 auto',
        width: '100%',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>

        {/* Global Error */}
        {globalError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle style={{ width: 18, height: 18, color: '#f87171', flexShrink: 0 }} />
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#f87171' }}>{globalError}</p>
            </div>
            <button
              onClick={() => setGlobalError('')}
              style={{
                background: 'none', border: 'none', color: '#f87171',
                cursor: 'pointer', padding: '4px', borderRadius: '8px',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}

        {/* ===== BALANCE CARD ===== */}
        <div className="animate-fade-in-up" style={{
          background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
          borderRadius: '22px',
          padding: '28px 24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '-20px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />

          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1,
          }}>
            Real Balance
          </p>
          <p style={{
            fontSize: '36px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: stats.current_balance < 0 ? '#fca5a5' : 'white',
            position: 'relative',
            zIndex: 1,
            lineHeight: 1.1,
          }}>
            {formatCurrency(stats.current_balance)}
          </p>

          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: '16px',
            marginBottom: '4px',
            position: 'relative',
            zIndex: 1,
          }}>
            Potential Balance
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'rgba(255,255,255,0.9)',
              position: 'relative',
              zIndex: 1,
              lineHeight: 1.1,
            }}>
              {formatCurrency(stats.potential_balance)}
            </p>
            {stats.total_owing > 0 && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                position: 'relative',
                zIndex: 1,
              }}>+{formatCurrency(stats.total_owing)} owed</span>
            )}
          </div>
          {stats.current_balance < 0 && (
            <span style={{
              display: 'inline-block',
              marginTop: '12px',
              fontSize: '11px',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.3)',
              color: '#fecaca',
              padding: '3px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              position: 'relative',
              zIndex: 1,
            }}>Negative Balance</span>
          )}

          {/* In/Out row */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '20px',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TrendingUp style={{ width: 16, height: 16, color: '#a7f3d0' }} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Income</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#a7f3d0' }}>
                  {formatCurrency(stats.total_deposited)}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TrendingDown style={{ width: 16, height: 16, color: '#fca5a5' }} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Expenses</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#fca5a5' }}>
                  {formatCurrency(stats.total_withdrawn)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== NEW TRANSACTION FORM (modal sheet) ===== */}
        {showForm && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setShowForm(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 90,
              }}
            />
            {/* Bottom Sheet */}
            <div
              ref={formRef}
              className="animate-fade-in-up"
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: 'var(--surface)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px 20px',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                maxHeight: '85dvh',
                overflowY: 'auto',
                border: '1px solid var(--surface-border)',
                borderBottom: 'none',
              }}
            >
              {/* Handle bar */}
              <div style={{
                width: '36px',
                height: '4px',
                borderRadius: '2px',
                background: 'rgba(255,255,255,0.15)',
                margin: '0 auto 20px',
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>
                  New Transaction
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Type Toggle */}
                <div style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '4px',
                  borderRadius: '14px',
                  border: '1px solid var(--surface-border)',
                }}>
                  <button
                    type="button"
                    onClick={() => setType('deposit')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '15px',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      borderRadius: '11px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: type === 'deposit' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: type === 'deposit' ? '#34d399' : 'var(--text-muted)',
                    }}
                  >
                    <ArrowUpCircle style={{ width: 18, height: 18 }} /> Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('withdraw')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '15px',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      borderRadius: '11px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: type === 'withdraw' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      color: type === 'withdraw' ? '#f87171' : 'var(--text-muted)',
                    }}
                  >
                    <ArrowDownCircle style={{ width: 18, height: 18 }} /> Withdraw
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '8px',
                    display: 'block',
                  }}>Amount</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 20,
                      height: 20,
                      color: 'var(--text-muted)',
                    }} />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1.5px solid var(--surface-border)',
                        borderRadius: '14px',
                        padding: '16px 16px 16px 44px',
                        color: 'var(--foreground)',
                        fontSize: '18px',
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'all 0.2s',
                        WebkitAppearance: 'none',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                        e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--surface-border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '8px',
                    display: 'block',
                  }}>Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Grocery run, Salary, etc."
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1.5px solid var(--surface-border)',
                      borderRadius: '14px',
                      padding: '16px',
                      color: 'var(--foreground)',
                      fontSize: '16px',
                      fontWeight: 500,
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--surface-border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {type === 'withdraw' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 4px',
                  }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Is this a loan?</span>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Mark as owing (will be returned)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOwing(!isOwing)}
                      style={{
                        position: 'relative',
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: isOwing ? '#6366f1' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px',
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'white',
                        transform: isOwing ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                      }} />
                    </button>
                  </div>
                )}



                {/* Error */}
                {error && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                  }}>
                    <AlertCircle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#f87171' }}>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '16px',
                    fontWeight: 700,
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    color: 'white',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    background: isSubmitting
                      ? 'rgba(99,102,241,0.3)'
                      : type === 'deposit'
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    boxShadow: isSubmitting ? 'none' : type === 'deposit'
                      ? '0 4px 20px rgba(16,185,129,0.3)'
                      : '0 4px 20px rgba(239,68,68,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px',
                  }}
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" style={{ width: 20, height: 20 }} /> Processing...</>
                  ) : (
                    `Submit ${type === 'deposit' ? 'Deposit' : 'Withdrawal'}`
                  )}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ===== TRANSACTIONS LIST ===== */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>
              Transactions
            </h2>
            <span style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-muted)',
            }}>
              {transactions.length} total
            </span>
          </div>

          {transactions.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              gap: '12px',
            }}>
              <div style={{
                padding: '16px',
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.04)',
              }}>
                <Wallet style={{ width: 32, height: 32, color: 'var(--text-muted)', opacity: 0.4 }} />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>No transactions yet</p>
              <p style={{ fontSize: '14px', color: 'rgba(107,114,128,0.6)' }}>
                Tap + to add your first transaction
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: tx.is_voided ? 'rgba(255,255,255,0.02)' : 'var(--surface)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: '16px',
                    transition: 'all 0.2s',
                    opacity: tx.is_voided ? 0.5 : 1,
                    filter: tx.is_voided ? 'grayscale(0.8)' : 'none',
                  }}
                >
                  {/* Left: icon + info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '18px',
                      background: tx.is_voided
                        ? 'rgba(255,255,255,0.04)'
                        : tx.type === 'deposit'
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                      border: tx.is_voided
                        ? '1px solid rgba(255,255,255,0.06)'
                        : tx.type === 'deposit'
                          ? '1px solid rgba(16, 185, 129, 0.15)'
                          : '1px solid rgba(239, 68, 68, 0.15)',
                    }}>
                      {tx.type === 'deposit'
                        ? <ArrowUpCircle style={{ width: 20, height: 20, color: tx.is_voided ? 'var(--text-muted)' : '#34d399' }} />
                        : <ArrowDownCircle style={{ width: 20, height: 20, color: tx.is_voided ? 'var(--text-muted)' : '#f87171' }} />
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <p style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: tx.is_voided ? 'var(--text-muted)' : 'var(--foreground)',
                          textDecoration: tx.is_voided ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '140px',
                        }}>
                          {tx.description}
                        </p>
                        {tx.is_voided && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'var(--text-muted)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            flexShrink: 0,
                          }}>Voided</span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '3px' }}>
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Right: amount */}
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    flexShrink: 0,
                    color: tx.is_voided
                      ? 'var(--text-muted)'
                      : tx.type === 'deposit'
                        ? '#34d399'
                        : '#f87171',
                    textDecoration: tx.is_voided ? 'line-through' : 'none',
                  }}>
                    {tx.type === 'deposit' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ===== FLOATING ACTION BUTTON ===== */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: 'fixed',
          bottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '18px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 80,
          background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
          boxShadow: '0 6px 24px rgba(99, 102, 241, 0.4)',
          transition: 'all 0.2s',
          transform: showForm ? 'scale(0)' : 'scale(1)',
        }}
      >
        <Plus style={{ width: 28, height: 28, color: 'white' }} />
      </button>
    </div>
  );
}

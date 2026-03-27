'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2, ArrowDownCircle, ArrowUpCircle, Wallet, AlertCircle } from 'lucide-react';

type Transaction = {
  id: number;
  type: 'deposit' | 'withdraw';
  amount: string;
  description: string;
  category: string;
  is_voided: boolean;
  created_at: string;
};

type Stats = {
  total_deposited: number;
  total_withdrawn: number;
  current_balance: number;
};

const CATEGORIES = ['Food', 'Transport', 'Freelance', 'Business', 'Personal', 'Other'];

export default function Dashboard() {
  const router = useRouter();

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ total_deposited: 0, total_withdrawn: 0, current_balance: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
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
          current_balance: data.current_balance || 0,
        });
      } else {
        setGlobalError('Unable to reach the server. Please try again later.');
      }
    } catch (err) {
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
      setError('Withdrawal amount exceeds current balance');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount,
          description,
          category
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit transaction');
      }

      setAmount('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoid = async (id: number) => {
    if (!window.confirm('Are you sure you want to void this transaction?')) {
      return;
    }
    try {
      const res = await fetch(`/api/transactions/${id}/void`, {
        method: 'PATCH'
      });
      if (res.ok) {
        await fetchData();
      } else {
        setGlobalError('Failed to void transaction');
      }
    } catch (err) {
      setGlobalError('Network error voiding transaction');
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(val));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Wallet className="w-10 h-10 text-blue-500" />
          <h1 className="text-xl font-medium tracking-tight">Loading Dashboard...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col selection:bg-blue-500/30">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">CashAgent</h1>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('pin_authenticated');
              router.push('/');
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors outline-none"
            title="Lock & Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-6 py-8 flex flex-col gap-8">
        
        {globalError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium text-sm">{globalError}</p>
            </div>
            <button onClick={() => setGlobalError('')} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors">&times;</button>
          </div>
        )}

        {/* SECTION 1: Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <ArrowUpCircle className="w-24 h-24 text-emerald-500 -mt-4 -mr-4" />
            </div>
            <span className="text-gray-400 text-sm font-medium z-10">Total In</span>
            <span className="text-3xl font-bold tracking-tight text-emerald-500 z-10">
              {formatCurrency(stats.total_deposited)}
            </span>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <ArrowDownCircle className="w-24 h-24 text-red-500 -mt-4 -mr-4" />
            </div>
            <span className="text-gray-400 text-sm font-medium z-10">Total Out</span>
            <span className="text-3xl font-bold tracking-tight text-red-500 z-10">
              {formatCurrency(stats.total_withdrawn)}
            </span>
          </div>
          <div className={`rounded-2xl p-6 flex flex-col gap-2 shadow-[0_0_30px_rgba(37,99,235,0.2)] md:transform md:-translate-y-1 relative overflow-hidden transition-colors ${stats.current_balance < 0 ? 'bg-red-950/40 border border-red-900' : 'bg-blue-600'}`}>
             <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <span className="text-blue-100 text-sm font-medium z-10 flex items-center gap-2">
              Current Balance
              {stats.current_balance < 0 && <span className="text-[10px] bg-red-500/20 text-red-200 px-2 py-0.5 rounded border border-red-500/30 uppercase tracking-wider font-bold">Negative</span>}
            </span>
            <span className={`text-4xl font-extrabold tracking-tight z-10 ${stats.current_balance < 0 ? 'text-red-400' : 'text-white'}`}>
              {formatCurrency(stats.current_balance)}
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* SECTION 2: Transaction Form */}
          <section className="col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-6 sticky top-24">
            <h2 className="text-lg font-semibold text-white">New Transaction</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Type Toggle */}
              <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setType('deposit')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all outline-none ${
                    type === 'deposit' 
                      ? 'bg-emerald-500/10 text-emerald-500 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setType('withdraw')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all outline-none ${
                    type === 'withdraw' 
                      ? 'bg-red-500/10 text-red-500 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Withdraw
                </button>
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-8 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="Grocery run, Salary, etc."
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform opacity-50">
                    ▼
                  </div>
                </div>
              </div>

              {/* Inline Error */}
              {error && (
                <div className="flex items-start gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-500/20 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="mt-0.5 leading-tight">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 mt-2 rounded-xl font-semibold text-white transition-all transform active:scale-[0.98] outline-none ${
                  type === 'deposit' 
                    ? 'bg-emerald-600 hover:bg-emerald-500' 
                    : 'bg-red-600 hover:bg-red-500'
                } ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}`}
              >
                {isSubmitting ? 'Processing...' : `Submit ${type === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
              </button>
            </form>
          </section>

          {/* SECTION 3: Transaction History */}
          <section className="col-span-1 lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[700px] shadow-sm">
            <div className="p-6 border-b border-gray-800 bg-gray-900/95 backdrop-blur z-10 sticky top-0">
              <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 pb-12">
                  <Wallet className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium text-gray-400">No transactions found.</p>
                  <p className="text-sm">Make your first deposit to get started!</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {transactions.map((tx) => (
                    <li 
                      key={tx.id} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-colors border border-gray-800/40 bg-gray-950/40 hover:bg-gray-800/60 ${
                        tx.is_voided ? 'opacity-50 grayscale' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 truncate mb-2 sm:mb-0">
                        {/* Icon based on type */}
                        <div className={`p-3 rounded-full shrink-0 shadow-inner ${
                          tx.is_voided 
                            ? 'bg-gray-800 text-gray-500'
                            : tx.type === 'deposit' 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {tx.type === 'deposit' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex flex-col truncate pr-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium truncate ${tx.is_voided ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                              {tx.description}
                            </span>
                            {tx.is_voided && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full shrink-0 border border-gray-700">
                                Voided
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <span className="font-medium">{formatDate(tx.created_at)}</span>
                            <span className="opacity-50">•</span>
                            <span className="bg-gray-800 px-2 py-0.5 rounded-md border border-gray-700/50 text-gray-300 shadow-sm">{tx.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:justify-start gap-4 shrink-0 px-2 sm:px-0 sm:pl-4">
                        <span className={`text-lg font-bold tracking-tight ${
                          tx.is_voided 
                            ? 'text-gray-500 line-through' 
                            : tx.type === 'deposit' 
                              ? 'text-emerald-500' 
                              : 'text-white'
                        }`}>
                          {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        
                        {!tx.is_voided && (
                          <button
                            onClick={() => handleVoid(tx.id)}
                            className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors outline-none"
                            title="Void Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {tx.is_voided && <div className="w-9" /> /* placeholder */}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Leaf, Phone, Lock, Eye, EyeOff, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

const ROLE_HOME: Record<string, string> = {
  HOUSEHOLD: '/portal/household',
  RAGPICKER: '/portal/ragpicker',
  COLLECTOR: '/portal/ragpicker',
  KABADIWALA: '/portal/kabadiwala',
  RECYCLER: '/portal/recycler',
  ADMIN: '/portal/admin',
};

const ROLES = [
  { value: 'HOUSEHOLD', label: '🏠 Household' },
  { value: 'RAGPICKER', label: '🧺 Ragpicker' },
  { value: 'KABADIWALA', label: '⚖️ Kabadiwala' },
  { value: 'RECYCLER', label: '♻️ Recycler' },
];

function LoginForm() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('HOUSEHOLD');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(phone, pin);
      } else {
        await register({ phone, pin, name, role });
      }
      const me = await api.get<{ user: { role: string } }>('/api/v1/auth/me');
      router.push(ROLE_HOME[me.user.role] || '/portal/household');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest to-forest-700 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="gradient-forest px-8 py-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-1">
            <Leaf className="h-6 w-6 text-terracotta" />
            <span className="font-display text-xl font-bold text-cream">GREVORO</span>
          </Link>
          <p className="text-cream/60 text-sm">Waste Traceability Network</p>
        </div>

        <div className="flex border-b border-cream-200">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                mode === m
                  ? 'text-forest border-b-2 border-forest bg-cream/30'
                  : 'text-charcoal/50 hover:text-charcoal/70'
              }`}
            >
              {m === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Ravi Kumar"
                className="w-full px-4 py-2.5 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder="9810000123"
                className="w-full pl-10 pr-4 py-2.5 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">4-digit PIN</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e.target.value)}
                required
                minLength={4}
                maxLength={6}
                placeholder="••••"
                className="w-full pl-10 pr-10 py-2.5 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/70"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1" htmlFor="role-select">Role</label>
              <select
                id="role-select"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest hover:bg-forest-700 disabled:opacity-60 text-cream font-semibold py-3 rounded-xl transition-all hover:scale-[1.01] text-sm"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-charcoal/40">
            Demo PIN for all seed users: <span className="font-mono font-bold text-forest">1234</span>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}

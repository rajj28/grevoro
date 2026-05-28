'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Leaf, LogOut, Wallet, Star } from 'lucide-react';
import Link from 'next/link';

const ROLE_HOME: Record<string, string> = {
  HOUSEHOLD: '/portal/household',
  RAGPICKER: '/portal/ragpicker',
  COLLECTOR: '/portal/ragpicker',
  KABADIWALA: '/portal/kabadiwala',
  RECYCLER: '/portal/recycler',
  ADMIN: '/portal/admin',
};

const ROLE_EMOJI: Record<string, string> = {
  HOUSEHOLD: '🏠',
  RAGPICKER: '🧺',
  COLLECTOR: '🚛',
  KABADIWALA: '⚖️',
  RECYCLER: '♻️',
  ADMIN: '🔑',
};

function PortalShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const homeHref = ROLE_HOME[user.role] || '/portal';

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="bg-forest sticky top-0 z-50 border-b border-forest-700">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href={homeHref} className="flex items-center gap-2 min-w-0">
            <Leaf className="h-5 w-5 text-terracotta flex-shrink-0" />
            <span className="font-display font-bold text-cream text-sm sm:text-base truncate">
              GREVORO
            </span>
            <span className="text-cream/40 text-xs hidden sm:block">·</span>
            <span className="text-cream/70 text-xs hidden sm:block">
              {ROLE_EMOJI[user.role]} {user.role}
            </span>
          </Link>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-3 text-xs text-cream/70">
              <span className="flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                ₹{user.walletBalance?.toFixed(0) ?? '0'}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {user.reputationScore?.toFixed(1) ?? '—'}
              </span>
            </div>
            <span className="text-cream/80 text-xs font-medium hidden sm:block">{user.name}</span>
            <button
              onClick={() => { logout(); router.replace('/portal/login'); }}
              className="p-1.5 rounded-lg bg-cream/10 text-cream/70 hover:bg-cream/20 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalShell>{children}</PortalShell>
    </AuthProvider>
  );
}

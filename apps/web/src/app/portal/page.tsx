'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const ROLE_HOME: Record<string, string> = {
  HOUSEHOLD: '/portal/household',
  RAGPICKER: '/portal/ragpicker',
  COLLECTOR: '/portal/ragpicker',
  KABADIWALA: '/portal/kabadiwala',
  RECYCLER: '/portal/recycler',
  ADMIN: '/portal/admin',
};

export default function PortalIndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else router.replace(ROLE_HOME[user.role] || '/portal/household');
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

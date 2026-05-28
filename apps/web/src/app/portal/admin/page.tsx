'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Package, TrendingUp, Shield, RefreshCw,
  CheckCircle2, XCircle, Search, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, Batch, AuthUser } from '@/lib/api';
import { ProgressBar } from '@/components/ProgressBar';

interface AdminStats {
  totalKgDiverted: number;
  totalCo2eSavedKg: number;
  totalWorkerPayoutInr: number;
  informalWorkersActive: number;
  materialBreakdown: unknown[];
}

const ROLE_BADGE: Record<string, string> = {
  HOUSEHOLD: 'bg-blue-100 text-blue-700',
  RAGPICKER: 'bg-amber-100 text-amber-700',
  COLLECTOR: 'bg-orange-100 text-orange-700',
  KABADIWALA: 'bg-purple-100 text-purple-700',
  RECYCLER: 'bg-green-100 text-green-700',
  ADMIN: 'bg-red-100 text-red-700',
};

export default function AdminPortal() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [anchors, setAnchors] = useState<unknown[]>([]);
  const [tab, setTab] = useState<'overview' | 'batches' | 'users' | 'anchors'>('overview');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      const [impactData, batchData, anchorData] = await Promise.all([
        api.get<AdminStats>('/api/v1/impact/summary'),
        api.get<{ batches: Batch[] }>('/api/v1/batches?limit=100'),
        api.get<{ anchors: unknown[] }>('/api/v1/impact/anchors'),
      ]);
      setStats(impactData);
      setBatches(batchData.batches);
      setAnchors(anchorData.anchors || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredBatches = batches.filter(b =>
    !search || b.shortcode.toLowerCase().includes(search.toLowerCase()) ||
    b.materialType?.toLowerCase().includes(search.toLowerCase())
  );

  const byStatus = batches.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const TABS = ['overview', 'batches', 'users', 'anchors'] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">Admin Panel</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">System overview and management</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={refreshing}
          className="p-2 rounded-xl bg-white border border-cream-200 text-charcoal/60 hover:bg-cream transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-cream-200 p-1 shadow-sm">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
              tab === t ? 'bg-forest text-cream shadow-sm' : 'text-charcoal/60 hover:text-charcoal'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Batches', value: batches.length, icon: Package, color: 'text-forest' },
              { label: 'kg Diverted', value: stats?.totalKgDiverted?.toFixed(0) ?? '—', icon: TrendingUp, color: 'text-blue-600' },
              { label: 'CO₂e Saved', value: stats?.totalCo2eSavedKg?.toFixed(0) ?? '—', icon: Shield, color: 'text-green-600' },
              { label: 'Workers', value: stats?.informalWorkersActive ?? '—', icon: Users, color: 'text-terracotta' },
            ].map(({ label, value, icon: Icon, color }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm"
              >
                <Icon className={`h-4 w-4 mb-2 ${color}`} />
                <div className="text-xl font-bold text-charcoal">{value}</div>
                <div className="text-xs text-charcoal/50">{label}</div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-cream-200 p-5 shadow-sm mb-4">
            <h3 className="text-sm font-semibold text-charcoal mb-3">Batch Status Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-charcoal/60 w-28 capitalize">{status.toLowerCase().replace(/_/g, ' ')}</span>
                  <ProgressBar value={(count / batches.length) * 100} />
                  <span className="text-xs font-semibold text-charcoal w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-cream-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-charcoal mb-3">Recent Batches</h3>
              <div className="space-y-2">
                {batches.slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-forest">{b.shortcode}</span>
                    <span className="text-charcoal/50">{b.status}</span>
                    <Link href={`/trust/${b.shortcode}`} className="text-forest">↗</Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-cream-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-charcoal mb-3">Merkle Anchors</h3>
              <p className="text-2xl font-bold text-forest">{anchors.length}</p>
              <p className="text-xs text-charcoal/50 mt-1">On-chain commitments</p>
              <Link href="/impact" className="text-xs text-forest underline mt-3 block">View impact dashboard ↗</Link>
            </div>
          </div>
        </div>
      )}

      {tab === 'batches' && (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by shortcode or material…"
              className="w-full pl-10 pr-4 py-2.5 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 bg-white"
            />
          </div>
          <div className="bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-cream text-xs font-semibold text-charcoal/60 border-b border-cream-200">
              <span>Shortcode</span>
              <span>Material</span>
              <span>Status</span>
              <span>Weight</span>
            </div>
            <div className="divide-y divide-cream-200 max-h-96 overflow-y-auto">
              {loading ? (
                [1,2,3,4,5].map(i => <div key={i} className="h-10 animate-pulse m-2 bg-cream rounded-lg" />)
              ) : filteredBatches.length === 0 ? (
                <div className="p-8 text-center text-charcoal/40 text-sm">No batches found</div>
              ) : filteredBatches.map(b => (
                <div key={b.id} className="grid grid-cols-4 gap-2 px-4 py-3 text-xs hover:bg-cream/50 transition-colors">
                  <Link href={`/trust/${b.shortcode}`} className="font-mono text-forest hover:underline flex items-center gap-1">
                    {b.shortcode} <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                  <span className="text-charcoal/70 truncate">{b.materialType?.replace(/_/g, ' ')}</span>
                  <span className={`inline-flex items-center gap-1 ${b.status === 'RECYCLED' ? 'text-green-600' : 'text-charcoal/60'}`}>
                    {b.status === 'RECYCLED' ? <CheckCircle2 className="h-3 w-3" /> : null}
                    {b.status}
                  </span>
                  <span className="text-charcoal/60">{b.weightKg?.toFixed(1)} kg</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-charcoal/40 mt-2 text-right">{filteredBatches.length} of {batches.length} batches</p>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="p-8 text-center text-charcoal/40">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">User management</p>
            <p className="text-sm mt-1">User listing API endpoint coming in Phase 7</p>
          </div>
        </div>
      )}

      {tab === 'anchors' && (
        <div className="space-y-3">
          {(anchors as any[]).slice(0, 20).map((anchor: any, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs font-semibold text-charcoal">Merkle Root</span>
                  </div>
                  <p className="font-mono text-xs text-forest/80 break-all">{anchor.rootHash}</p>
                  <p className="text-xs text-charcoal/40 mt-1">
                    {anchor.eventCount} events · {new Date(anchor.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              </div>
            </div>
          ))}
          {anchors.length === 0 && !loading && (
            <div className="bg-white rounded-xl border border-cream-200 p-10 text-center text-charcoal/40 text-sm">
              No anchors yet — run the worker to generate Merkle anchors
            </div>
          )}
        </div>
      )}
    </div>
  );
}

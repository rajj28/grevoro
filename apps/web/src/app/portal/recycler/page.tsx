'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, TrendingUp, DollarSign, Package, CheckCircle2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, Batch } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ImpactSummary {
  totalKgDiverted: number;
  totalCo2eSavedKg: number;
  totalWorkerPayoutInr: number;
  materialBreakdown: { materialType: string; kgDiverted: number; co2eSavedKg: number }[];
}

export default function RecyclerPortal() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [batchData, impactData] = await Promise.all([
        api.get<{ batches: Batch[] }>('/api/v1/batches?limit=50'),
        api.get<ImpactSummary>('/api/v1/impact/summary'),
      ]);
      setBatches(batchData.batches.filter(b => b.currentCustodianId === user?.id));
      setImpact(impactData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleMarkRecycled = async (batch: Batch) => {
    setMarking(batch.id);
    try {
      await api.post(`/api/v1/batches/shortcode/${batch.shortcode}/handoff`, {
        toUserId: user!.id,
        weightKg: batch.weightKg,
        eventType: 'RECYCLED',
      });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setMarking(null);
    }
  };

  const received = batches.filter(b => b.status !== 'RECYCLED');
  const recycled = batches.filter(b => b.status === 'RECYCLED');

  const chartData = (impact?.materialBreakdown || []).slice(0, 6).map(m => ({
    name: m.materialType.replace(/_/g, ' ').replace('PLASTIC', 'PL.').slice(0, 10),
    co2: parseFloat(m.co2eSavedKg.toFixed(1)),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-forest">Recycler Dashboard</h1>
        <p className="text-charcoal/60 text-sm mt-0.5">Manage incoming batches and track ESG impact</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'In Queue', value: received.length, icon: Package, color: 'text-terracotta' },
          { label: 'Recycled', value: recycled.length, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'kg Diverted', value: impact?.totalKgDiverted?.toFixed(0) ?? '—', icon: Leaf, color: 'text-forest' },
          { label: 'CO₂e Saved', value: impact?.totalCo2eSavedKg?.toFixed(0) ?? '—', icon: TrendingUp, color: 'text-blue-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
            <Icon className={`h-4 w-4 mb-2 ${color}`} />
            <div className="text-xl font-bold text-charcoal">{value}</div>
            <div className="text-xs text-charcoal/50">{label}</div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-cream-200 p-5 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-charcoal mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-forest" /> CO₂e Saved by Material (global)
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`${v} kg`, 'CO₂e']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="co2" fill="#1F3D2B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {received.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-charcoal/60 uppercase tracking-wider mb-3">Incoming Batches</h2>
          <div className="space-y-3 mb-6">
            {received.map((batch, i) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="font-mono text-sm font-bold text-forest">{batch.shortcode}</div>
                  <div className="text-xs text-charcoal/50 mt-0.5">
                    {batch.materialType?.replace(/_/g, ' ')} · {batch.weightKg?.toFixed(1)} kg
                    {batch.qualityGrade && <span className="ml-2 font-semibold">Grade {batch.qualityGrade}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/trust/${batch.shortcode}`} className="p-2 rounded-lg bg-cream hover:bg-cream-200 text-charcoal/60">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleMarkRecycled(batch)}
                    disabled={marking === batch.id}
                    className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-2 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {marking === batch.id ? '…' : 'Mark Recycled'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {recycled.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-charcoal/60 uppercase tracking-wider mb-3">Completed</h2>
          <div className="space-y-2">
            {recycled.slice(0, 10).map(batch => (
              <div key={batch.id} className="bg-green-50 rounded-xl border border-green-100 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-mono text-xs text-forest">{batch.shortcode}</span>
                  <span className="text-xs text-charcoal/40">{batch.weightKg?.toFixed(1)} kg · {batch.materialType?.replace(/_/g, ' ')}</span>
                </div>
                <Link href={`/trust/${batch.shortcode}`} className="text-xs text-forest underline">Chain ↗</Link>
              </div>
            ))}
          </div>
        </>
      )}

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-cream-200" />)}</div>}
    </div>
  );
}

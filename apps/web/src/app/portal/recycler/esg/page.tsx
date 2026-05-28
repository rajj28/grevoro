'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, TrendingUp, Wallet, Shield, TreePine, Car, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '@/lib/api';

interface ESGReport {
  period: { from: string; to: string };
  summary: {
    totalKgDiverted: number;
    totalCo2eSavedKg: number;
    totalWorkerPayoutInr: number;
    totalBatchesRecycled: number;
    merkleAnchorCount: number;
    treesEquivalent: number;
    carKmEquivalent: number;
  };
  breakdown: {
    material: string;
    materialType: string;
    kgDiverted: number;
    co2eSavedKg: number;
    workerPayoutInr: number;
    batchCount: number;
  }[];
  topBatches: { shortcode: string; materialType: string; weightKg: number; qualityGrade: string | null }[];
}

const COLORS = ['#1F3D2B', '#C36A3A', '#4A7C59', '#8BAF9A', '#D4956A', '#E8C4A0'];

export default function ESGReportPage() {
  const [report, setReport] = useState<ESGReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('90');

  const fetchReport = async (days: string) => {
    setLoading(true);
    setError('');
    try {
      const from = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString();
      const data = await api.get<ESGReport>(`/api/v1/esg/report?from=${from}`);
      setReport(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(range); }, [range]);

  const pieData = report?.breakdown.slice(0, 6).map(b => ({
    name: b.material.split(' ')[0],
    value: parseFloat(b.kgDiverted.toFixed(1)),
  })) || [];

  const barData = report?.breakdown.map(b => ({
    name: b.material.split(' ')[0].slice(0, 8),
    co2: parseFloat(b.co2eSavedKg.toFixed(1)),
    kg: parseFloat(b.kgDiverted.toFixed(1)),
  })) || [];

  const handleDownload = () => {
    if (!report) return;
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grevoro-esg-report-${range}d.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">ESG Report</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">Environmental, Social & Governance impact</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            title="Date range"
            className="px-3 py-2 border border-cream-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest/30"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={handleDownload}
            disabled={!report}
            className="flex items-center gap-1.5 bg-forest text-cream px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-forest-700"
            title="Download JSON"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-cream-200" />)}
        </div>
      ) : report && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'kg Diverted', value: report.summary.totalKgDiverted.toFixed(0), unit: 'kg', icon: Leaf, color: 'text-forest', bg: 'bg-forest/10' },
              { label: 'CO₂e Saved', value: report.summary.totalCo2eSavedKg.toFixed(0), unit: 'kg', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Worker Payout', value: `₹${report.summary.totalWorkerPayoutInr.toFixed(0)}`, unit: '', icon: Wallet, color: 'text-terracotta', bg: 'bg-terracotta/10' },
              { label: 'Anchors', value: String(report.summary.merkleAnchorCount), unit: 'Merkle', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ label, value, unit, icon: Icon, color, bg }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm"
              >
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="text-xl font-bold text-charcoal">{value}</div>
                <div className="text-xs text-charcoal/50">{label} {unit && <span className="text-charcoal/30">{unit}</span>}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-charcoal mb-1 flex items-center gap-2">
                <TreePine className="h-4 w-4 text-green-600" /> Environmental Equivalents
              </h3>
              <div className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-charcoal/60">🌳 Trees saved (CO₂)</span>
                  <span className="font-bold text-forest text-lg">{report.summary.treesEquivalent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-charcoal/60 flex items-center gap-1"><Car className="h-3.5 w-3.5" /> Car km offset</span>
                  <span className="font-bold text-blue-600 text-lg">{report.summary.carKmEquivalent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-charcoal/60">📦 Batches completed</span>
                  <span className="font-bold text-charcoal text-lg">{report.summary.totalBatchesRecycled}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-charcoal mb-3">Material Mix (kg)</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} labelLine={false}>
                      {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v} kg`]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-charcoal/30 text-sm text-center py-8">No data</p>}
            </div>
          </div>

          {barData.length > 0 && (
            <div className="bg-white rounded-xl border border-cream-200 p-5 shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-charcoal mb-4">CO₂e Saved by Material</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number, name: string) => [`${v} ${name === 'co2' ? 'kg CO₂e' : 'kg'}`, name === 'co2' ? 'CO₂e' : 'Weight']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="co2" name="co2" fill="#1F3D2B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {report.topBatches.length > 0 && (
            <div className="bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-cream border-b border-cream-200">
                <h3 className="text-sm font-semibold text-charcoal">Top Batches by Weight</h3>
              </div>
              <div className="divide-y divide-cream-200">
                {report.topBatches.map((b, i) => (
                  <div key={b.shortcode} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <span className="text-charcoal/30 w-4 text-xs">{i + 1}</span>
                    <span className="font-mono text-forest text-xs">{b.shortcode}</span>
                    <span className="flex-1 text-charcoal/60 text-xs">{b.materialType.replace(/_/g, ' ')}</span>
                    {b.qualityGrade && <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Grade {b.qualityGrade}</span>}
                    <span className="font-semibold text-charcoal text-xs">{b.weightKg.toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

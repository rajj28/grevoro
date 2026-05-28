'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf, Users, TrendingUp, DollarSign, BarChart3, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { MATERIAL_COLORS, MATERIAL_LABELS } from '@grevoro/shared';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const COUNTER_COLORS = ['text-forest', 'text-terracotta', 'text-blue-600', 'text-purple-600'];

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toLocaleString('en-IN')}{suffix}</span>;
}

export default function ImpactPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = () => {
    setLoading(true);
    fetch(`${API}/api/v1/impact/summary`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLastUpdated(new Date()); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const pieData = (data?.materialBreakdown || []).map((m: any) => ({
    name: MATERIAL_LABELS[m.materialType as keyof typeof MATERIAL_LABELS] || m.materialType,
    value: parseFloat(m.kgDiverted.toFixed(1)),
    color: MATERIAL_COLORS[m.materialType as keyof typeof MATERIAL_COLORS] || '#6B7280',
  }));

  const barData = (data?.materialBreakdown || []).map((m: any) => ({
    name: (MATERIAL_LABELS[m.materialType as keyof typeof MATERIAL_LABELS] || m.materialType).replace(' ', '\n'),
    co2: parseFloat(m.co2eSavedKg.toFixed(1)),
    kg: parseFloat(m.kgDiverted.toFixed(1)),
  }));

  const KPI = [
    { label: 'kg Diverted', value: data?.totalKgDiverted || 0, icon: Leaf, suffix: ' kg', color: COUNTER_COLORS[0] },
    { label: 'CO₂e Saved', value: data?.totalCo2eSavedKg || 0, icon: TrendingUp, suffix: ' kg', color: COUNTER_COLORS[1] },
    { label: 'Worker Payouts', value: data?.totalWorkerPayoutInr || 0, icon: DollarSign, suffix: ' ₹', color: COUNTER_COLORS[2] },
    { label: 'Workers Active', value: data?.informalWorkersActive || 0, icon: Users, suffix: '', color: COUNTER_COLORS[3] },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest/95 backdrop-blur border-b border-forest-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-terracotta" />
            <span className="font-display font-bold text-cream">GREVORO</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-cream/50 text-xs">
              Updated {lastUpdated.toLocaleTimeString('en-IN')}
            </span>
            <button
              onClick={fetchData}
              aria-label="Refresh impact data"
              className="p-1.5 rounded-lg bg-cream/10 text-cream/70 hover:bg-cream/20 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-green-100 text-green-700 border border-green-200 rounded-full px-4 py-1.5 text-sm font-medium mb-4"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Impact Dashboard
          </motion.div>
          <h1 className="font-display text-4xl font-bold text-forest mb-2">
            Real-time Waste Impact
          </h1>
          <p className="text-charcoal/60 max-w-xl mx-auto">
            Every batch tracked on GREVORO generates verifiable environmental and social impact, anchored on-chain.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {KPI.map(({ label, value, icon: Icon, suffix, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-forest/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-forest" />
                </div>
                <span className="text-charcoal/50 text-xs font-medium">{label}</span>
              </div>
              <div className={`text-2xl font-display font-bold ${color}`}>
                {loading ? '—' : <AnimatedCounter value={value} suffix={suffix} />}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-forest" />
              <h2 className="font-semibold text-charcoal">CO₂e Saved by Material</h2>
            </div>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(v: number) => [`${v} kg`, 'CO₂e']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="co2" fill="#1F3D2B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-charcoal/30">
                No data yet
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Leaf className="h-5 w-5 text-terracotta" />
              <h2 className="font-semibold text-charcoal">Waste Diverted by Material</h2>
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v} kg`]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value: string) => value.slice(0, 12)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-charcoal/30">
                No data yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-forest rounded-2xl p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-cream mb-2">
            Verify a specific batch
          </h2>
          <p className="text-cream/70 mb-4 text-sm">
            Scan or enter a GRV batch ID to see its full chain of custody.
          </p>
          <Link
            href="/trust/GRV-K7M2QX"
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-700 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105"
          >
            View Hero Batch GRV-K7M2QX
          </Link>
        </div>
      </div>
    </div>
  );
}

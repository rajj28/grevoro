'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Send, Star, ChevronRight, CheckCircle2, Package } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, Batch } from '@/lib/api';

const GRADES = ['A', 'B', 'C', 'D'] as const;
const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-700 border-green-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-amber-100 text-amber-700 border-amber-200',
  D: 'bg-red-100 text-red-700 border-red-200',
};

export default function KabadiwalaPortal() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Batch | null>(null);
  const [grade, setGrade] = useState<string>('B');
  const [weight, setWeight] = useState('');
  const [contamPct, setContamPct] = useState('5');
  const [toUserId, setToUserId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBatches = async () => {
    try {
      const data = await api.get<{ batches: Batch[] }>('/api/v1/batches?limit=50');
      setBatches(data.batches.filter(b => b.currentCustodianId === user?.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchBatches(); }, [user]);

  const graded = batches.filter(b => b.qualityGrade);
  const pending = batches.filter(b => !b.qualityGrade);

  const handleGradeAndDispatch = async () => {
    if (!selected) return;
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/api/v1/batches/shortcode/${selected.shortcode}/handoff`, {
        toUserId,
        weightKg: parseFloat(weight) || selected.weightKg,
        qualityGrade: grade,
        contaminationPct: parseFloat(contamPct) || 0,
        eventType: 'DISPATCHED',
      });
      setSelected(null);
      fetchBatches();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-forest">Kabadiwala Dashboard</h1>
        <p className="text-charcoal/60 text-sm mt-0.5">Grade and dispatch batches to recyclers</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'In Custody', value: batches.length, icon: Package, color: 'text-forest' },
          { label: 'Graded', value: graded.length, icon: Star, color: 'text-amber-600' },
          { label: 'Pending', value: pending.length, icon: Scale, color: 'text-terracotta' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm text-center">
            <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
            <div className="text-xl font-bold text-charcoal">{value}</div>
            <div className="text-xs text-charcoal/50">{label}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-charcoal/60 uppercase tracking-wider mb-3">Awaiting Grading</h2>
          <div className="space-y-3 mb-6">
            {pending.map((batch, i) => (
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
                  </div>
                </div>
                <button
                  onClick={() => { setSelected(batch); setWeight(String(batch.weightKg)); setError(''); }}
                  className="flex items-center gap-1 bg-terracotta text-white text-xs px-3 py-2 rounded-xl font-semibold hover:bg-terracotta/90"
                >
                  Grade & Dispatch <ChevronRight className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {graded.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-charcoal/60 uppercase tracking-wider mb-3">Dispatched</h2>
          <div className="space-y-2">
            {graded.map(batch => (
              <div key={batch.id} className="bg-white rounded-xl border border-cream-200 p-3 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${GRADE_COLORS[batch.qualityGrade || 'C']}`}>
                    Grade {batch.qualityGrade}
                  </span>
                  <span className="font-mono text-xs text-forest">{batch.shortcode}</span>
                  <span className="text-xs text-charcoal/40">{batch.weightKg?.toFixed(1)} kg</span>
                </div>
                <Link href={`/trust/${batch.shortcode}`} className="text-xs text-forest underline">View chain</Link>
              </div>
            ))}
          </div>
        </>
      )}

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-cream-200" />)}</div>}

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h2 className="font-display text-lg font-bold text-forest mb-1">Grade & Dispatch</h2>
              <p className="text-xs font-mono text-charcoal/50 mb-4">{selected.shortcode}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Quality Grade</label>
                  <div className="flex gap-2">
                    {GRADES.map(g => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                          grade === g ? GRADE_COLORS[g] + ' scale-105' : 'border-cream-200 text-charcoal/50 hover:border-forest/30'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="verified-weight" className="block text-sm font-medium text-charcoal mb-1">Verified Weight (kg)</label>
                  <input
                    id="verified-weight"
                    type="number"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 12.5"
                    className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                </div>
                <div>
                  <label htmlFor="contam-pct" className="block text-sm font-medium text-charcoal mb-1">Contamination %</label>
                  <input
                    id="contam-pct"
                    type="number"
                    value={contamPct}
                    onChange={e => setContamPct(e.target.value)}
                    min="0"
                    max="100"
                    step="1"
                    placeholder="0–100"
                    className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                </div>
                <div>
                  <label htmlFor="recycler-user-id" className="block text-sm font-medium text-charcoal mb-1">Recycler User ID</label>
                  <input
                    id="recycler-user-id"
                    type="text"
                    value={toUserId}
                    onChange={e => setToUserId(e.target.value)}
                    placeholder="Recycler's user ID"
                    className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setSelected(null)} className="flex-1 py-2.5 border border-cream-200 rounded-xl text-sm text-charcoal/70 hover:bg-cream">Cancel</button>
                  <button
                    onClick={handleGradeAndDispatch}
                    disabled={submitting || !toUserId}
                    className="flex-1 py-2.5 bg-forest text-cream rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" /> {submitting ? 'Dispatching…' : 'Dispatch'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

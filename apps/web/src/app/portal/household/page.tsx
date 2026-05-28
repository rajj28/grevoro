'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, QrCode, ArrowRight, Leaf, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, Batch } from '@/lib/api';

const STATUS_COLOR: Record<string, string> = {
  CREATED: 'bg-blue-100 text-blue-700',
  PICKUP: 'bg-amber-100 text-amber-700',
  HANDOFF: 'bg-purple-100 text-purple-700',
  DISPATCHED: 'bg-orange-100 text-orange-700',
  RECYCLED: 'bg-green-100 text-green-700',
};

const MATERIAL_EMOJI: Record<string, string> = {
  PET_PLASTIC: '🧴',
  HDPE_PLASTIC: '🪣',
  MIXED_PLASTIC: '♻️',
  PAPER: '📄',
  CARDBOARD: '📦',
  METAL_FERROUS: '🔩',
  METAL_NON_FERROUS: '🥫',
  GLASS: '🫙',
  E_WASTE: '💻',
  ORGANIC: '🌿',
  MIXED: '🗂️',
};

function NewBatchModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [materialType, setMaterialType] = useState('MIXED_PLASTIC');
  const [weightKg, setWeightKg] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/v1/batches', {
        materialType,
        weightKg: parseFloat(weightKg) || 1,
        description: description || undefined,
      });
      onCreated();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
      >
        <h2 className="font-display text-lg font-bold text-forest mb-4">New Waste Batch</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1" htmlFor="material-select">Material Type</label>
            <select
              id="material-select"
              value={materialType}
              onChange={e => setMaterialType(e.target.value)}
              className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              {Object.entries(MATERIAL_EMOJI).map(([k, emoji]) => (
                <option key={k} value={k}>{emoji} {k.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Estimated Weight (kg)</label>
            <input
              type="number"
              value={weightKg}
              onChange={e => setWeightKg(e.target.value)}
              placeholder="e.g. 2.5"
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Plastic bottles, newspapers…"
              className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-cream-200 rounded-xl text-sm font-medium text-charcoal/70 hover:bg-cream transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={loading} className="flex-1 py-2.5 bg-forest text-cream rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-forest-700 transition-colors">
              {loading ? 'Creating…' : 'Create Batch'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function HouseholdPortal() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchBatches = async () => {
    try {
      const data = await api.get<{ batches: Batch[] }>('/api/v1/batches?limit=20');
      setBatches(data.batches);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const myBatches = batches.filter(b => b.originUserId === user?.id || b.currentCustodianId === user?.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">My Waste Batches</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">Track your recycling journey</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-forest text-cream px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-700 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          New Batch
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Batches', value: myBatches.length, icon: Package },
          { label: 'Recycled', value: myBatches.filter(b => b.status === 'RECYCLED').length, icon: CheckCircle2 },
          { label: 'In Progress', value: myBatches.filter(b => b.status !== 'RECYCLED').length, icon: Clock },
          { label: 'kg Diverted', value: myBatches.reduce((s, b) => s + (b.weightKg || 0), 0).toFixed(1), icon: Leaf },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
            <Icon className="h-5 w-5 text-forest mb-2" />
            <div className="text-xl font-bold text-charcoal">{value}</div>
            <div className="text-xs text-charcoal/50">{label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-cream-200 p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : myBatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
          <Package className="h-12 w-12 text-charcoal/20 mx-auto mb-4" />
          <p className="text-charcoal/50 font-medium">No batches yet</p>
          <p className="text-charcoal/40 text-sm mt-1">Create your first batch to start tracking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myBatches.map((batch, i) => (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm flex items-center gap-4"
            >
              <div className="text-2xl flex-shrink-0">
                {MATERIAL_EMOJI[batch.materialType] || '♻️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-forest">{batch.shortcode}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[batch.status] || 'bg-gray-100 text-gray-700'}`}>
                    {batch.status}
                  </span>
                </div>
                <p className="text-xs text-charcoal/50 truncate">
                  {batch.materialType?.replace(/_/g, ' ')} · {batch.weightKg?.toFixed(1)} kg
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/trust/${batch.shortcode}`}
                  className="p-2 rounded-lg bg-cream hover:bg-cream-200 text-charcoal/60 transition-colors"
                  title="View Trust Explorer"
                >
                  <QrCode className="h-4 w-4" />
                </Link>
                <Link
                  href={`/trust/${batch.shortcode}`}
                  className="p-2 rounded-lg bg-forest/10 hover:bg-forest/20 text-forest transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <NewBatchModal onClose={() => setShowModal(false)} onCreated={fetchBatches} />
      )}
    </div>
  );
}

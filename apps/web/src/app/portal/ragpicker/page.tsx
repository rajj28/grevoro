'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Backpack, ArrowRight, Scale, MapPin, CheckCircle2,
  WifiOff, Wifi, Clock, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, Batch } from '@/lib/api';

interface OutboxItem {
  id: string;
  batchShortcode: string;
  toUserId: string;
  weightKg: number;
  gpsLat?: number;
  gpsLng?: number;
  createdAt: string;
}

function getOutbox(): OutboxItem[] {
  try {
    return JSON.parse(localStorage.getItem('grv_outbox') || '[]');
  } catch {
    return [];
  }
}

function saveOutbox(items: OutboxItem[]) {
  localStorage.setItem('grv_outbox', JSON.stringify(items));
}

export default function RagpickerPortal() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [handoffWeight, setHandoffWeight] = useState('');
  const [handoffTo, setHandoffTo] = useState('');
  const [handoffError, setHandoffError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    setOutbox(getOutbox());
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

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

  const syncOutbox = async () => {
    const items = getOutbox();
    if (!items.length || !online) return;
    setSyncing(true);
    const failed: OutboxItem[] = [];
    for (const item of items) {
      try {
        await api.post(`/api/v1/batches/shortcode/${item.batchShortcode}/handoff`, {
          toUserId: item.toUserId,
          weightKg: item.weightKg,
          gpsLat: item.gpsLat,
          gpsLng: item.gpsLng,
        });
      } catch {
        failed.push(item);
      }
    }
    saveOutbox(failed);
    setOutbox(failed);
    setSyncing(false);
    fetchBatches();
  };

  useEffect(() => { if (online && outbox.length) syncOutbox(); }, [online]);

  const handleHandoff = async () => {
    if (!selectedBatch || !handoffTo) return;
    setHandoffError('');
    setSubmitting(true);

    const payload = {
      toUserId: handoffTo,
      weightKg: parseFloat(handoffWeight) || selectedBatch.weightKg,
      gpsLat: undefined as number | undefined,
      gpsLng: undefined as number | undefined,
    };

    if (navigator.geolocation) {
      await new Promise<void>(res => {
        navigator.geolocation.getCurrentPosition(
          pos => { payload.gpsLat = pos.coords.latitude; payload.gpsLng = pos.coords.longitude; res(); },
          () => res(),
          { timeout: 3000 }
        );
      });
    }

    if (!online) {
      const item: OutboxItem = {
        id: `${Date.now()}`,
        batchShortcode: selectedBatch.shortcode,
        toUserId: handoffTo,
        weightKg: payload.weightKg,
        gpsLat: payload.gpsLat,
        gpsLng: payload.gpsLng,
        createdAt: new Date().toISOString(),
      };
      const updated = [...getOutbox(), item];
      saveOutbox(updated);
      setOutbox(updated);
      setSelectedBatch(null);
      setSubmitting(false);
      return;
    }

    try {
      await api.post(`/api/v1/batches/shortcode/${selectedBatch.shortcode}/handoff`, payload);
      setSelectedBatch(null);
      fetchBatches();
    } catch (e) {
      setHandoffError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">My Collections</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">Batches currently in your custody</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
          online ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? 'Online' : 'Offline'}
        </div>
      </div>

      {outbox.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-amber-700 text-sm font-semibold">{outbox.length} handoff(s) queued</p>
            <p className="text-amber-600 text-xs">Will sync when back online</p>
          </div>
          {online && (
            <button
              onClick={syncOutbox}
              disabled={syncing}
              className="bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-60"
            >
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-cream-200" />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center mt-4">
          <Backpack className="h-12 w-12 text-charcoal/20 mx-auto mb-3" />
          <p className="text-charcoal/50 font-medium">No batches in custody</p>
          <p className="text-charcoal/40 text-sm mt-1">Collect waste from households to get started</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {batches.map((batch, i) => (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center font-bold text-forest text-lg">
                    ♻️
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-forest">{batch.shortcode}</div>
                    <div className="text-xs text-charcoal/50">
                      {batch.materialType?.replace(/_/g, ' ')} · {batch.weightKg?.toFixed(1)} kg
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedBatch(batch); setHandoffWeight(String(batch.weightKg)); setHandoffError(''); }}
                  className="flex items-center gap-1.5 bg-terracotta text-white text-xs px-3 py-2 rounded-xl font-semibold hover:bg-terracotta/90 transition-colors"
                >
                  Handoff <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedBatch && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h2 className="font-display text-lg font-bold text-forest mb-1">Handoff Batch</h2>
              <p className="text-charcoal/50 text-sm mb-4 font-mono">{selectedBatch.shortcode}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Recipient User ID</label>
                  <input
                    type="text"
                    value={handoffTo}
                    onChange={e => setHandoffTo(e.target.value)}
                    placeholder="Kabadiwala user ID"
                    className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5" /> Verified Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={handoffWeight}
                    onChange={e => setHandoffWeight(e.target.value)}
                    step="0.1"
                    min="0.1"
                    placeholder="Weight in kg"
                    className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-charcoal/50">
                  <MapPin className="h-3 w-3" />
                  GPS location will be captured automatically
                </div>
                {!online && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-xs">
                    <WifiOff className="h-4 w-4 flex-shrink-0" />
                    Offline — handoff will be queued and synced when online
                  </div>
                )}
                {handoffError && <p className="text-red-600 text-sm">{handoffError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setSelectedBatch(null)} className="flex-1 py-2.5 border border-cream-200 rounded-xl text-sm text-charcoal/70 hover:bg-cream transition-colors">Cancel</button>
                  <button
                    onClick={handleHandoff}
                    disabled={submitting || !handoffTo}
                    className="flex-1 py-2.5 bg-forest text-cream rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-forest-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Submitting…' : online ? <><CheckCircle2 className="h-4 w-4" /> Confirm Handoff</> : <><Clock className="h-4 w-4" /> Queue Handoff</>}
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

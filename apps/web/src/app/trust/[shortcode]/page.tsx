'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, MapPin, Scale,
  Clock, User, ArrowRight, Leaf, ExternalLink, QrCode,
} from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const EVENT_LABELS: Record<string, string> = {
  CREATED: 'Batch Created',
  PICKUP: 'Picked Up',
  HANDOFF: 'Custody Handoff',
  WEIGHT_UPDATE: 'Weight Updated',
  QUALITY_GRADED: 'Quality Graded',
  DISPATCHED: 'Dispatched to Recycler',
  RECEIVED: 'Received by Recycler',
  RECYCLED: 'Recycled',
  LOCATION_UPDATE: 'Location Update',
};

const EVENT_COLORS: Record<string, string> = {
  CREATED: 'bg-blue-100 text-blue-700 border-blue-200',
  PICKUP: 'bg-amber-100 text-amber-700 border-amber-200',
  HANDOFF: 'bg-purple-100 text-purple-700 border-purple-200',
  QUALITY_GRADED: 'bg-orange-100 text-orange-700 border-orange-200',
  DISPATCHED: 'bg-terracotta/10 text-terracotta border-terracotta/20',
  RECEIVED: 'bg-teal-100 text-teal-700 border-teal-200',
  RECYCLED: 'bg-green-100 text-green-700 border-green-200',
  WEIGHT_UPDATE: 'bg-gray-100 text-gray-700 border-gray-200',
  LOCATION_UPDATE: 'bg-gray-100 text-gray-700 border-gray-200',
};

const ROLE_LABELS: Record<string, string> = {
  HOUSEHOLD: '🏠 Household',
  RAGPICKER: '🧺 Ragpicker',
  KABADIWALA: '⚖️ Kabadiwala',
  RECYCLER: '♻️ Recycler',
  COLLECTOR: '🚛 Collector',
  ADMIN: '🔑 Admin',
};

function fmt(dt: string) {
  return new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TrustPage() {
  const params = useParams();
  const shortcode = params.shortcode as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/v1/batches/shortcode/${encodeURIComponent(shortcode)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shortcode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-forest font-medium">Verifying chain of custody…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-charcoal mb-2">Batch Not Found</h1>
          <p className="text-charcoal/60 mb-6">{error}</p>
          <Link href="/" className="text-forest underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  const { batch, verified } = data;
  const events = batch.custodyEvents || [];

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-forest/95 backdrop-blur border-b border-forest-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-terracotta" />
            <span className="font-display font-bold text-cream">GREVORO</span>
          </Link>
          <span className="text-cream/60 text-sm font-mono">{shortcode}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <QrCode className="h-4 w-4 text-forest" />
                <span className="text-charcoal/50 text-sm">Batch ID</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-forest">{batch.shortcode}</h1>
              <p className="text-charcoal/60 text-sm mt-1">{batch.description}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${
              verified
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {verified
                ? <><CheckCircle2 className="h-4 w-4" /> Chain Verified</>
                : <><XCircle className="h-4 w-4" /> Chain Invalid</>
              }
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Material', value: batch.materialType?.replace(/_/g, ' '), icon: Leaf },
              { label: 'Weight', value: `${batch.weightKg?.toFixed(1)} kg`, icon: Scale },
              { label: 'Quality', value: batch.qualityGrade || '—', icon: Shield },
              { label: 'Status', value: batch.status?.replace(/_/g, ' '), icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-cream-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-charcoal/50 text-xs mb-1">
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
                <div className="font-semibold text-charcoal text-sm">{value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-forest">
            Custody Chain · {events.length} events
          </h2>
          {batch.impactRecord && (
            <div className="bg-green-50 border border-green-200 rounded-full px-4 py-1.5 text-green-700 text-sm font-medium">
              {batch.impactRecord.co2eSavedKg?.toFixed(1)} kg CO₂e saved
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-cream-200" />

          {events.map((event: any, idx: number) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="relative flex gap-4 mb-6"
            >
              <div className="relative z-10 w-12 h-12 rounded-full bg-white border-2 border-cream-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-lg">
                  {idx === events.length - 1 ? '♻️' : idx === 0 ? '📦' : '🔗'}
                </span>
              </div>

              <div className="flex-1 bg-white rounded-xl border border-cream-200 p-4 shadow-sm">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${EVENT_COLORS[event.eventType] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {EVENT_LABELS[event.eventType] || event.eventType}
                    </span>
                    {event.anchor && (
                      <span className="text-xs bg-forest/10 text-forest px-2 py-0.5 rounded-full border border-forest/20 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Anchored
                      </span>
                    )}
                  </div>
                  <span className="text-charcoal/40 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fmt(event.createdAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {event.fromUser && (
                    <div className="flex items-center gap-1.5 text-charcoal/70">
                      <User className="h-3.5 w-3.5 text-terracotta" />
                      <span className="font-medium">{event.fromUser.name}</span>
                      <span className="text-charcoal/40 text-xs">{ROLE_LABELS[event.fromUser.role]}</span>
                    </div>
                  )}
                  {event.toUser && (
                    <div className="flex items-center gap-1.5 text-charcoal/70">
                      <ArrowRight className="h-3.5 w-3.5 text-forest" />
                      <span className="font-medium">{event.toUser.name}</span>
                      <span className="text-charcoal/40 text-xs">{ROLE_LABELS[event.toUser.role]}</span>
                    </div>
                  )}
                  {event.weightKg && (
                    <div className="flex items-center gap-1.5 text-charcoal/60 text-xs">
                      <Scale className="h-3 w-3" />
                      {event.weightKg.toFixed(2)} kg
                    </div>
                  )}
                  {event.gpsLat && (
                    <div className="flex items-center gap-1.5 text-charcoal/60 text-xs">
                      <MapPin className="h-3 w-3" />
                      {event.gpsLat.toFixed(4)}, {event.gpsLng.toFixed(4)}
                    </div>
                  )}
                </div>

                <details className="mt-3 group">
                  <summary className="text-xs text-charcoal/40 cursor-pointer hover:text-charcoal/60 select-none">
                    Hash details
                  </summary>
                  <div className="mt-2 space-y-1">
                    <div className="font-mono text-xs bg-cream rounded p-2 break-all text-charcoal/60">
                      <span className="text-charcoal/40">prev: </span>{event.prevHash}
                    </div>
                    <div className="font-mono text-xs bg-forest/5 rounded p-2 break-all text-forest/80">
                      <span className="text-forest/50">hash: </span>{event.hash}
                    </div>
                    {event.anchor && (
                      <div className="font-mono text-xs bg-green-50 rounded p-2 break-all text-green-700">
                        <span className="text-green-500">merkle root: </span>{event.anchor.rootHash}
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/impact"
            className="inline-flex items-center gap-2 bg-forest hover:bg-forest-700 text-cream font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105"
          >
            <Leaf className="h-4 w-4" />
            View Live Impact Dashboard
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

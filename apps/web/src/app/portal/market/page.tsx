'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Plus, RefreshCw, Star, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface DemandPost {
  id: string;
  materialType: string;
  minQtyKg: number;
  maxPricePerKg: number;
  locationLabel: string | null;
  qualityRequired: string | null;
  deadline: string;
  isActive: boolean;
  fulfilledKg: number;
  recycler: { id: string; name: string; role: string };
  createdAt: string;
}

interface PriceQuote {
  id: string;
  materialType: string;
  ratePerKg: number;
  sourceIndex: string;
  validFrom: string;
  validTo: string;
}

const MATERIAL_EMOJI: Record<string, string> = {
  PET_PLASTIC: '🧴', HDPE_PLASTIC: '🪣', MIXED_PLASTIC: '♻️',
  PAPER: '📄', CARDBOARD: '📦', METAL_FERROUS: '🔩',
  METAL_NON_FERROUS: '🥫', GLASS: '🫙', E_WASTE: '💻', ORGANIC: '🌿', MIXED: '🗂️',
};

const MATERIALS = Object.keys(MATERIAL_EMOJI);

export default function MarketPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'demand' | 'quotes' | 'post'>('demand');
  const [demand, setDemand] = useState<DemandPost[]>([]);
  const [quotes, setQuotes] = useState<PriceQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [postForm, setPostForm] = useState({
    materialType: 'MIXED_PLASTIC', minQtyKg: '10', maxPricePerKg: '', locationLabel: '', deadlineDays: '7',
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState(false);

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      const [d, q] = await Promise.all([
        api.get<{ posts: DemandPost[] }>('/api/v1/market/demand'),
        api.get<{ quotes: PriceQuote[] }>('/api/v1/market/quotes'),
      ]);
      setDemand(d.posts);
      setQuotes(q.quotes);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredDemand = demand.filter(d => !filter || d.materialType === filter);
  const filteredQuotes = quotes.filter(q => !filter || q.materialType === filter);

  const handlePost = async () => {
    setPostError(''); setPosting(true); setPostSuccess(false);
    try {
      await api.post('/api/v1/market/demand', {
        ...postForm,
        minQtyKg: parseFloat(postForm.minQtyKg),
        maxPricePerKg: parseFloat(postForm.maxPricePerKg) || undefined,
        deadlineDays: parseInt(postForm.deadlineDays),
      });
      setPostSuccess(true);
      fetchAll();
      setTab('demand');
    } catch (e) { setPostError((e as Error).message); }
    finally { setPosting(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">Market Board</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">Live demand posts and price quotes</p>
        </div>
        <button onClick={fetchAll} disabled={refreshing} className="p-2 rounded-xl bg-white border border-cream-200 text-charcoal/60 hover:bg-cream" title="Refresh">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-cream-200 p-1 shadow-sm">
        {(['demand', 'quotes', 'post'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${tab === t ? 'bg-forest text-cream shadow-sm' : 'text-charcoal/60 hover:text-charcoal'}`}
          >
            {t === 'demand' ? '📋 Demand' : t === 'quotes' ? '💰 Quotes' : '+ Post'}
          </button>
        ))}
      </div>

      {(tab === 'demand' || tab === 'quotes') && (
        <div className="mb-4">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 border border-cream-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest/30"
            title="Filter by material"
          >
            <option value="">All materials</option>
            {MATERIALS.map(m => <option key={m} value={m}>{MATERIAL_EMOJI[m]} {m.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      )}

      {tab === 'demand' && (
        <div className="space-y-3">
          {loading ? [1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-cream-200" />) :
            filteredDemand.length === 0 ? (
              <div className="bg-white rounded-2xl border border-cream-200 p-10 text-center text-charcoal/40 text-sm">No active demand posts</div>
            ) : filteredDemand.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{MATERIAL_EMOJI[post.materialType] || '♻️'}</span>
                      <span className="font-semibold text-charcoal text-sm">{post.materialType.replace(/_/g, ' ')}</span>
                      {post.qualityRequired && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                          <Star className="h-2.5 w-2.5" /> Grade {post.qualityRequired}+
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-charcoal/60">
                      <span>Min {post.minQtyKg} kg</span>
                      <span className="font-semibold text-green-600">Up to ₹{post.maxPricePerKg}/kg</span>
                      {post.locationLabel && <span>📍 {post.locationLabel}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(post.deadline).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-xs text-charcoal/40 mt-1">by {post.recycler?.name} · {post.fulfilledKg?.toFixed(1)} kg fulfilled</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${post.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {post.isActive ? 'OPEN' : 'CLOSED'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          }
        </div>
      )}

      {tab === 'quotes' && (
        <div className="space-y-3">
          {loading ? [1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-cream-200" />) :
            filteredQuotes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-cream-200 p-10 text-center text-charcoal/40 text-sm">No active price quotes</div>
            ) : filteredQuotes.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-xl border border-cream-200 p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{MATERIAL_EMOJI[q.materialType] || '♻️'}</span>
                    <span className="font-medium text-sm text-charcoal">{q.materialType.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-xs text-charcoal/50">{q.sourceIndex} · valid until {new Date(q.validTo).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-forest">₹{q.ratePerKg}</div>
                  <div className="text-xs text-charcoal/40">per kg</div>
                </div>
              </motion.div>
            ))
          }
        </div>
      )}

      {tab === 'post' && (
        <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm max-w-lg">
          <h2 className="font-display text-lg font-bold text-forest mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Post Demand
          </h2>
          {postSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">
              <CheckCircle2 className="h-4 w-4" /> Posted successfully!
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1" htmlFor="post-material">Material Type</label>
              <select id="post-material" value={postForm.materialType} onChange={e => setPostForm(f => ({ ...f, materialType: e.target.value }))}
                className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest/30">
                {MATERIALS.map(m => <option key={m} value={m}>{MATERIAL_EMOJI[m]} {m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Min Qty (kg)</label>
                <input type="number" value={postForm.minQtyKg} onChange={e => setPostForm(f => ({ ...f, minQtyKg: e.target.value }))}
                  min="1" step="0.5" placeholder="10"
                  className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Max Price/kg (₹)</label>
                <input type="number" value={postForm.maxPricePerKg} onChange={e => setPostForm(f => ({ ...f, maxPricePerKg: e.target.value }))}
                  min="1" step="0.5" placeholder="auto"
                  className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Location</label>
                <input type="text" value={postForm.locationLabel} onChange={e => setPostForm(f => ({ ...f, locationLabel: e.target.value }))}
                  placeholder="e.g. Delhi NCR"
                  className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30" />
              </div>
              <div>
                <label htmlFor="deadline-days" className="block text-sm font-medium text-charcoal mb-1">Deadline (days)</label>
                <input id="deadline-days" type="number" value={postForm.deadlineDays} onChange={e => setPostForm(f => ({ ...f, deadlineDays: e.target.value }))}
                  min="1" max="90" placeholder="e.g. 7"
                  className="w-full px-3 py-2 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest/30" />
              </div>
            </div>
            {postError && <p className="text-red-600 text-sm">{postError}</p>}
            <button onClick={handlePost} disabled={posting}
              className="w-full bg-forest text-cream py-3 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-forest-700">
              <Plus className="h-4 w-4" /> {posting ? 'Posting…' : 'Post Demand'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

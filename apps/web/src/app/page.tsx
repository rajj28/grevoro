'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Leaf, Shield, Zap, Users, BarChart3, Globe,
  ArrowRight, CheckCircle2, QrCode, Truck, Recycle,
} from 'lucide-react';

const STATS = [
  { label: 'kg Waste Tracked', value: '2.4M+', icon: Recycle },
  { label: 'Informal Workers', value: '12,000+', icon: Users },
  { label: 'CO₂e Avoided', value: '4,200 t', icon: Leaf },
  { label: 'Cities Active', value: '8', icon: Globe },
];

const FEATURES = [
  {
    icon: QrCode,
    title: 'Batch-Level Traceability',
    desc: 'Every waste batch gets a unique GRV-ID with tamper-proof custody chain.',
  },
  {
    icon: Shield,
    title: 'Blockchain Anchoring',
    desc: 'SHA-256 hash chains + Merkle tree roots anchored on-chain every 10 minutes.',
  },
  {
    icon: Zap,
    title: 'ML Classification',
    desc: 'MobileNetV2 photo classifier auto-detects material type and contamination.',
  },
  {
    icon: Truck,
    title: 'Route Optimisation',
    desc: 'AI-powered collection routes that cut travel time and fuel cost.',
  },
  {
    icon: BarChart3,
    title: 'ESG Dashboards',
    desc: 'Automated CO₂e, wage, and diversion reports for corporate buyers.',
  },
  {
    icon: Users,
    title: 'Six Portals',
    desc: 'Role-aware apps for households, ragpickers, kabadiwalas, recyclers, and admins.',
  },
];

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      <nav className="sticky top-0 z-50 bg-forest/95 backdrop-blur border-b border-forest-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-7 w-7 text-terracotta" />
            <span className="font-display text-xl font-bold text-cream">GREVORO</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/trust/GRV-K7M2QX"
              className="text-cream/80 hover:text-cream text-sm font-medium transition-colors"
            >
              Trust Explorer
            </Link>
            <Link
              href="/impact"
              className="text-cream/80 hover:text-cream text-sm font-medium transition-colors"
            >
              Live Impact
            </Link>
            <Link
              href="/portal"
              className="bg-terracotta hover:bg-terracotta-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Open Portal
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative gradient-forest min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-terracotta"
              style={{
                width: `${20 + i * 8}px`,
                height: `${20 + i * 8}px`,
                top: `${(i * 37) % 100}%`,
                left: `${(i * 53) % 100}%`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          >
            <motion.div variants={fade} className="inline-flex items-center gap-2 bg-terracotta/20 border border-terracotta/30 rounded-full px-4 py-1.5 text-terracotta-50 text-sm font-medium mb-6">
              <CheckCircle2 className="h-4 w-4" />
              Blockchain-anchored waste traceability for India
            </motion.div>

            <motion.h1 variants={fade} className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-cream mb-6 leading-tight">
              Every gram.<br />
              <span className="text-terracotta">Tracked. Trusted.</span><br />
              Transformed.
            </motion.h1>

            <motion.p variants={fade} className="text-cream/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              GREVORO connects informal waste workers to verified recycling value chains —
              creating tamper-proof custody trails, fair wages, and measurable ESG impact.
            </motion.p>

            <motion.div variants={fade} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/trust/GRV-K7M2QX"
                className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg"
              >
                <QrCode className="h-5 w-5" />
                Scan Demo Batch
              </Link>
              <Link
                href="/impact"
                className="inline-flex items-center gap-2 bg-cream/10 hover:bg-cream/20 border border-cream/30 text-cream font-semibold px-8 py-4 rounded-xl text-lg transition-all"
              >
                Live Impact
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="bg-forest py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <Icon className="h-6 w-6 text-terracotta mx-auto mb-2" />
              <div className="text-3xl font-display font-bold text-cream">{value}</div>
              <div className="text-cream/60 text-sm mt-1">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-forest mb-4">
            End-to-end waste intelligence
          </h2>
          <p className="text-charcoal/60 text-lg max-w-xl mx-auto">
            From curbside pickup to certified recycling — every step logged, every claim verifiable.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-cream-200 hover:border-terracotta/30 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-forest/10 flex items-center justify-center mb-5 group-hover:bg-terracotta/10 transition-colors">
                <Icon className="h-6 w-6 text-forest group-hover:text-terracotta transition-colors" />
              </div>
              <h3 className="font-semibold text-charcoal text-lg mb-2">{title}</h3>
              <p className="text-charcoal/60 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="gradient-forest py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-4xl font-bold text-cream mb-4">
            Ready to trace your first batch?
          </h2>
          <p className="text-cream/70 mb-8 text-lg">
            Scan batch <span className="font-mono font-bold text-terracotta">GRV-K7M2QX</span> to see
            the full chain of custody — from Dharavi household to certified recycler.
          </p>
          <Link
            href="/trust/GRV-K7M2QX"
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-700 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:scale-105"
          >
            <Shield className="h-5 w-5" />
            Verify Hero Batch
          </Link>
        </div>
      </section>

      <footer className="bg-charcoal py-10 text-center text-cream/50 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="h-4 w-4 text-terracotta" />
          <span className="font-display text-cream font-semibold">GREVORO</span>
        </div>
        <p>Traceable Waste Flow Network · Built for India · © 2025</p>
      </footer>
    </main>
  );
}

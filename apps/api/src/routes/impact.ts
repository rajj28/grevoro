import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import prisma from '../lib/prisma';
import { CO2_FACTORS, MATERIAL_LABELS } from '@grevoro/shared';

const router: ExpressRouter = Router();

router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const [totalImpact, byMaterial, recentBatches, workerStats] = await Promise.all([
      prisma.impactLedger.aggregate({
        _sum: { kgDiverted: true, co2eSavedKg: true, workerPayoutInr: true },
        _count: { id: true },
      }),
      prisma.impactLedger.groupBy({
        by: ['materialType'],
        _sum: { kgDiverted: true, co2eSavedKg: true },
        orderBy: { _sum: { kgDiverted: 'desc' } },
      }),
      prisma.wasteBatch.count({ where: { status: 'RECYCLED' } }),
      prisma.user.count({ where: { role: { in: ['RAGPICKER', 'KABADIWALA'] } } }),
    ]);

    const materialBreakdown = byMaterial.map((m) => ({
      materialType: m.materialType,
      label: MATERIAL_LABELS[m.materialType as keyof typeof MATERIAL_LABELS] || m.materialType,
      kgDiverted: m._sum.kgDiverted || 0,
      co2eSavedKg: m._sum.co2eSavedKg || 0,
    }));

    res.json({
      totalKgDiverted: totalImpact._sum.kgDiverted || 0,
      totalCo2eSavedKg: totalImpact._sum.co2eSavedKg || 0,
      totalWorkerPayoutInr: totalImpact._sum.workerPayoutInr || 0,
      batchesRecycled: recentBatches,
      informalWorkersActive: workerStats,
      materialBreakdown,
    });
  } catch (err) {
    console.error('[Impact] Summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sankey', async (_req: Request, res: Response) => {
  try {
    const flows = await prisma.custodyEvent.groupBy({
      by: ['eventType'],
      _count: { id: true },
      _sum: { weightKg: true },
    });

    const batchesByStatus = await prisma.wasteBatch.groupBy({
      by: ['status', 'materialType'],
      _count: { id: true },
      _sum: { weightKg: true },
    });

    const nodes = [
      { id: 'household', label: 'Households', category: 'source' },
      { id: 'ragpicker', label: 'Ragpickers', category: 'collector' },
      { id: 'kabadiwala', label: 'Kabadiwalas', category: 'aggregator' },
      { id: 'recycler', label: 'Recyclers', category: 'destination' },
      { id: 'landfill_avoided', label: 'Landfill Avoided', category: 'impact' },
    ];

    const links = batchesByStatus.map((b) => ({
      source: 'household',
      target: 'ragpicker',
      value: b._sum.weightKg || 0,
      material: b.materialType,
      status: b.status,
    }));

    res.json({ nodes, links, rawFlows: flows });
  } catch (err) {
    console.error('[Impact] Sankey error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/anchors', async (_req: Request, res: Response) => {
  try {
    const anchors = await prisma.merkleAnchor.findMany({
      orderBy: { anchoredAt: 'desc' },
      take: 20,
      include: { _count: { select: { events: true } } },
    });

    res.json({ anchors });
  } catch (err) {
    console.error('[Impact] Anchors error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

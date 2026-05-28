import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { CO2_FACTORS, MATERIAL_LABELS, UserRole } from '@grevoro/shared';

const router: ExpressRouter = Router();

router.get('/sankey', async (_req: Request, res: Response) => {
  try {
    const events = await prisma.custodyEvent.findMany({
      where: { fromUserId: { not: null }, toUserId: { not: null } },
      include: {
        batch: { select: { materialType: true, weightKg: true } },
        fromUser: { select: { role: true } },
        toUser: { select: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    });

    const flowMap = new Map<string, number>();
    for (const ev of events) {
      if (!ev.fromUser || !ev.toUser || !ev.batch) continue;
      const key = `${ev.fromUser.role}→${ev.toUser.role}→${ev.batch.materialType}`;
      flowMap.set(key, (flowMap.get(key) || 0) + (ev.batch.weightKg || 0));
    }

    const nodeSet = new Set<string>();
    const links: { source: string; target: string; value: number; material: string }[] = [];

    for (const [key, value] of flowMap.entries()) {
      const [from, to, material] = key.split('→');
      const sourceNode = `${from} (${material.replace(/_/g, ' ')})`;
      const targetNode = `${to}`;
      nodeSet.add(sourceNode);
      nodeSet.add(targetNode);
      links.push({ source: sourceNode, target: targetNode, value: Math.round(value * 10) / 10, material });
    }

    const nodes = Array.from(nodeSet).map(id => ({ id }));
    res.json({ nodes, links });
  } catch (err) {
    console.error('[ESG] sankey error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/report', authenticate, requireRole(UserRole.RECYCLER, UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    const startDate = from ? new Date(String(from)) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(String(to)) : new Date();

    const [ledger, anchors, topBatches] = await Promise.all([
      prisma.impactLedger.groupBy({
        by: ['materialType'],
        where: { recordedAt: { gte: startDate, lte: endDate } },
        _sum: { kgDiverted: true, co2eSavedKg: true, workerPayoutInr: true },
        _count: { id: true },
      }),
      prisma.merkleAnchor.count({
        where: { anchoredAt: { gte: startDate, lte: endDate } },
      }),
      prisma.wasteBatch.findMany({
        where: { status: 'RECYCLED', updatedAt: { gte: startDate, lte: endDate } },
        orderBy: { weightKg: 'desc' },
        take: 10,
        select: { shortcode: true, materialType: true, weightKg: true, qualityGrade: true },
      }),
    ]);

    const totalKg = ledger.reduce((s, r) => s + (r._sum.kgDiverted || 0), 0);
    const totalCo2 = ledger.reduce((s, r) => s + (r._sum.co2eSavedKg || 0), 0);
    const totalPayout = ledger.reduce((s, r) => s + (r._sum.workerPayoutInr || 0), 0);
    const totalBatches = ledger.reduce((s, r) => s + r._count.id, 0);

    const breakdown = ledger.map(r => ({
      material: MATERIAL_LABELS[r.materialType as keyof typeof MATERIAL_LABELS] || r.materialType,
      materialType: r.materialType,
      kgDiverted: r._sum.kgDiverted || 0,
      co2eSavedKg: r._sum.co2eSavedKg || 0,
      workerPayoutInr: r._sum.workerPayoutInr || 0,
      batchCount: r._count.id,
      co2Factor: CO2_FACTORS[r.materialType as keyof typeof CO2_FACTORS] || 0,
    }));

    res.json({
      period: { from: startDate, to: endDate },
      summary: {
        totalKgDiverted: totalKg,
        totalCo2eSavedKg: totalCo2,
        totalWorkerPayoutInr: totalPayout,
        totalBatchesRecycled: totalBatches,
        merkleAnchorCount: anchors,
        treesEquivalent: Math.round(totalCo2 / 21),
        carKmEquivalent: Math.round(totalCo2 / 0.12),
      },
      breakdown,
      topBatches,
    });
  } catch (err) {
    console.error('[ESG] report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

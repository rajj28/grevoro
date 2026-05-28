import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { BASE_PRICE_PER_KG } from '@grevoro/shared';

const router: ExpressRouter = Router();

router.get('/quotes', async (req: Request, res: Response) => {
  try {
    const { materialType } = req.query;
    const now = new Date();
    const where = materialType
      ? { materialType: String(materialType) as any, validTo: { gt: now } }
      : { validTo: { gt: now } };
    const quotes = await prisma.priceQuote.findMany({
      where,
      orderBy: { ratePerKg: 'desc' },
      take: 50,
    });
    res.json({ quotes });
  } catch (err) {
    console.error('[Market] quotes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/quotes', authenticate, async (req: Request, res: Response) => {
  try {
    const { materialType, ratePerKg, validHours, sourceIndex } = req.body;
    if (!materialType || !ratePerKg) {
      res.status(400).json({ error: 'materialType and ratePerKg required' });
      return;
    }
    const validFrom = new Date();
    const validTo = new Date();
    validTo.setHours(validTo.getHours() + (validHours || 24));
    const quote = await prisma.priceQuote.create({
      data: {
        materialType,
        ratePerKg: parseFloat(ratePerKg),
        sourceIndex: sourceIndex || 'GREVORO_MARKET',
        validFrom,
        validTo,
      },
    });
    res.status(201).json({ quote });
  } catch (err) {
    console.error('[Market] create quote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/demand', async (req: Request, res: Response) => {
  try {
    const { materialType, active } = req.query;
    const where: Record<string, unknown> = {};
    if (materialType) where.materialType = String(materialType);
    where.isActive = active === 'false' ? false : true;
    where.deadline = { gt: new Date() };

    const posts = await prisma.demandPost.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { recycler: { select: { id: true, name: true, role: true } } },
    });
    res.json({ posts });
  } catch (err) {
    console.error('[Market] demand error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/demand', authenticate, async (req: Request, res: Response) => {
  try {
    const { materialType, minQtyKg, maxPricePerKg, locationLabel, qualityRequired, deadlineDays } = req.body;
    if (!materialType || !minQtyKg) {
      res.status(400).json({ error: 'materialType and minQtyKg required' });
      return;
    }
    const basePrice = BASE_PRICE_PER_KG[materialType as keyof typeof BASE_PRICE_PER_KG] || 5;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (deadlineDays || 7));

    const post = await prisma.demandPost.create({
      data: {
        materialType,
        minQtyKg: parseFloat(minQtyKg),
        maxPricePerKg: parseFloat(maxPricePerKg) || basePrice * 1.2,
        locationLabel: locationLabel || null,
        qualityRequired: qualityRequired || null,
        deadline,
        recyclerId: req.user!.id,
      },
    });
    res.status(201).json({ post });
  } catch (err) {
    console.error('[Market] create demand error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/match/:batchShortcode', authenticate, async (req: Request, res: Response) => {
  try {
    const batch = await prisma.wasteBatch.findUnique({
      where: { shortcode: req.params.batchShortcode },
    });
    if (!batch) { res.status(404).json({ error: 'Batch not found' }); return; }

    const now = new Date();
    const [demandMatches, quoteMatches] = await Promise.all([
      prisma.demandPost.findMany({
        where: {
          materialType: batch.materialType,
          isActive: true,
          deadline: { gt: now },
          minQtyKg: { lte: (batch.weightKg || 0) * 2 },
        },
        orderBy: { maxPricePerKg: 'desc' },
        take: 10,
        include: { recycler: { select: { id: true, name: true, role: true } } },
      }),
      prisma.priceQuote.findMany({
        where: {
          materialType: batch.materialType,
          validTo: { gt: now },
        },
        orderBy: { ratePerKg: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      batch: { shortcode: batch.shortcode, materialType: batch.materialType, weightKg: batch.weightKg },
      demandMatches,
      quoteMatches,
      basePrice: BASE_PRICE_PER_KG[batch.materialType as keyof typeof BASE_PRICE_PER_KG] || 5,
    });
  } catch (err) {
    console.error('[Market] match error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/prices', (_req: Request, res: Response) => {
  res.json({ prices: BASE_PRICE_PER_KG });
});

export default router;

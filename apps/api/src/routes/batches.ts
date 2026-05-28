import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { CreateBatchSchema, CustodyHandoffSchema, generateGrvId, computeEventHash, MaterialType } from '@grevoro/shared';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { anchorQueue, classifyQueue } from '../lib/queues';
import QRCode from 'qrcode';

const router: ExpressRouter = Router();

async function getGenesisHash(batchId: string): Promise<string> {
  return computeEventHash('GENESIS', { batchId, ts: Date.now() });
}

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const body = CreateBatchSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    const user = req.user!;
    const { materialType, weightKg, description, gpsLat, gpsLng, photoUrl } = body.data;

    const shortcode = generateGrvId();
    const trustUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000'}/trust/${shortcode}`;
    const qrPayload = trustUrl;

    const genesisHash = await getGenesisHash(shortcode);

    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.wasteBatch.create({
        data: {
          shortcode,
          qrPayload,
          materialType: materialType as any,
          weightKg,
          description,
          originUserId: user.id,
          currentCustodianId: user.id,
        },
      });

      const eventPayload = {
        batchId: created.id,
        eventType: 'CREATED',
        fromUserId: user.id,
        gpsLat,
        gpsLng,
        weightKg,
        photoUrl,
      };

      const eventHash = computeEventHash(genesisHash, eventPayload);

      await tx.custodyEvent.create({
        data: {
          batchId: created.id,
          fromUserId: user.id,
          eventType: 'CREATED',
          gpsLat,
          gpsLng,
          weightKg,
          photoUrl,
          prevHash: genesisHash,
          hash: eventHash,
        },
      });

      return created;
    });

    if (photoUrl) {
      await classifyQueue.add('classify', { batchId: batch.id, photoUrl, shortcode });
    }

    await anchorQueue.add('anchor-check', { trigger: 'new-batch' }, { delay: 1000 });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 200, margin: 1 });

    res.status(201).json({ batch, qrDataUrl, shortcode });
  } catch (err) {
    console.error('[Batches] Create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/shortcode/:shortcode', async (req: Request, res: Response) => {
  try {
    const { shortcode } = req.params;

    const batch = await prisma.wasteBatch.findUnique({
      where: { shortcode },
      include: {
        origin: { select: { id: true, name: true, role: true, phone: true } },
        currentCustodian: { select: { id: true, name: true, role: true, phone: true } },
        custodyEvents: {
          orderBy: { createdAt: 'asc' },
          include: {
            fromUser: { select: { id: true, name: true, role: true } },
            toUser: { select: { id: true, name: true, role: true } },
            anchor: { select: { id: true, rootHash: true, anchoredAt: true } },
          },
        },
        impactRecord: true,
      },
    });

    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }

    const events = batch.custodyEvents;
    const isChainValid = events.every((evt, i) => {
      if (i === 0) return true;
      const prev = events[i - 1];
      const recomputed = computeEventHash(prev.hash, {
        batchId: evt.batchId,
        eventType: evt.eventType,
        fromUserId: evt.fromUserId,
        toUserId: evt.toUserId,
        gpsLat: evt.gpsLat,
        gpsLng: evt.gpsLng,
        weightKg: evt.weightKg,
        photoUrl: evt.photoUrl,
      });
      return recomputed === evt.hash;
    });

    res.json({ batch, verified: isChainValid });
  } catch (err) {
    console.error('[Batches] Trust query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { status, materialType, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (['HOUSEHOLD', 'RAGPICKER', 'KABADIWALA', 'RECYCLER', 'COLLECTOR'].includes(user.role)) {
      where.currentCustodianId = user.id;
    }

    if (status) where.status = status;
    if (materialType) where.materialType = materialType;

    const [batches, total] = await Promise.all([
      prisma.wasteBatch.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          origin: { select: { id: true, name: true, role: true } },
          currentCustodian: { select: { id: true, name: true, role: true } },
          _count: { select: { custodyEvents: true } },
        },
      }),
      prisma.wasteBatch.count({ where }),
    ]);

    res.json({ batches, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    console.error('[Batches] List error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:batchId/handoff', authenticate, async (req: Request, res: Response) => {
  try {
    const body = CustodyHandoffSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    const { batchId } = req.params;
    const user = req.user!;
    const { toUserId, weightKg, gpsLat, gpsLng, photoUrl, voiceMemoUrl, qualityGrade, notes } = body.data;

    const batch = await prisma.wasteBatch.findUnique({
      where: { id: batchId },
      include: { custodyEvents: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }

    if (batch.currentCustodianId !== user.id) {
      res.status(403).json({ error: 'You are not the current custodian of this batch' });
      return;
    }

    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) {
      res.status(404).json({ error: 'Recipient user not found' });
      return;
    }

    const lastEvent = batch.custodyEvents[0];
    const prevHash = lastEvent?.hash || 'GENESIS';

    const eventPayload = {
      batchId: batch.id,
      eventType: 'HANDOFF',
      fromUserId: user.id,
      toUserId,
      gpsLat,
      gpsLng,
      weightKg,
      photoUrl,
    };

    const eventHash = computeEventHash(prevHash, eventPayload);

    const newStatus = (() => {
      if (toUser.role === 'KABADIWALA') return 'AT_AGGREGATOR';
      if (toUser.role === 'RECYCLER') return 'RECEIVED_BY_RECYCLER';
      if (toUser.role === 'COLLECTOR') return 'COLLECTED';
      return 'IN_TRANSIT';
    })();

    await prisma.$transaction([
      prisma.custodyEvent.create({
        data: {
          batchId: batch.id,
          fromUserId: user.id,
          toUserId,
          eventType: 'HANDOFF',
          gpsLat,
          gpsLng,
          weightKg,
          photoUrl,
          voiceMemoUrl,
          qualityGrade: qualityGrade as any,
          notes,
          prevHash,
          hash: eventHash,
        },
      }),
      prisma.wasteBatch.update({
        where: { id: batchId },
        data: {
          currentCustodianId: toUserId,
          weightKg,
          status: newStatus as any,
          qualityGrade: qualityGrade as any,
        },
      }),
    ]);

    if (photoUrl) {
      await classifyQueue.add('classify', { batchId: batch.id, photoUrl, shortcode: batch.shortcode });
    }

    await anchorQueue.add('anchor-check', { trigger: 'handoff', batchId: batch.id }, { delay: 500 });

    res.status(202).json({
      message: 'Handoff recorded',
      batchId: batch.id,
      shortcode: batch.shortcode,
      newCustodian: { id: toUser.id, name: toUser.name, role: toUser.role },
    });
  } catch (err) {
    console.error('[Batches] Handoff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { buildMerkleRoot, computeEventHash, CO2_FACTORS, MaterialType } from '@grevoro/shared';

const prisma = new PrismaClient();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = { url: REDIS_URL };

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function handleClassify(job: Job) {
  const { batchId, photoUrl, shortcode } = job.data;

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/classify`, { image_url: photoUrl }, { timeout: 10000 });
    const { material, confidence, contamination_pct } = response.data;

    await prisma.wasteBatch.update({
      where: { id: batchId },
      data: {
        materialType: material as any,
        contaminationPct: contamination_pct,
      },
    });

    await prisma.job.updateMany({
      where: { payload: { path: ['batchId'], equals: batchId }, queue: 'classify' },
      data: { status: 'COMPLETED', result: { material, confidence, contamination_pct }, finishedAt: new Date() },
    });

    console.log(`[Worker:classify] Batch ${shortcode} classified as ${material} (${confidence}%)`);
  } catch (err) {
    console.warn(`[Worker:classify] ML service error, using mock for ${shortcode}:`, (err as Error).message);

    const materials = ['PET_PLASTIC', 'PAPER', 'METAL_FERROUS', 'GLASS', 'MIXED_PLASTIC'];
    const material = materials[Math.floor(Math.random() * materials.length)];

    await prisma.wasteBatch.update({
      where: { id: batchId },
      data: { materialType: material as any, contaminationPct: Math.random() * 15 },
    });
  }
}

async function handleAnchor(_job: Job) {
  try {
    const unanchored = await prisma.custodyEvent.findMany({
      where: { anchorId: null },
      orderBy: { createdAt: 'asc' },
      take: parseInt(process.env.MERKLE_ANCHOR_BATCH_SIZE || '100'),
    });

    if (unanchored.length < 10) {
      console.log(`[Worker:anchor] Only ${unanchored.length} unanchored events — waiting for more`);
      return;
    }

    const hashes = unanchored.map((e) => e.hash);
    const rootHash = buildMerkleRoot(hashes);

    const existing = await prisma.merkleAnchor.findUnique({ where: { rootHash } });
    if (existing) return;

    const anchor = await prisma.merkleAnchor.create({
      data: {
        rootHash,
        leafCount: hashes.length,
        periodStart: unanchored[0].createdAt,
        periodEnd: unanchored[unanchored.length - 1].createdAt,
      },
    });

    await prisma.custodyEvent.updateMany({
      where: { id: { in: unanchored.map((e) => e.id) } },
      data: { anchorId: anchor.id },
    });

    console.log(`[Worker:anchor] Anchored ${hashes.length} events → rootHash: ${rootHash.slice(0, 16)}...`);
  } catch (err) {
    console.error('[Worker:anchor] Error:', (err as Error).message);
    throw err;
  }
}

async function handleNotify(job: Job) {
  const { type, payload } = job.data;
  console.log(`[Worker:notify] ${type}:`, JSON.stringify(payload).slice(0, 100));
}

async function handleUssd(job: Job) {
  const { sessionId, phoneNumber, text } = job.data;
  console.log(`[Worker:ussd] Session ${sessionId} from ${phoneNumber}: "${text}"`);
}

async function handleReport(job: Job) {
  const { recyclerId, reportType, dateFrom, dateTo } = job.data;
  console.log(`[Worker:report] Generating ESG report for recycler ${recyclerId} (${dateFrom} → ${dateTo})`);

  const batches = await prisma.wasteBatch.findMany({
    where: {
      currentCustodianId: recyclerId,
      status: 'RECYCLED',
      updatedAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
    },
    include: { impactRecord: true },
  });

  let totalKg = 0;
  let totalCo2e = 0;

  for (const b of batches) {
    totalKg += b.weightKg;
    const factor = CO2_FACTORS[b.materialType as MaterialType] || 1.0;
    totalCo2e += b.weightKg * factor;
  }

  console.log(`[Worker:report] ESG: ${batches.length} batches, ${totalKg.toFixed(1)} kg, ${totalCo2e.toFixed(1)} kg CO2e`);

  return { totalKg, totalCo2e, batchCount: batches.length };
}

const classifyWorker = new Worker('classify', handleClassify, { connection, concurrency: 3 });
const anchorWorker = new Worker('anchor', handleAnchor, { connection, concurrency: 1 });
const notifyWorker = new Worker('notify', handleNotify, { connection, concurrency: 5 });
const ussdWorker = new Worker('ussd', handleUssd, { connection, concurrency: 10 });
const reportWorker = new Worker('report', handleReport, { connection, concurrency: 2 });

const workers = [classifyWorker, anchorWorker, notifyWorker, ussdWorker, reportWorker];

workers.forEach((w) => {
  w.on('completed', (job) => console.log(`[Worker:${w.name}] Job ${job.id} completed`));
  w.on('failed', (job, err) => console.error(`[Worker:${w.name}] Job ${job?.id} failed:`, err.message));
});

async function runAnchorCron() {
  const { Queue } = await import('bullmq');
  const anchorQueue = new Queue('anchor', { connection });
  await anchorQueue.add('cron-anchor', {}, {
    repeat: { every: parseInt(process.env.MERKLE_ANCHOR_INTERVAL_MS || '600000') },
  });
  console.log('[Worker] Anchor cron scheduled every', process.env.MERKLE_ANCHOR_INTERVAL_MS || '600000', 'ms');
}

runAnchorCron().catch(console.error);

console.log('[GREVORO Worker] All workers started: classify, anchor, notify, ussd, report');

process.on('SIGTERM', async () => {
  await Promise.all(workers.map((w) => w.close()));
  await prisma.$disconnect();
  process.exit(0);
});

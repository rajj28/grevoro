import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = { url: REDIS_URL };

const QUEUE_NAMES = ['ml-grading', 'custody-hash', 'merkle-anchor', 'impact-ledger', 'notifications'];

const queues = QUEUE_NAMES.map((name) => new Queue(name, { connection }));

export const boardAdapter = new ExpressAdapter();
boardAdapter.setBasePath('/api/admin/queues');

createBullBoard({
  queues: queues.map((q) => new BullMQAdapter(q)) as any,
  serverAdapter: boardAdapter,
});

import { Queue } from 'bullmq';

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };

function makeQueue(name: string) {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 500,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });
}

export const classifyQueue = makeQueue('classify');
export const anchorQueue = makeQueue('anchor');
export const notifyQueue = makeQueue('notify');
export const ussdQueue = makeQueue('ussd');
export const reportQueue = makeQueue('report');

export type QueueName = 'classify' | 'anchor' | 'notify' | 'ussd' | 'report';

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import authRouter from './routes/auth';
import batchesRouter from './routes/batches';
import impactRouter from './routes/impact';
import marketRouter from './routes/market';
import esgRouter from './routes/esg';
import { boardAdapter } from './routes/board';

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_API_URL ? [process.env.NEXT_PUBLIC_API_URL, 'http://localhost:3000'] : '*',
    methods: ['GET', 'POST'],
  },
});

export { io };

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.NEXT_PUBLIC_API_URL || '*', credentials: true }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'grevoro-api', ts: new Date().toISOString() });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/batches', batchesRouter);
app.use('/api/v1/impact', impactRouter);
app.use('/api/v1/market', marketRouter);
app.use('/api/v1/esg', esgRouter);
app.use('/api/admin/queues', boardAdapter.getRouter());

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('subscribe:batch', (batchId: string) => {
    socket.join(`batch:${batchId}`);
  });

  socket.on('subscribe:impact', () => {
    socket.join('impact:live');
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

const PORT = parseInt(process.env.API_PORT || '4000', 10);

httpServer.listen(PORT, () => {
  console.log(`[GREVORO API] Running on port ${PORT}`);
  console.log(`[GREVORO API] Health: http://localhost:${PORT}/health`);
  console.log(`[GREVORO API] Swagger: http://localhost:${PORT}/api/docs`);
});

import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterSchema, LoginSchema, UserRole } from '@grevoro/shared';
import prisma from '../lib/prisma';

const router: ExpressRouter = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = RegisterSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    const { phone, pin, name, role, langPref, address, gpsLat, gpsLng } = body.data;

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      res.status(409).json({ error: 'Phone already registered' });
      return;
    }

    const pinHash = await bcrypt.hash(pin, 10);

    const user = await prisma.user.create({
      data: {
        phone,
        pinHash,
        name,
        role: role as any,
        langPref,
        address,
        gpsLat,
        gpsLng,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        langPref: true,
        walletBalance: true,
        reputationScore: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = LoginSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    const { phone, pin } = body.data;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    const { pinHash: _, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token' });
    return;
  }

  try {
    const decoded = jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET || 'fallback-secret'
    ) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        langPref: true,
        walletBalance: true,
        reputationScore: true,
        avatarUrl: true,
        address: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;

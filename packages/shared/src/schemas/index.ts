import { z } from 'zod';
import { UserRole, MaterialType, BatchStatus, CustodyEventType, QualityGrade } from '../types/roles';

export const LoginSchema = z.object({
  phone: z.string().min(10).max(15),
  pin: z.string().length(4),
});

export const RegisterSchema = z.object({
  phone: z.string().min(10).max(15),
  pin: z.string().length(4),
  name: z.string().min(2).max(100),
  role: z.nativeEnum(UserRole),
  langPref: z.string().default('en'),
  address: z.string().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
});

export const CreateBatchSchema = z.object({
  materialType: z.nativeEnum(MaterialType),
  weightKg: z.number().positive(),
  description: z.string().optional(),
  gpsLat: z.number(),
  gpsLng: z.number(),
  photoUrl: z.string().url().optional(),
});

export const CustodyHandoffSchema = z.object({
  batchId: z.string(),
  toUserId: z.string(),
  weightKg: z.number().positive(),
  gpsLat: z.number(),
  gpsLng: z.number(),
  photoUrl: z.string().url().optional(),
  voiceMemoUrl: z.string().url().optional(),
  pinSignature: z.string().length(4),
  qualityGrade: z.nativeEnum(QualityGrade).optional(),
  notes: z.string().optional(),
});

export const DemandPostSchema = z.object({
  materialType: z.nativeEnum(MaterialType),
  minQtyKg: z.number().positive(),
  maxPricePerKg: z.number().positive(),
  locationGeohash: z.string().optional(),
  locationLabel: z.string().optional(),
  deadline: z.string().datetime(),
  qualityRequired: z.nativeEnum(QualityGrade).optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;
export type CustodyHandoffInput = z.infer<typeof CustodyHandoffSchema>;
export type DemandPostInput = z.infer<typeof DemandPostSchema>;

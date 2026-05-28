import { MaterialType } from '../types/roles';

export const CO2_FACTORS: Record<MaterialType, number> = {
  [MaterialType.PET_PLASTIC]: 2.53,
  [MaterialType.HDPE_PLASTIC]: 1.93,
  [MaterialType.MIXED_PLASTIC]: 1.8,
  [MaterialType.PAPER]: 1.06,
  [MaterialType.CARDBOARD]: 0.9,
  [MaterialType.METAL_FERROUS]: 1.46,
  [MaterialType.METAL_NON_FERROUS]: 9.2,
  [MaterialType.GLASS]: 0.31,
  [MaterialType.E_WASTE]: 0.0,
  [MaterialType.ORGANIC]: 0.58,
  [MaterialType.MIXED]: 1.2,
};

export const BASE_PRICE_PER_KG: Record<MaterialType, number> = {
  [MaterialType.PET_PLASTIC]: 12,
  [MaterialType.HDPE_PLASTIC]: 10,
  [MaterialType.MIXED_PLASTIC]: 6,
  [MaterialType.PAPER]: 8,
  [MaterialType.CARDBOARD]: 5,
  [MaterialType.METAL_FERROUS]: 22,
  [MaterialType.METAL_NON_FERROUS]: 180,
  [MaterialType.GLASS]: 2,
  [MaterialType.E_WASTE]: 50,
  [MaterialType.ORGANIC]: 1,
  [MaterialType.MIXED]: 4,
};

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  [MaterialType.PET_PLASTIC]: 'PET Plastic',
  [MaterialType.HDPE_PLASTIC]: 'HDPE Plastic',
  [MaterialType.MIXED_PLASTIC]: 'Mixed Plastic',
  [MaterialType.PAPER]: 'Paper',
  [MaterialType.CARDBOARD]: 'Cardboard',
  [MaterialType.METAL_FERROUS]: 'Ferrous Metal',
  [MaterialType.METAL_NON_FERROUS]: 'Non-Ferrous Metal',
  [MaterialType.GLASS]: 'Glass',
  [MaterialType.E_WASTE]: 'E-Waste',
  [MaterialType.ORGANIC]: 'Organic',
  [MaterialType.MIXED]: 'Mixed',
};

export const MATERIAL_COLORS: Record<MaterialType, string> = {
  [MaterialType.PET_PLASTIC]: '#3B82F6',
  [MaterialType.HDPE_PLASTIC]: '#60A5FA',
  [MaterialType.MIXED_PLASTIC]: '#93C5FD',
  [MaterialType.PAPER]: '#F59E0B',
  [MaterialType.CARDBOARD]: '#D97706',
  [MaterialType.METAL_FERROUS]: '#6B7280',
  [MaterialType.METAL_NON_FERROUS]: '#EAB308',
  [MaterialType.GLASS]: '#34D399',
  [MaterialType.E_WASTE]: '#8B5CF6',
  [MaterialType.ORGANIC]: '#22C55E',
  [MaterialType.MIXED]: '#9CA3AF',
};

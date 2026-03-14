// shared/entitlements/entitlements.ts

export type PlanTier = 'essential' | 'professional' | 'enterprise';

export const TIER_RANK: Record<PlanTier, number> = {
  essential: 1,
  professional: 2,
  enterprise: 3,
};

export const tierLabel = (tier: PlanTier) => tier[0].toUpperCase() + tier.slice(1);

export const hasTier = (current: PlanTier, required: PlanTier) => TIER_RANK[current] >= TIER_RANK[required];

export type FeatureStatus = 'beta' | 'new' | 'deprecated';

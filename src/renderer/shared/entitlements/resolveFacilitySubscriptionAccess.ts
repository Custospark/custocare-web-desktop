/**
 * Prefer live subscription API over cached Redux context.
 * When the API reports `has_access: false` (e.g. trial ended), do not trust stale cache.
 */
export function resolveFacilitySubscriptionAccess(
  liveHasAccess: boolean | undefined,
  cachedHasAccess: boolean | undefined,
): boolean {
  if (liveHasAccess === true) {
    return true;
  }
  if (liveHasAccess === false) {
    return false;
  }
  return cachedHasAccess === true;
}

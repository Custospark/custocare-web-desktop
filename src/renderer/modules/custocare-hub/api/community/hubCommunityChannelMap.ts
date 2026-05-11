import type { HubCommunityChannel } from './hubCommunityTypes';

/** Maps Custocare Hub action path segments to API `channel` values. */
export function hubCommunityChannelFromActionKey(actionKey: string): HubCommunityChannel | null {
  switch (actionKey) {
    case 'view-discussions':
      return 'discussion';
    case 'feature-ideas':
      return 'feature_idea';
    case 'product-updates':
      return 'product_update';
    default:
      return null;
  }
}

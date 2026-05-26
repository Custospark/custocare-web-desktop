import type { UnifiedUserProfile } from '../types/userTypes';

/** First name for greetings — profile.first_name, else first token of display name. */
export function getUserFirstName(user: UnifiedUserProfile | null): string | null {
  if (!user) return null;

  const first = user.profile?.first_name?.trim();
  if (first) return first;

  const display =
    user.profile?.display_name?.trim() ||
    user.profile?.full_name?.trim() ||
    user.name?.trim();
  if (!display) return null;

  return display.split(/\s+/)[0] ?? null;
}

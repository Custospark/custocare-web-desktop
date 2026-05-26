import type { MessageContact, MessageContactLinkedUser } from './MessageContactTypes';

export const linkedUserDisplayName = (user: MessageContactLinkedUser | null | undefined): string | null => {
  if (!user) return null;
  const fromDisplay = (user.display_name ?? '').trim();
  if (fromDisplay) return fromDisplay;
  const fromNames = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return fromNames || null;
};

/** Custocare account name for a notebook entry (API field or linked_user). */
export const custocareUserName = (contact: MessageContact): string | null =>
  contact.custocare_user_name ?? linkedUserDisplayName(contact.linked_user);

/** Client-side filter over fields returned by the API (notebook label, Custocare name, email, phone). */
export const filterMessageContacts = (
  contacts: MessageContact[],
  query: string,
): MessageContact[] => {
  const q = query.trim().toLowerCase();
  if (!q) return contacts;

  const qDigits = q.replace(/\D/g, '');

  return contacts.filter((contact) => {
    const parts = [
      contact.display_name,
      custocareUserName(contact),
      contact.email,
      contact.phone,
      contact.linked_user?.display_name,
      contact.linked_user?.first_name,
      contact.linked_user?.last_name,
    ]
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
      .map((v) => v.toLowerCase());

    if (parts.some((p) => p.includes(q))) return true;

    if (qDigits.length >= 3) {
      const phoneDigits = (contact.phone ?? '').replace(/\D/g, '');
      if (phoneDigits.includes(qDigits)) return true;
    }

    return false;
  });
};

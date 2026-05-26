/**
 * Multi-select picker for message contacts notebook (compose recipients).
 */

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookUser, Search, X, CheckCircle2, Mail, Phone, Users,
} from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import { useGetMessageContacts } from '../../../api/messageContacts/MessageContactQueries';
import type { MessageContact } from '../../../api/messageContacts/MessageContactTypes';
import { custocareUserName, filterMessageContacts } from '../../../api/messageContacts/messageContactDisplay';
import { validateEmail, normalizePhoneInput, isValidInternationalPhone } from '../../../../../shared/utils/phoneNumber';
import type { Recipient } from './composeTypes';

export type RecipientTargetField = 'to' | 'cc' | 'bcc';
export type ContactChannel = 'email' | 'phone';

export interface NotebookRecipientPick {
  contact: MessageContact;
  channel: ContactChannel;
}

interface ComposeContactPickerProps {
  theme: 'light' | 'dark';
  open: boolean;
  onClose: () => void;
  defaultTarget?: RecipientTargetField;
  recipientsByField: {
    to: Recipient[];
    cc: Recipient[];
    bcc: Recipient[];
  };
  onAddRecipients: (target: RecipientTargetField, picks: NotebookRecipientPick[]) => void;
}

const defaultChannelFor = (contact: MessageContact): ContactChannel | null => {
  if (contact.email && validateEmail(contact.email)) return 'email';
  if (contact.phone && isValidInternationalPhone(normalizePhoneInput(contact.phone))) return 'phone';
  return null;
};

const isAlreadyAdded = (
  target: RecipientTargetField,
  channel: ContactChannel,
  contact: MessageContact,
  recipientsByField: ComposeContactPickerProps['recipientsByField'],
): boolean => {
  const list = recipientsByField[target];
  if (channel === 'email' && contact.email) {
    const email = contact.email.toLowerCase();
    return list.some((r) => r.contactType === 'email' && r.email.toLowerCase() === email);
  }
  if (channel === 'phone' && contact.phone) {
    const phone = normalizePhoneInput(contact.phone);
    return list.some(
      (r) => r.contactType === 'phone' && normalizePhoneInput(r.phone || '') === phone,
    );
  }
  return true;
};

export const ComposeContactPicker: React.FC<ComposeContactPickerProps> = ({
  theme,
  open,
  onClose,
  defaultTarget = 'to',
  recipientsByField,
  onAddRecipients,
}) => {
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<RecipientTargetField>(defaultTarget);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [channelById, setChannelById] = useState<Record<number, ContactChannel>>({});

  const { data, isLoading } = useGetMessageContacts(
    { per_page: 100 },
    { enabled: open },
  );

  const contacts = useMemo(() => data?.data ?? [], [data?.data]);

  const selectableContacts = useMemo(() => {
    const filtered = filterMessageContacts(contacts, search);
    return filtered.filter((c) => c.can_message && defaultChannelFor(c) !== null);
  }, [contacts, search]);

  const toggleContact = useCallback((contact: MessageContact) => {
    const ch = channelById[contact.id] ?? defaultChannelFor(contact);
    if (!ch) return;
    if (isAlreadyAdded(target, ch, contact, recipientsByField)) return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(contact.id)) {
        next.delete(contact.id);
      } else {
        next.add(contact.id);
        setChannelById((m) => ({ ...m, [contact.id]: ch }));
      }
      return next;
    });
  }, [channelById, target, recipientsByField]);

  const setChannel = (contactId: number, channel: ContactChannel) => {
    setChannelById((m) => ({ ...m, [contactId]: channel }));
  };

  const handleSelectAll = () => {
    const next = new Set<number>();
    const channels: Record<number, ContactChannel> = {};
    for (const c of selectableContacts) {
      const ch = channelById[c.id] ?? defaultChannelFor(c)!;
      if (!isAlreadyAdded(target, ch, c, recipientsByField)) {
        next.add(c.id);
        channels[c.id] = ch;
      }
    }
    setSelected(next);
    setChannelById((m) => ({ ...m, ...channels }));
  };

  const handleClearSelection = () => setSelected(new Set());

  const handleConfirm = () => {
    const picks: NotebookRecipientPick[] = [];
    for (const id of selected) {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) continue;
      const channel = channelById[id] ?? defaultChannelFor(contact);
      if (!channel) continue;
      if (isAlreadyAdded(target, channel, contact, recipientsByField)) continue;
      picks.push({ contact, channel });
    }
    if (picks.length > 0) {
      onAddRecipients(target, picks);
    }
    onClose();
  };

  const selectedCount = selected.size;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 shadow-2xl',
              isDark ? 'border-gray-600 bg-gray-900' : 'border-gray-200 bg-white',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-between border-b-2 px-4 py-3',
                isDark ? 'border-gray-700' : 'border-gray-200',
              )}
            >
              <div className="flex items-center gap-2">
                <BookUser className={cn('h-5 w-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
                <h3 className="font-semibold">Add from contacts</h3>
              </div>
              <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1 hover:opacity-80">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 border-b-2 px-4 py-3" style={{ borderColor: isDark ? undefined : undefined }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>Add to</span>
                {(['to', 'cc', 'bcc'] as const).map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => setTarget(field)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium uppercase cursor-pointer',
                      target === field
                        ? isDark
                          ? 'border-blue-500 bg-blue-600/40 text-blue-100'
                          : 'border-blue-400 bg-blue-100 text-blue-800'
                        : isDark
                          ? 'border-gray-700 text-gray-400 hover:bg-gray-800'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {field}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search
                  className={cn(
                    'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                    isDark ? 'text-gray-500' : 'text-gray-400',
                  )}
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, or phone…"
                  className={cn(
                    'w-full rounded-lg border-2 py-2 pl-10 pr-3 text-sm outline-none',
                    isDark
                      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500'
                      : 'border-gray-300 bg-white text-gray-900',
                  )}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={cn('text-xs font-medium cursor-pointer', isDark ? 'text-blue-400' : 'text-blue-600')}
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className={cn('text-xs cursor-pointer', isDark ? 'text-gray-400' : 'text-gray-500')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {isLoading ? (
                <p className={cn('px-2 py-4 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Loading contacts…</p>
              ) : selectableContacts.length === 0 ? (
                <p className={cn('px-2 py-4 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  No Custocare contacts found. Add contacts under Messages → Contacts (email or phone must exist on Custocare).
                </p>
              ) : (
                <ul className="space-y-1">
                  {selectableContacts.map((contact) => {
                    const defaultCh = defaultChannelFor(contact)!;
                    const channel = channelById[contact.id] ?? defaultCh;
                    const hasEmail = contact.email && validateEmail(contact.email);
                    const hasPhone =
                      contact.phone && isValidInternationalPhone(normalizePhoneInput(contact.phone));
                    const isChecked = selected.has(contact.id);
                    const alreadyAdded = isAlreadyAdded(target, channel, contact, recipientsByField);

                    return (
                      <li
                        key={contact.id}
                        className={cn(
                          'rounded-xl border-2 px-3 py-2 transition-colors',
                          alreadyAdded && 'opacity-50',
                          isChecked
                            ? isDark
                              ? 'border-blue-500/50 bg-blue-900/20'
                              : 'border-blue-300 bg-blue-50'
                            : isDark
                              ? 'border-transparent hover:bg-gray-800'
                              : 'border-transparent hover:bg-gray-50',
                        )}
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 shrink-0 cursor-pointer"
                            checked={isChecked}
                            disabled={alreadyAdded}
                            onChange={() => toggleContact(contact)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">{contact.display_name}</span>
                              <CheckCircle2
                                className={cn('h-3.5 w-3.5 shrink-0', isDark ? 'text-green-400' : 'text-green-600')}
                              />
                            </div>
                            {custocareUserName(contact) && (
                              <p className={cn('truncate text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                                {custocareUserName(contact)}
                              </p>
                            )}
                            {hasEmail && (
                              <p className={cn('mt-0.5 flex items-center gap-1 truncate text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                                <Mail className="h-3 w-3 shrink-0" /> {contact.email}
                              </p>
                            )}
                            {hasPhone && (
                              <p className={cn('mt-0.5 flex items-center gap-1 truncate text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                                <Phone className="h-3 w-3 shrink-0" /> {contact.phone}
                              </p>
                            )}
                            {hasEmail && hasPhone && isChecked && !alreadyAdded && (
                              <div className="mt-2 flex gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setChannel(contact.id, 'email');
                                  }}
                                  className={cn(
                                    'rounded border px-2 py-0.5 text-xs cursor-pointer',
                                    channel === 'email'
                                      ? isDark
                                        ? 'border-blue-500 bg-blue-600/30 text-blue-200'
                                        : 'border-blue-400 bg-blue-100 text-blue-700'
                                      : isDark
                                        ? 'border-gray-600 text-gray-400'
                                        : 'border-gray-300 text-gray-600',
                                  )}
                                >
                                  Use email
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setChannel(contact.id, 'phone');
                                  }}
                                  className={cn(
                                    'rounded border px-2 py-0.5 text-xs cursor-pointer',
                                    channel === 'phone'
                                      ? isDark
                                        ? 'border-blue-500 bg-blue-600/30 text-blue-200'
                                        : 'border-blue-400 bg-blue-100 text-blue-700'
                                      : isDark
                                        ? 'border-gray-600 text-gray-400'
                                        : 'border-gray-300 text-gray-600',
                                  )}
                                >
                                  Use phone
                                </button>
                              </div>
                            )}
                            {alreadyAdded && (
                              <p className={cn('mt-1 text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                                Already in {target.toUpperCase()}
                              </p>
                            )}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div
              className={cn(
                'flex items-center justify-between gap-3 border-t-2 px-4 py-3',
                isDark ? 'border-gray-700' : 'border-gray-200',
              )}
            >
              <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                <Users className="mr-1 inline h-3.5 w-3.5" />
                {selectedCount} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'rounded-lg border-2 px-4 py-2 text-sm font-medium cursor-pointer',
                    isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700',
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={handleConfirm}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium text-white cursor-pointer disabled:opacity-50',
                    isDark ? 'bg-blue-600' : 'bg-blue-600',
                  )}
                >
                  Add to {target.toUpperCase()}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComposeContactPicker;

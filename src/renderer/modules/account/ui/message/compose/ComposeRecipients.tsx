/**
 * ============================================================================
 * COMPOSE RECIPIENTS — EMAIL OR PHONE
 * ============================================================================
 * Features:
 *  - Recipients by email or phone (internal users resolved on the API by hash)
 *  - In-memory / localStorage auto-suggestions (frequency-ranked)
 *  - CC / BCC toggleable rows
 *  - Paste handling (comma/semicolon separated)
 *  - Per-chip validation badges
 *  - Keyboard navigation of suggestion dropdown
 */

import React, {
  useState, useCallback, useRef, useMemo,
} from 'react';
import {
  X, AlertCircle, Mail, Phone, BookUser, UserPlus, Users, Search,
} from 'lucide-react';
import { ComposeContactPicker, type NotebookRecipientPick, type RecipientTargetField } from './ComposeContactPicker';
import type { Recipient, StoredContact } from './composeTypes';
import { cn } from '../../../../../shared/types/cn';
import { loadStoredContacts } from './useComposeState';
import { PhoneInputWithCountryCode } from '../../../../../shared/components/Forms/PhoneInputWithCountryCode';
import {
  useGetMessageContacts,
  useTouchMessageContact,
} from '../../../api/messageContacts/MessageContactQueries';
import type { MessageContact } from '../../../api/messageContacts/MessageContactTypes';
import { filterMessageContacts } from '../../../api/messageContacts/messageContactDisplay';
import {
  isValidInternationalPhone,
  looksLikeEmailInput,
  looksLikePhoneInput,
  normalizePhoneInput,
  validateEmail,
} from '../../../../../shared/utils/phoneNumber';

/* ── helpers ────────────────────────────────────────────────────── */

const filterContacts = (query: string, contacts: StoredContact[]): StoredContact[] => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...contacts].sort((a, b) => b.useCount - a.useCount).slice(0, 12);
  }
  const qDigits = q.replace(/\D/g, '');
  return contacts
    .filter(c =>
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      (qDigits.length >= 3 && c.phone?.replace(/\D/g, '').includes(qDigits)) ||
      c.name?.toLowerCase().includes(q),
    )
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 12);
};

const MAX_SUGGESTIONS = 20;

const notebookToStored = (contact: MessageContact): StoredContact => ({
  id: `nb_${contact.id}`,
  name: contact.display_name,
  email: contact.email ?? '',
  phone: contact.phone ?? undefined,
  useCount: 0,
  lastUsed: contact.last_used_at ? Date.parse(contact.last_used_at) : 0,
});

const mergeContactSuggestions = (
  local: StoredContact[],
  notebook: MessageContact[],
): StoredContact[] => {
  const merged = [...notebook.map(notebookToStored), ...local];
  const seen = new Set<string>();
  const result: StoredContact[] = [];
  for (const item of merged) {
    const key = (item.email || item.phone || item.id).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result.slice(0, MAX_SUGGESTIONS);
};

type RecipientInputMode = 'email' | 'phone';

const filterNotebookForMode = (
  contacts: MessageContact[],
  query: string,
  mode: RecipientInputMode,
): MessageContact[] => {
  const filtered = filterMessageContacts(
    contacts.filter((c) => c.can_message),
    query,
  );

  return filtered.filter((c) =>
    mode === 'email'
      ? Boolean(c.email && validateEmail(c.email))
      : Boolean(c.phone && isValidInternationalPhone(normalizePhoneInput(c.phone))),
  );
};

/** Suppress browser autofill on compose recipient fields. */
const NO_BROWSER_AUTOCOMPLETE = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
  'data-form-type': 'other',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
} as const;

/* ── chip ───────────────────────────────────────────────────────── */
interface RecipientChipProps {
  recipient: Recipient;
  isDark: boolean;
  onRemove: () => void;
}

const RecipientChip: React.FC<RecipientChipProps> = ({ recipient, isDark, onRemove }) => {
  const isInvalid = !recipient.isValid;
  const isPhone = recipient.contactType === 'phone';
  const primaryLabel = isPhone
    ? (recipient.name && recipient.name !== recipient.phone ? recipient.name : recipient.phone || '')
    : (recipient.name && recipient.name !== recipient.email ? recipient.name : recipient.email);

  return (
    <span
      title={isPhone ? (recipient.phone || '') : recipient.email}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm group max-w-[200px] border',
        isInvalid
          ? isDark
            ? 'bg-red-900/20 text-red-300 border-red-500/40'
            : 'bg-red-50 text-red-600 border-red-200'
          : isDark
            ? 'bg-blue-900/20 text-blue-300 border-blue-500/30'
            : 'bg-blue-50 text-blue-700 border-blue-200',
      )}
    >
      {isInvalid ? (
        <AlertCircle className="w-3 h-3 shrink-0" />
      ) : isPhone ? (
        <Phone className="w-3 h-3 shrink-0" />
      ) : (
        <Mail className="w-3 h-3 shrink-0" />
      )}

      <span className="truncate">
        {primaryLabel}
      </span>

      <button
        onClick={onRemove}
        className={cn(
          'ml-0.5 p-0.5 rounded-full shrink-0 cursor-pointer transition-colors',
          isDark ? 'hover:bg-gray-600 hover:text-white' : 'hover:bg-gray-300 hover:text-gray-900',
        )}
        title="Remove recipient"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
};

/* ── suggestion item ─────────────────────────────────────────────── */
interface SuggestionItemProps {
  contact: StoredContact;
  isDark: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({
  contact, isDark, isHighlighted, onSelect,
}) => (
  <button
    onMouseDown={e => { e.preventDefault(); onSelect(); }}
    className={cn(
      'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer',
      isHighlighted
        ? isDark ? 'bg-blue-600/30 text-white' : 'bg-blue-50 text-blue-900'
        : isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-800',
    )}
  >
    <div
      className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
        isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700',
      )}
    >
      {contact.name
        ? contact.name[0].toUpperCase()
        : ((contact.email?.[0]
          ?? (contact.phone ? contact.phone.replace(/\D/g, '')[0] : undefined))
          ?? '?').toUpperCase()}
    </div>

    <div className="min-w-0">
      {contact.name && (
        <div className="font-medium truncate">{contact.name}</div>
      )}
      <div className={cn('truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>
        {contact.email || contact.phone || ''}
      </div>
    </div>

    {contact.useCount > 1 && (
      <span
        className={cn(
          'ml-auto text-xs px-1.5 py-0.5 rounded-full shrink-0',
          isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500',
        )}
      >
        {contact.useCount}×
      </span>
    )}
  </button>
);

interface ContactSuggestionsPanelProps {
  isDark: boolean;
  open: boolean;
  panelSearch: string;
  onPanelSearchChange: (value: string) => void;
  onPanelSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  panelSearchRef: React.RefObject<HTMLInputElement | null>;
  suggestions: StoredContact[];
  highlightIdx: number;
  onSelect: (contact: StoredContact) => void;
  inputMode: RecipientInputMode;
}

const ContactSuggestionsPanel: React.FC<ContactSuggestionsPanelProps> = ({
  isDark,
  open,
  panelSearch,
  onPanelSearchChange,
  onPanelSearchKeyDown,
  panelSearchRef,
  suggestions,
  highlightIdx,
  onSelect,
  inputMode,
}) => {
  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute top-full left-0 z-50 mt-1 w-80 overflow-hidden rounded-xl border shadow-xl',
        isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 border-b px-3 py-2 text-xs font-semibold',
          isDark ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500',
        )}
      >
        <BookUser className="w-3.5 h-3.5 shrink-0" />
        <span>Contacts & suggestions</span>
      </div>

      <div className={cn('border-b px-2 py-2', isDark ? 'border-gray-700' : 'border-gray-100')}>
        <div className="relative">
          <Search
            className={cn(
              'absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2',
              isDark ? 'text-gray-500' : 'text-gray-400',
            )}
          />
          <input
            ref={panelSearchRef}
            type="search"
            value={panelSearch}
            onChange={(e) => onPanelSearchChange(e.target.value)}
            onKeyDown={onPanelSearchKeyDown}
            placeholder={inputMode === 'email' ? 'Filter contacts (optional)…' : 'Filter contacts (optional)…'}
            className={cn(
              'w-full rounded-lg border py-1.5 pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-blue-500',
              isDark
                ? 'border-gray-700 bg-gray-900 text-white placeholder-gray-500'
                : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400',
            )}
            {...NO_BROWSER_AUTOCOMPLETE}
          />
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto">
        {suggestions.length === 0 ? (
          <p className={cn('px-3 py-4 text-center text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
            No contacts match. Try another name, email, or phone.
          </p>
        ) : (
          suggestions.map((s, i) => (
            <SuggestionItem
              key={s.id}
              contact={s}
              isDark={isDark}
              isHighlighted={i === highlightIdx}
              onSelect={() => onSelect(s)}
            />
          ))
        )}
      </div>
    </div>
  );
};

/* ── row ─────────────────────────────────────────────────────────── */
interface RecipientRowProps {
  type: 'to' | 'cc' | 'bcc';
  label: string;
  recipients: Recipient[];
  isDark: boolean;
  onAdd: (type: 'to' | 'cc' | 'bcc', input: string, name?: string) => void;
  onRemove: (type: 'to' | 'cc' | 'bcc', id: string) => void;
  onSaveToContacts?: (payload: { display_name: string; email?: string; phone?: string }) => void;
  isSavingContact?: boolean;
  error?: string;
  rightSlot?: React.ReactNode;
}

const RecipientRow: React.FC<RecipientRowProps> = ({
  type, label, recipients, isDark, onAdd, onRemove, onSaveToContacts, isSavingContact, error, rightSlot,
}) => {
  const [inputMode, setInputMode] = useState<RecipientInputMode>('email');
  const [inputValue, setInputValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [suggestions, setSuggestions] = useState<StoredContact[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [panelSearch, setPanelSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelSearchRef = useRef<HTMLInputElement>(null);
  const recipientFieldRef = useRef<HTMLDivElement>(null);
  const contacts = useMemo(() => loadStoredContacts(), []);

  const isFocusInsideRecipientField = useCallback(() => {
    const active = document.activeElement;
    if (!active) return false;
    return recipientFieldRef.current?.contains(active) ?? false;
  }, []);

  const { data: notebookList } = useGetMessageContacts({ per_page: 100 });
  const notebookContacts = useMemo(
    () => (notebookList?.data ?? []).filter((c) => c.can_message),
    [notebookList?.data],
  );

  const touchContact = useTouchMessageContact();

  const buildSuggestions = useCallback(
    (query: string, mode: RecipientInputMode) => {
      const local = filterContacts(query, contacts);
      const notebook = filterNotebookForMode(notebookContacts, query, mode);
      return mergeContactSuggestions(local, notebook);
    },
    [contacts, notebookContacts],
  );

  const refreshSuggestions = useCallback(
    (query: string, options?: { openPanel?: boolean }) => {
      const merged = buildSuggestions(query, inputMode);
      setSuggestions(merged);
      if (options?.openPanel !== false) {
        setShowContactPanel(true);
      }
      setHighlightIdx(-1);
    },
    [buildSuggestions, inputMode],
  );

  const closeContactPanel = useCallback(() => {
    setShowContactPanel(false);
    setPanelSearch('');
    setHighlightIdx(-1);
  }, []);

  const commitEmail = useCallback(
    (value: string, name?: string) => {
      const parts = value.split(/[,;]/).map(p => p.trim()).filter(Boolean);
      parts.forEach(p => onAdd(type, p, name));
      setInputValue('');
      setSuggestions([]);
      closeContactPanel();
    },
    [type, onAdd, closeContactPanel],
  );

  const commitPhone = useCallback(
    (name?: string) => {
      const normalized = normalizePhoneInput(phoneValue);
      if (!isValidInternationalPhone(normalized)) return;
      onAdd(type, normalized, name);
      setPhoneValue('');
      setSuggestions([]);
      closeContactPanel();
    },
    [type, onAdd, phoneValue, closeContactPanel],
  );

  const selectSuggestion = useCallback(
    (contact: StoredContact) => {
      if (contact.id.startsWith('nb_')) {
        const notebookId = contact.id.replace(/^nb_/, '');
        touchContact.mutate(notebookId);
      }
      if (contact.email && validateEmail(contact.email)) {
        setInputMode('email');
        commitEmail(contact.email, contact.name);
        return;
      }
      if (contact.phone) {
        setInputMode('phone');
        onAdd(type, normalizePhoneInput(contact.phone), contact.name);
        setPhoneValue('');
        closeContactPanel();
        return;
      }
    },
    [commitEmail, onAdd, touchContact, type, closeContactPanel],
  );

  const handleRecipientFieldFocus = useCallback(() => {
    const fieldQuery = inputMode === 'email' ? inputValue.trim() : phoneValue.trim();
    refreshSuggestions(fieldQuery, { openPanel: true });
  }, [inputMode, inputValue, phoneValue, refreshSuggestions]);

  const handleEmailChange = (v: string) => {
    setInputValue(v);
    if (looksLikePhoneInput(v) && !looksLikeEmailInput(v)) {
      setInputMode('phone');
      setPhoneValue(normalizePhoneInput(v));
      setInputValue('');
      setPanelSearch('');
      refreshSuggestions(normalizePhoneInput(v));
      return;
    }
    refreshSuggestions(v);
  };

  const handlePhoneChange = (v: string) => {
    setPhoneValue(v);
    refreshSuggestions(v);
  };

  const handlePanelSearchChange = (value: string) => {
    setPanelSearch(value);
    refreshSuggestions(value, { openPanel: true });
  };

  const handleRecipientFieldBlur = useCallback(
    (commit: () => void) => {
      window.setTimeout(() => {
        if (isFocusInsideRecipientField()) return;
        closeContactPanel();
        commit();
      }, 150);
    },
    [closeContactPanel, isFocusInsideRecipientField],
  );

  const canSaveCurrentContact =
    inputMode === 'email'
      ? validateEmail(inputValue.trim())
      : isValidInternationalPhone(normalizePhoneInput(phoneValue));

  const handleSaveContactClick = () => {
    if (!onSaveToContacts || !canSaveCurrentContact) return;
    onSaveToContacts({
      display_name:
        inputMode === 'email'
          ? inputValue.trim().split('@')[0]
          : phoneValue.trim(),
      email: inputMode === 'email' ? inputValue.trim() : undefined,
      phone: inputMode === 'phone' ? normalizePhoneInput(phoneValue) : undefined,
    });
  };

  const navigateSuggestions = (e: React.KeyboardEvent) => {
    if (!showContactPanel || suggestions.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, -1));
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeContactPanel();
      return true;
    }
    if ((e.key === 'Enter' || e.key === 'Tab') && highlightIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIdx]);
      return true;
    }
    return false;
  };

  const handlePanelSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (navigateSuggestions(e)) return;
    if (e.key === 'Enter' && highlightIdx < 0 && suggestions.length === 1) {
      e.preventDefault();
      selectSuggestion(suggestions[0]);
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (navigateSuggestions(e)) return;

    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      if (highlightIdx >= 0 && suggestions[highlightIdx]) {
        selectSuggestion(suggestions[highlightIdx]);
        return;
      }
      if (inputValue.trim()) commitEmail(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      onRemove(type, recipients[recipients.length - 1].id);
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (navigateSuggestions(e)) return;

    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      if (highlightIdx >= 0 && suggestions[highlightIdx]) {
        selectSuggestion(suggestions[highlightIdx]);
        return;
      }
      commitPhone();
    }
    if (e.key === 'Backspace' && !phoneValue && recipients.length > 0) {
      onRemove(type, recipients[recipients.length - 1].id);
    }
  };

  const handleEmailBlur = () => {
    handleRecipientFieldBlur(() => {
      const trimmed = inputValue.trim();
      if (trimmed && validateEmail(trimmed)) {
        commitEmail(trimmed);
      }
    });
  };

  const handlePhoneBlur = () => {
    handleRecipientFieldBlur(() => {
      if (phoneValue.trim()) commitPhone();
    });
  };

  const emailPlaceholder = recipients.length === 0 ? 'Email address' : '';
  const phonePlaceholder = recipients.length === 0 ? 'Local number' : '';

  const compactFieldClass = cn(
    'w-full rounded-lg border-2 outline-none transition-all duration-200',
    'py-1 pl-8 pr-2 text-sm focus:border-blue-500',
    isDark
      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500'
      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400',
    error && (isDark ? 'border-red-500' : 'border-red-300'),
  );

  return (
    <div
      className={cn(
        'relative flex items-start gap-2 py-2 border-b',
        error ? 'border-red-400' : isDark ? 'border-gray-700' : 'border-gray-200',
      )}
      data-error={error ? 'true' : undefined}
    >
      {/* Label */}
      <span
        className={cn(
          'w-10 text-xs font-semibold pt-2.5 uppercase tracking-wide shrink-0',
          isDark ? 'text-gray-400' : 'text-gray-500',
        )}
      >
        {label}
      </span>

      {/* Chips + input */}
      <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
        {recipients.map(r => (
          <RecipientChip
            key={r.id}
            recipient={r}
            isDark={isDark}
            onRemove={() => onRemove(type, r.id)}
          />
        ))}

        <div className="flex flex-1 min-w-[200px] flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Add by email"
                onClick={() => {
                  setInputMode('email');
                  setPanelSearch('');
                }}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer',
                  inputMode === 'email'
                    ? isDark
                      ? 'border-blue-500/50 bg-blue-600/30 text-blue-200'
                      : 'border-blue-300 bg-blue-50 text-blue-700'
                    : isDark
                      ? 'border-gray-700 text-gray-400 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-100',
                )}
              >
                <Mail className="w-3 h-3" /> Email
              </button>
              <button
                type="button"
                title="Add by phone"
                onClick={() => {
                  setInputMode('phone');
                  setPanelSearch('');
                }}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer',
                  inputMode === 'phone'
                    ? isDark
                      ? 'border-blue-500/50 bg-blue-600/30 text-blue-200'
                      : 'border-blue-300 bg-blue-50 text-blue-700'
                    : isDark
                      ? 'border-gray-700 text-gray-400 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-100',
                )}
              >
                <Phone className="w-3 h-3" /> Phone
              </button>
            </div>

            {onSaveToContacts && canSaveCurrentContact && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSaveContactClick}
                disabled={isSavingContact}
                className={cn(
                  'relative z-[60] inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium cursor-pointer',
                  isDark
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100',
                  isSavingContact && 'opacity-50 cursor-not-allowed',
                )}
              >
                <UserPlus className="h-3 w-3" />
                {isSavingContact ? 'Saving…' : 'Save to contacts'}
              </button>
            )}
          </div>

          <div ref={recipientFieldRef} className="relative min-w-0 w-full flex-1">
            {inputMode === 'email' ? (
              <div className="relative w-full">
                <Mail
                  className={cn(
                    'pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2',
                    isDark ? 'text-gray-500' : 'text-gray-400',
                  )}
                />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="email"
                  name={`message-compose-${type}-recipient`}
                  value={inputValue}
                  onChange={e => handleEmailChange(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  onFocus={handleRecipientFieldFocus}
                  onBlur={handleEmailBlur}
                  placeholder={emailPlaceholder}
                  className={compactFieldClass}
                  {...NO_BROWSER_AUTOCOMPLETE}
                />
              </div>
            ) : (
              <PhoneInputWithCountryCode
                theme={isDark ? 'dark' : 'light'}
                compact
                value={phoneValue}
                onChange={handlePhoneChange}
                onKeyDown={handlePhoneKeyDown}
                onFocus={handleRecipientFieldFocus}
                onBlur={handlePhoneBlur}
                placeholder={phonePlaceholder}
                showPreview={false}
                className="w-full"
                disableBrowserAutocomplete
                error={error}
                touched={!!error}
              />
            )}

            <ContactSuggestionsPanel
              isDark={isDark}
              open={showContactPanel}
              panelSearch={panelSearch}
              onPanelSearchChange={handlePanelSearchChange}
              onPanelSearchKeyDown={handlePanelSearchKeyDown}
              panelSearchRef={panelSearchRef}
              suggestions={suggestions}
              highlightIdx={highlightIdx}
              onSelect={selectSuggestion}
              inputMode={inputMode}
            />
          </div>
        </div>
      </div>

      {/* Right slot (CC / BCC buttons for TO row) */}
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}

      {/* Inline error */}
      {error && (
        <div className="absolute bottom-1 left-12 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}
    </div>
  );
};

/* ── main export ─────────────────────────────────────────────────── */
interface ComposeRecipientsProps {
  theme: 'light' | 'dark';
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  showCc: boolean;
  showBcc: boolean;
  validationErrors: Record<string, string>;
  onAddRecipient: (type: 'to' | 'cc' | 'bcc', input: string, name?: string) => void;
  onRemoveRecipient: (type: 'to' | 'cc' | 'bcc', id: string) => void;
  onSaveToContacts?: (payload: { display_name: string; email?: string; phone?: string }) => void;
  isSavingContact?: boolean;
  onAddRecipientsFromNotebook?: (target: RecipientTargetField, picks: NotebookRecipientPick[]) => void;
  onToggleCc: () => void;
  onToggleBcc: () => void;
}

export const ComposeRecipients: React.FC<ComposeRecipientsProps> = ({
  theme, to, cc, bcc, showCc, showBcc,
  validationErrors, onAddRecipient, onRemoveRecipient,
  onSaveToContacts, isSavingContact,
  onAddRecipientsFromNotebook,
  onToggleCc, onToggleBcc,
}) => {
  const isDark = theme === 'dark';
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [contactPickerKey, setContactPickerKey] = useState(0);
  const allRecipients = [...to, ...cc, ...bcc];
  const hasInvalidRecipients = allRecipients.some(r => !r.isValid);

  return (
    <div className="px-4 pt-2">
      {onAddRecipientsFromNotebook && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setContactPickerKey((k) => k + 1);
              setContactPickerOpen(true);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors',
              isDark
                ? 'border-blue-500/40 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30'
                : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100',
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Add from contacts
          </button>
        </div>
      )}

      {onAddRecipientsFromNotebook && (
        <ComposeContactPicker
          key={contactPickerKey}
          theme={theme}
          open={contactPickerOpen}
          onClose={() => setContactPickerOpen(false)}
          recipientsByField={{ to, cc, bcc }}
          onAddRecipients={onAddRecipientsFromNotebook}
        />
      )}

      {/* TO row */}
      <RecipientRow
        type="to"
        label="To"
        recipients={to}
        isDark={isDark}
        onAdd={onAddRecipient}
        onRemove={onRemoveRecipient}
        onSaveToContacts={onSaveToContacts}
        isSavingContact={isSavingContact}
        error={validationErrors.recipients}
        rightSlot={
          !showCc || !showBcc ? (
            <div className="flex items-center gap-0.5 mt-1.5">
              {!showCc && (
                <button
                  onClick={onToggleCc}
                  className={cn(
                    'text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors',
                    isDark
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
                  )}
                >
                  CC
                </button>
              )}
              {!showBcc && (
                <button
                  onClick={onToggleBcc}
                  className={cn(
                    'text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors',
                    isDark
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
                  )}
                >
                  BCC
                </button>
              )}
            </div>
          ) : null
        }
      />

      {/* CC row */}
      {showCc && (
        <RecipientRow
          type="cc"
          label="CC"
          recipients={cc}
          isDark={isDark}
          onAdd={onAddRecipient}
          onRemove={onRemoveRecipient}
          onSaveToContacts={onSaveToContacts}
          isSavingContact={isSavingContact}
        />
      )}

      {/* BCC row */}
      {showBcc && (
        <RecipientRow
          type="bcc"
          label="BCC"
          recipients={bcc}
          isDark={isDark}
          onAdd={onAddRecipient}
          onRemove={onRemoveRecipient}
          onSaveToContacts={onSaveToContacts}
          isSavingContact={isSavingContact}
        />
      )}

      {/* Validation note */}
      <div className="mt-2 px-1">
        <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
          Use Email or Phone per recipient. Phone numbers use country dial code (same as signup), e.g. +256701234567.
        </p>
        {hasInvalidRecipients && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="w-3 h-3" />
            Some recipients look invalid. Please review highlighted chips before sending.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComposeRecipients;
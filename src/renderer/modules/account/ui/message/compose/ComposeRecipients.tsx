/**
 * ============================================================================
 * COMPOSE RECIPIENTS COMPONENT - EMAIL ONLY
 * ============================================================================
 * Features:
 *  - Email recipient input only (phone support to be added later)
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
  X, AlertCircle, Mail,
} from 'lucide-react';
import type { Recipient, StoredContact } from './composeTypes';
import { cn } from '../../../../../shared/types/cn';
import { loadStoredContacts } from './useComposeState';

/* ── helpers ────────────────────────────────────────────────────── */

const filterContacts = (query: string, contacts: StoredContact[]): StoredContact[] => {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return contacts
    .filter(c =>
      c.email?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q),
    )
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 8);
};

/* ── chip ───────────────────────────────────────────────────────── */
interface RecipientChipProps {
  recipient: Recipient;
  isDark: boolean;
  onRemove: () => void;
}

const RecipientChip: React.FC<RecipientChipProps> = ({ recipient, isDark, onRemove }) => {
  const isInvalid = !recipient.isValid;

  return (
    <span
      title={recipient.email}
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
      ) : (
        <Mail className="w-3 h-3 shrink-0" />
      )}

      <span className="truncate">
        {recipient.name && recipient.name !== recipient.email
          ? recipient.name
          : recipient.email}
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
      {contact.name ? contact.name[0].toUpperCase() : contact.email[0]?.toUpperCase() ?? '?'}
    </div>

    <div className="min-w-0">
      {contact.name && (
        <div className="font-medium truncate">{contact.name}</div>
      )}
      <div className={cn('truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>
        {contact.email}
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

/* ── row ─────────────────────────────────────────────────────────── */
interface RecipientRowProps {
  type: 'to' | 'cc' | 'bcc';
  label: string;
  recipients: Recipient[];
  isDark: boolean;
  onAdd: (type: 'to' | 'cc' | 'bcc', input: string, name?: string) => void;
  onRemove: (type: 'to' | 'cc' | 'bcc', id: string) => void;
  error?: string;
  rightSlot?: React.ReactNode;
}

const RecipientRow: React.FC<RecipientRowProps> = ({
  type, label, recipients, isDark, onAdd, onRemove, error, rightSlot,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<StoredContact[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [showSuggest, setShowSuggest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const contacts = useMemo(() => loadStoredContacts(), []);

  const commit = useCallback(
    (value: string, name?: string) => {
      const parts = value.split(/[,;]/).map(p => p.trim()).filter(Boolean);
      parts.forEach(p => onAdd(type, p, name));
      setInputValue('');
      setSuggestions([]);
      setShowSuggest(false);
    },
    [type, onAdd],
  );

  const handleChange = (v: string) => {
    setInputValue(v);
    if (v.length > 0) {
      const found = filterContacts(v, contacts);
      setSuggestions(found);
      setShowSuggest(found.length > 0);
      setHighlightIdx(-1);
    } else {
      setSuggestions([]);
      setShowSuggest(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggest) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx(i => Math.max(i - 1, -1));
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggest(false);
        return;
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && highlightIdx >= 0) {
        e.preventDefault();
        const s = suggestions[highlightIdx];
        commit(s.email, s.name);
        return;
      }
    }

    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      if (inputValue.trim()) commit(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      onRemove(type, recipients[recipients.length - 1].id);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (inputValue.trim()) commit(inputValue);
      setShowSuggest(false);
    }, 150);
  };

  const placeholder = recipients.length === 0
    ? `Add ${label} recipients (email addresses)`
    : '';

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

        <div className="relative flex items-center flex-1 min-w-[180px]">
          <Mail 
            className={cn(
              'mr-1 w-4 h-4 shrink-0',
              isDark ? 'text-blue-400' : 'text-blue-500',
            )}
          />
          
          <input
            ref={inputRef}
            type="email"
            inputMode="email"
            value={inputValue}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggest(suggestions.length > 0)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              'flex-1 py-1 bg-transparent outline-none text-sm min-w-[120px]',
              isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400',
            )}
          />

          {/* Suggestion dropdown */}
          {showSuggest && (
            <div
              className={cn(
                'absolute top-full left-0 z-50 w-72 rounded-xl border shadow-xl overflow-hidden mt-1',
                isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200',
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b',
                  isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-100',
                )}
              >
                <Mail className="w-3 h-3" /> Email Suggestions
              </div>
              {suggestions.map((s, i) => (
                <SuggestionItem
                  key={s.id}
                  contact={s}
                  isDark={isDark}
                  isHighlighted={i === highlightIdx}
                  onSelect={() => commit(s.email, s.name)}
                />
              ))}
            </div>
          )}
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
  onToggleCc: () => void;
  onToggleBcc: () => void;
}

export const ComposeRecipients: React.FC<ComposeRecipientsProps> = ({
  theme, to, cc, bcc, showCc, showBcc,
  validationErrors, onAddRecipient, onRemoveRecipient,
  onToggleCc, onToggleBcc,
}) => {
  const isDark = theme === 'dark';
  const allRecipients = [...to, ...cc, ...bcc];
  const hasInvalidRecipients = allRecipients.some(r => !r.isValid);

  return (
    <div className="px-4 pt-2">
      {/* TO row */}
      <RecipientRow
        type="to"
        label="To"
        recipients={to}
        isDark={isDark}
        onAdd={onAddRecipient}
        onRemove={onRemoveRecipient}
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
        />
      )}

      {/* Validation note */}
      <div className="mt-2 px-1">
        {hasInvalidRecipients && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
            <AlertCircle className="w-3 h-3" />
            Some recipients look invalid. Please review highlighted chips before sending.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComposeRecipients;
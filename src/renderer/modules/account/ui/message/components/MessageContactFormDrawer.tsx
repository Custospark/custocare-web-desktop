/**
 * Message contact create/edit drawer — matches ServiceCatalog / Inventory drawer UX.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { BookUser, Mail, Phone, RefreshCw, X } from 'lucide-react';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { PhoneInputWithCountryCode } from '../../../../../shared/components/Forms/PhoneInputWithCountryCode';

export interface ContactFormData {
  display_name: string;
  email: string;
  phone: string;
}

interface MessageContactFormDrawerProps {
  theme: 'light' | 'dark';
  mode: 'create' | 'edit';
  open: boolean;
  formData: ContactFormData;
  onChange: (next: ContactFormData) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export const MessageContactFormDrawer: React.FC<MessageContactFormDrawerProps> = ({
  theme,
  mode,
  open,
  formData,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  canSubmit,
}) => {
  const isDark = theme === 'dark';
  const title = mode === 'edit' ? 'Edit Contact' : 'New Contact';

  const helperText = useMemo(
    () =>
      mode === 'edit'
        ? 'Update how this person appears in your notebook.'
        : 'Save someone you message often. Email or phone must match their Custocare account.',
    [mode],
  );

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const didAutoFocusRef = useRef(false);

  useEffect(() => {
    if (!open) {
      didAutoFocusRef.current = false;
    }
  }, [open]);

  const set = (patch: Partial<ContactFormData>) => onChange({ ...formData, ...patch });

  const handleDrawerKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (!isSubmitting && canSubmit) onSubmit();
    }
  };

  const onPanelMountRef = (node: HTMLDivElement | null) => {
    if (!node || didAutoFocusRef.current) return;
    didAutoFocusRef.current = true;
    requestAnimationFrame(() => nameInputRef.current?.focus());
  };

  const inputBase =
    'w-full px-3 py-2 rounded-lg border outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const inputTheme = isDark
    ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400';
  const labelTheme = isDark ? 'text-gray-300' : 'text-gray-700';
  const hintTheme = isDark ? 'text-gray-500' : 'text-gray-600';
  const sectionCard = isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200';
  const subtleDivider = isDark ? 'border-gray-800' : 'border-gray-200';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleDrawerKeyDown}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-pointer"
      />

      <div
        ref={onPanelMountRef}
        className={cn(
          'absolute right-0 top-0 h-full w-full sm:w-[560px] overflow-y-auto border-l',
          isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={cn('p-5 border-b flex items-start justify-between gap-4', subtleDivider)}>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-6">{title}</h3>
            <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-600')}>{helperText}</p>
            <p className={cn('text-xs mt-1', hintTheme)}>
              Tip: Press <span className="font-medium">Ctrl/⌘ + Enter</span> to save.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg border transition cursor-pointer',
              isDark ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-100',
            )}
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className={cn('rounded-xl border', sectionCard)}>
            <div className={cn('px-4 py-3 border-b', subtleDivider)}>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <BookUser className="h-4 w-4 opacity-70" />
                Contact details
              </h4>
              <p className={cn('text-xs mt-1', hintTheme)}>
                Your label for this person plus how to reach them on Custocare.
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                  Display name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  value={formData.display_name}
                  onChange={(e) => set({ display_name: e.target.value })}
                  placeholder="e.g. Dr. Okello"
                  className={cn(inputBase, inputTheme)}
                />
                <p className={cn('mt-1 text-xs', hintTheme)}>
                  Shown in your notebook and compose suggestions.
                </p>
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="name@example.com"
                  className={cn(inputBase, inputTheme)}
                />
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone
                  </span>
                </label>
                <PhoneInputWithCountryCode
                  theme={theme}
                  value={formData.phone}
                  onChange={(v) => set({ phone: v })}
                />
                <p className={cn('mt-1 text-xs', hintTheme)}>
                  Provide at least one email or phone. It must match a registered Custocare account.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'sticky bottom-0 p-5 border-t backdrop-blur',
            subtleDivider,
            isDark ? 'bg-gray-950/90' : 'bg-white/90',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className={cn('text-xs', hintTheme)}>
              Fields marked with <span className="text-red-500">*</span> are required.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors border cursor-pointer',
                  isDark
                    ? 'bg-gray-950 hover:bg-gray-900 text-gray-300 border-gray-800'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200',
                  isSubmitting && 'opacity-50 cursor-not-allowed',
                )}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || !canSubmit}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
                  !isSubmitting && canSubmit ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed',
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving…
                  </span>
                ) : mode === 'edit' ? (
                  'Update contact'
                ) : (
                  'Add contact'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MessageContactFormDrawer.displayName = 'MessageContactFormDrawer';

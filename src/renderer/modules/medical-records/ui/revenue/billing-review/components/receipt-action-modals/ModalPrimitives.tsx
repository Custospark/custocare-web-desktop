// ModalPrimitives.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { cx } from '../../utils';

export interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    elevated: string;
    hover: string;
    selected: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  border: {
    primary: string;
    subtle?: string;
  };
  ring: string;
}

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
  isBusy?: boolean;
  busyTitle?: string;
  busyDescription?: string;
  disableClose?: boolean;
  contentClassName?: string;
  showCloseButton?: boolean;
}

const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [locked]);
};

export const ActionModal: React.FC<ActionModalProps> = ({
  open,
  onClose,
  theme,
  colors,
  title,
  subtitle,
  icon,
  children,
  maxWidthClass = 'max-w-2xl',
  isBusy = false,
  busyTitle = 'Processing request',
  busyDescription = 'Please wait while we securely complete this action.',
  disableClose = false,
  contentClassName,
  showCloseButton = true,
}) => {
  const isDark = theme === 'dark';
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useBodyScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || disableClose || isBusy) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, disableClose, isBusy, onClose]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
    }
  }, [open]);

  const portalTarget = useMemo(() => {
    if (!mounted || typeof document === 'undefined') return null;
    return document.body;
  }, [mounted]);

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            className="absolute inset-0 bg-slate-950/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!disableClose && !isBusy) onClose();
            }}
          />

          <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-busy={isBusy}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cx(
                'relative w-full rounded-2xl border shadow-2xl outline-none overflow-hidden',
                maxWidthClass,
                colors.border.primary,
                colors.bg.elevated
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cx('flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6', colors.border.primary)}>
                <div className="flex min-w-0 items-start gap-3">
                  {icon ? (
                    <div
                      className={cx(
                        'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        isDark ? 'bg-white/5' : 'bg-slate-100'
                      )}
                    >
                      {icon}
                    </div>
                  ) : null}

                  <div className="min-w-0">
                    <h2 className={cx('text-lg font-semibold tracking-tight', colors.text.primary)}>
                      {title}
                    </h2>
                    {subtitle ? (
                      <p className={cx('mt-1 text-sm', colors.text.secondary)}>
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={disableClose || isBusy}
                    aria-label="Close modal"
                    className={cx(
                      'rounded-lg p-2 transition-colors',
                      colors.text.tertiary,
                      isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100',
                      (disableClose || isBusy) && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className={cx('relative', contentClassName)}>
                {children}

                <AnimatePresence>
                  {isBusy && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cx(
                        'absolute inset-0 z-20 flex items-center justify-center',
                        isDark ? 'bg-slate-950/45 backdrop-blur-[2px]' : 'bg-white/65 backdrop-blur-[2px]'
                      )}
                    >
                      <div
                        className={cx(
                          'mx-4 w-full max-w-sm rounded-2xl border p-5 shadow-xl',
                          colors.border.primary,
                          isDark ? 'bg-slate-900/95' : 'bg-white/95'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-xl bg-blue-600/10 p-2 text-blue-600">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>

                          <div>
                            <p className={cx('text-sm font-semibold', colors.text.primary)}>
                              {busyTitle}
                            </p>
                            <p className={cx('mt-1 text-sm leading-relaxed', colors.text.secondary)}>
                              {busyDescription}
                            </p>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <motion.div
                                className="h-full w-1/2 rounded-full bg-blue-600"
                                initial={{ x: '-100%' }}
                                animate={{ x: '200%' }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    portalTarget
  );
};

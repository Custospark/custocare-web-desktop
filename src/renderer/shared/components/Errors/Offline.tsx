/**
 * Global full-screen offline UI — shown by NetworkOfflineOverlay when networkSlice is offline.
 * Preview route: ROUTES.OFFLINE.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../app/store/store';
import { checkNetworkConnectivity } from '../../../app/store/slices/networkSlice';
import {
  Plane,
  RefreshCw,
  Router,
  Signal,
  Wifi,
  WifiOff,
} from 'lucide-react';
import LogoImage from '../../assets/LogoImage';
import { BrandName, BRAND_TAGLINE } from '../../utils/BrandName';
import { selectTheme } from '../../../app/store/slices/uiSlice';
import { selectUser } from '../../../app/store/slices/authSlice';
import type { UnifiedUserProfile } from '../../types/userTypes';
import { cn } from '../../utils/classNameUtils';

const CONNECTION_TIPS = [
  {
    icon: Wifi,
    text: 'Check your internet connection — Wi‑Fi or mobile data should be on.',
  },
  {
    icon: Plane,
    text: 'Turn off airplane mode if it is enabled.',
  },
  {
    icon: Router,
    text: 'Move closer to your router, or try a different network.',
  },
  {
    icon: Signal,
    text: 'When you are ready, tap Reconnect below.',
  },
] as const;

type RetryStatus = 'idle' | 'checking' | 'still_offline' | 'reconnecting';

/** First name for greeting — profile.first_name, else first token of display name. */
function getGreetingName(user: UnifiedUserProfile | null): string | null {
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

function buildCopy(greetingName: string | null): { headline: string; reassurance: string } {
  if (greetingName) {
    return {
      headline: `${greetingName}, you're offline`,
      reassurance: "Your work in Custocare is safe — we'll be here when you're back.",
    };
  }

  return {
    headline: "You're offline",
    reassurance: "Your work in Custocare is safe — we'll reconnect when you're back.",
  };
}

const Offline: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector(selectTheme);
  const user = useSelector(selectUser);
  const isDark = theme === 'dark';

  const greetingName = useMemo(() => getGreetingName(user), [user]);
  const { headline, reassurance } = useMemo(
    () => buildCopy(greetingName),
    [greetingName],
  );

  const [retryStatus, setRetryStatus] = useState<RetryStatus>('idle');

  const handleRetry = useCallback(async () => {
    setRetryStatus('checking');

    try {
      const result = await dispatch(checkNetworkConnectivity()).unwrap();
      if (result.systemStatus === 'offline') {
        setRetryStatus('still_offline');
      } else {
        setRetryStatus('idle');
      }
    } catch {
      setRetryStatus('still_offline');
    }
  }, [dispatch]);

  const isRetrying = retryStatus === 'checking' || retryStatus === 'reconnecting';

  const statusMessage = useMemo(() => {
    switch (retryStatus) {
      case 'checking':
        return 'Checking your connection…';
      case 'still_offline':
        return 'Still offline — try the steps above, then reconnect.';
      case 'reconnecting':
        return 'Connection restored — bringing you back…';
      default:
        return null;
    }
  }, [retryStatus]);

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center p-6',
        isDark
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
      )}
    >
      <div className="mb-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <LogoImage size="md" className="opacity-90" />
          <div className="text-left text-2xl leading-none">
            <BrandName />
          </div>
        </div>
        <p
          className={cn(
            'text-xs font-semibold tracking-wide',
            isDark ? 'text-blue-500' : 'text-blue-600',
          )}
        >
          {BRAND_TAGLINE}
        </p>
      </div>

      <div
        className={cn(
          'w-full max-w-md rounded-2xl border px-8 py-10 shadow-xl backdrop-blur-sm',
          isDark
            ? 'border-slate-700/80 bg-slate-900/60 shadow-black/20'
            : 'border-slate-200/90 bg-white/90 shadow-slate-200/50',
        )}
      >
        <div className="text-center">
          <div
            className={cn(
              'mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full',
              isDark ? 'bg-slate-800/80' : 'bg-slate-100',
            )}
          >
            <WifiOff
              className={cn(
                'h-10 w-10',
                isDark ? 'text-slate-400' : 'text-slate-500',
              )}
              aria-hidden
            />
          </div>

          <h1
            className={cn(
              'text-2xl font-semibold tracking-tight sm:text-[1.65rem]',
              isDark ? 'text-white' : 'text-slate-900',
            )}
          >
            {headline}
          </h1>

          <p
            className={cn(
              'mt-3 text-base leading-relaxed',
              isDark ? 'text-slate-400' : 'text-slate-600',
            )}
          >
            {reassurance}
          </p>
        </div>

        <div
          className={cn(
            'mt-8 rounded-xl border px-4 py-4 text-left',
            isDark
              ? 'border-slate-700/60 bg-slate-800/40'
              : 'border-slate-200 bg-slate-50/80',
          )}
        >
          <p
            className={cn(
              'mb-3 text-xs font-semibold uppercase tracking-wider',
              isDark ? 'text-slate-500' : 'text-slate-500',
            )}
          >
            What you can try
          </p>
          <ul className="space-y-3" role="list">
            {CONNECTION_TIPS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    isDark ? 'bg-slate-700/80 text-cyan-400' : 'bg-white text-blue-600 shadow-sm',
                  )}
                  aria-hidden
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span
                  className={cn(
                    'text-sm leading-snug',
                    isDark ? 'text-slate-300' : 'text-slate-600',
                  )}
                >
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {statusMessage && (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              'mt-4 text-center text-sm',
              retryStatus === 'still_offline'
                ? isDark
                  ? 'text-amber-400/90'
                  : 'text-amber-700'
                : isDark
                  ? 'text-cyan-400/90'
                  : 'text-blue-600',
            )}
          >
            {statusMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-500 hover:to-cyan-400 disabled:cursor-wait disabled:opacity-70"
        >
          <RefreshCw className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
          {retryStatus === 'checking'
            ? 'Checking…'
            : retryStatus === 'reconnecting'
              ? 'Reconnecting…'
              : 'Reconnect'}
        </button>

        <p
          className={cn(
            'mt-4 text-center text-xs leading-relaxed',
            isDark ? 'text-slate-500' : 'text-slate-500',
          )}
        >
          We will reconnect automatically when your network is back.
        </p>
      </div>

      <p
        className={cn(
          'mt-8 text-xs tracking-wide',
          isDark ? 'text-slate-600' : 'text-slate-400',
        )}
      >
        Need help?{' '}
        <a
          href="mailto:custocare@custospark.com"
          className={cn(
            'font-medium hover:underline',
            isDark ? 'text-blue-400' : 'text-blue-600',
          )}
        >
          Contact support
        </a>
      </p>
    </div>
  );
};

export default Offline;

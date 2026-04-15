import type {
  PeriodFilter,
  User,
  UserStatus,
} from '../../statistics/api/platform-control/PlatformControlTypes';


export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const getPageShellClass = (isDark: boolean) =>
  cn(
    'min-h-screen w-full px-4 py-6 md:px-6 xl:px-8',
    isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
  );

export const getPanelClass = (isDark: boolean) =>
  cn(
    'rounded-3xl border shadow-sm',
    isDark
      ? 'border-white/10 bg-slate-900/80 shadow-black/20'
      : 'border-slate-200 bg-white shadow-slate-200/70'
  );

export const getSubtlePanelClass = (isDark: boolean) =>
  cn(
    'rounded-3xl border',
    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50/80'
  );

export const formatNumber = (value?: number | null) => {
  const safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat().format(safeValue);
};

export const safeText = (value?: string | null, fallback = '—') => {
  if (value === null || value === undefined) return fallback;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : fallback;
};

export const formatStatusLabel = (value?: string | null) => {
  const text = safeText(value, '');
  if (!text) return '—';

  return text
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatDate = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export const getUserFullName = (user: User) => {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return fullName || '—';
};

export const getUserDisplayName = (user: User) => {
  return (
    user.display_name?.trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    user.email?.trim() ||
    user.phone?.trim() ||
    `User #${user.id}`
  );
};

export const getInitials = (value?: string | null) => {
  const text = safeText(value, '');
  if (!text) return 'U';

  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

export const getUserStatusStyles = (status: UserStatus, isDark: boolean) => {
  const styles = {
    active: isDark
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    suspended: isDark
      ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
      : 'border-amber-200 bg-amber-50 text-amber-700',
    banned: isDark
      ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
      : 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return styles[status];
};

export const getVerificationBadgeStyles = (verified: boolean, isDark: boolean) => {
  if (verified) {
    return isDark
      ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
      : 'border-cyan-200 bg-cyan-50 text-cyan-700';
  }

  return isDark
    ? 'border-slate-500/20 bg-slate-500/10 text-slate-300'
    : 'border-slate-200 bg-slate-100 text-slate-700';
};

export const USER_STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
];

export const PERIOD_OPTIONS: Array<{ value: PeriodFilter; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
];

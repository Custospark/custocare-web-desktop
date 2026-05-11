/**
 * Shared surface + text tokens for nursing encounter panels so light/dark contrast stays WCAG-friendly.
 */
export function getNursingEncounterChrome(theme: 'light' | 'dark') {
  const isDark = theme === 'dark';

  return {
    isDark,
    /** Page headings (h2) */
    heading: isDark ? 'text-slate-50' : 'text-slate-900',
    /** Secondary description under title */
    subhead: isDark ? 'text-slate-400' : 'text-slate-600',
    /** Body / paragraph */
    body: isDark ? 'text-slate-300' : 'text-slate-700',
    /** Muted helper text */
    muted: isDark ? 'text-slate-400' : 'text-slate-600',
    /** Timestamps, tertiary */
    subtle: isDark ? 'text-slate-500' : 'text-slate-500',
    /** List/card shell */
    card: isDark
      ? 'rounded-xl border border-slate-600/90 bg-slate-950/85 shadow-sm'
      : 'rounded-xl border border-slate-200 bg-white shadow-sm',
    /** Dividers inside lists */
    divide: isDark ? 'divide-slate-700/90' : 'divide-slate-200',
    /** Filter / toolbar strip */
    filterPanel: isDark
      ? 'rounded-xl border border-slate-600/90 bg-slate-950/70 p-4 shadow-sm'
      : 'rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm',
    /** Empty / info callouts */
    emptyPanel: isDark
      ? 'rounded-xl border border-slate-600/90 bg-slate-950/80 p-6 text-sm leading-relaxed text-slate-300'
      : 'rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700',
    /** Inline code snippets */
    code: isDark
      ? 'rounded bg-slate-900 px-1.5 py-0.5 font-mono text-xs text-slate-200'
      : 'rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800',
    /** Secondary outline button (Refresh, etc.) */
    btnSecondary: isDark
      ? 'inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-100 shadow-sm transition-colors hover:border-slate-500 hover:bg-slate-900 disabled:opacity-50'
      : 'inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50',
    /** Pagination controls */
    btnPaging: isDark
      ? 'rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-900 disabled:border-slate-800 disabled:text-slate-600 disabled:opacity-90'
      : 'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400',
    /** Primary row title */
    rowTitle: isDark ? 'text-slate-50' : 'text-slate-900',
  } as const;
}

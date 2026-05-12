export type SidebarPosition = 'left' | 'right';
export type ThemeMode = 'light' | 'dark';

export interface LayoutThemeClasses {
  background: string;
  sidebarBorder: string;
  contentArea: string;
  backdrop: string;
  glass: string;
  accent: string;
}

export const STORAGE_KEYS = {
  SIDEBAR_POSITION: 'sidebar-position',
  SIDEBAR_OPEN: 'sidebar-open',
  SIDEBAR_NESTED: 'sidebar-nested-navigation',
  THEME: 'app-theme',
  TOP_BARS_VISIBLE: 'layout-topbars-visible',
} as const;

/** Nested (collapsible) sidebar is the default; only explicit `false` in localStorage selects classic. */
export function readNestedSidebarPreference(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(STORAGE_KEYS.SIDEBAR_NESTED) !== 'false';
}

export const ANIMATION_CONFIG = {
  duration: { slow: 350 },
} as const;

export const STATUS_BAR_H = 56; // matches pt-14
export const NAVBAR_H = 56; // navbar row
export const TOP_BARS_TOTAL_H = STATUS_BAR_H + NAVBAR_H;
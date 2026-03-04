import { type RefObject } from 'react';

export type SidebarPosition = 'left' | 'right';
export type SystemStatus = 'online' | 'slow' | 'offline';
export type ThemeMode = 'light' | 'dark';

export interface StatusBarThemeClasses {
  backdrop: string;
}

export interface SearchableModule {
  id: string;
  label: string;
  route: string;
  description: string;
  moduleCode: string;
  keywords: string[];
  category: string;
  requiredCapability?: string; // Optional: specific capability required

}

export interface StatusBarProps {
  theme: ThemeMode;
  themeClasses: StatusBarThemeClasses;
  systemStatus: SystemStatus;
  isOnline: boolean;
  latency: number | null;
  lastChecked: Date | null;
  onRetryConnection: () => void;
  searchQuery: string;
  isSearchFocused: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onClearSearch: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  sidebarPosition: SidebarPosition;
  isTransitioning: boolean;
  onToggleSidebarPosition: () => void;
  onToggleTheme: () => void;
  appVersion: string;
  unreadCount?: number;
  onNotificationClick?: () => void;
}
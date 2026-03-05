
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
  requiredCapability?:string;
}

// In your StatusBar component file
export interface StatusBarProps {
  theme: ThemeMode;
  themeClasses: { backdrop: string; };
  systemStatus: SystemStatus;
  isOnline: boolean;
  latency: number | null;
  lastChecked: Date | null;
  onRetryConnection: () => void;
  sidebarPosition: 'left' | 'right';
  isTransitioning: boolean;
  onToggleSidebarPosition: () => void;
  onToggleTheme: () => void;
  appVersion: string;
  unreadCount: number;
  onNotificationClick: () => void;
  
  // Make search props optional if they're not always needed
  searchQuery?: string;
  isSearchFocused?: boolean;
  onSearchChange?: (query: string) => void;
  onSearchFocus?: () => void;
}
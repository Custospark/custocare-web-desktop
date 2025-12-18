import { ReactNode } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  premiumIcon?: ReactNode;
  href: string;
  active?: boolean;
  badge?: string | number;
  badgeVariant?: 'urgent' | 'primary' | 'default' | 'pro';
  description?: string;
  stats?: string;
  glowColor?: string;
}

export interface BreadcrumbItem {
  id?: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  badge?: string | number;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  theme?: 'light' | 'dark';
  showHome?: boolean;
  maxItems?: number;
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
}

export interface FooterProps {
  theme?: 'light' | 'dark';
  className?: string;
  showContact?: boolean;
  showSocial?: boolean;
  showCopyright?: boolean;
  compact?: boolean;
}

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  theme?: 'light' | 'dark';
  
}

export interface NavbarProps {
  onMenuClick: () => void;
  className?: string;
  onSearch?: (query: string) => void;
  theme?: 'light' | 'dark';
}

// types/index.ts
export interface LayoutProps {
  children: React.ReactNode;
  sidebarOpen?: boolean;        // Make these optional
  onSidebarToggle?: () => void; // Make these optional
  theme?: 'light' | 'dark';     // Make these optional
  onThemeToggle?: () => void;   // Make these optional
}

export interface SearchResult {
  id: string;
  title: string;
  type: 'patient' | 'report' | 'medication' | 'appointment';
  description?: string;
  icon: ReactNode;
}


export interface ContentSectionProps {
  /** Main content */
  children: ReactNode;

  /** Optional wrapper class overrides */
  className?: string;

  /** Section title (H1) */
  title?: string;

  /** Supporting subtitle under the title */
  subtitle?: string;

  /** Right-aligned header actions (buttons, filters, etc.) */
  actions?: ReactNode;
}
/**
 * Type Definitions
 * 
 * Centralized type definitions for the application
 */

import {type ReactNode } from 'react';

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
  onMenuClick?: () => void;
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


/**
 * SidebarProps Type
 * Props for the Sidebar component
 */
export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  theme?: 'dark' | 'light';
}

/**
 * User Type
 * Represents a user in the system
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'nurse' | 'staff';
  avatar?: string;
  department?: string;
}

/**
 * Patient Type
 * Represents a patient record
 */
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  medicalRecordNumber: string;
  bloodType?: string;
  allergies?: string[];
  conditions?: string[];
  lastVisit?: string;
  nextAppointment?: string;
  status?: 'active' | 'inactive' | 'critical';
}

/**
 * Notification Type
 * Represents a system notification
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

/**
 * LoadingState Type
 * Represents loading states throughout the app
 */
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

/**
 * Theme Type
 */
export type Theme = 'dark' | 'light';

/**
 * API Response Type
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  error?: string;
}

/**
 * Pagination Type
 * For paginated lists
 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Filter Type
 * Generic filter for lists
 */
export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: number | string |boolean;
}

/**
 * Sort Type
 * Generic sort configuration
 */
export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}
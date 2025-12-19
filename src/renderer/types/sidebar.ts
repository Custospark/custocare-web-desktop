import {type ReactNode } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  premiumIcon?: ReactNode;
  href: string;
  active?: boolean;
  badge?: string | number;
  badgeVariant?: 'urgent' | 'primary' | 'default';
  description?: string;
  stats?: string;
  glowColor?: string;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export interface NavbarProps {
  onMenuClick: () => void;
  className?: string;
}

export interface User {
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
}

export interface Notification {
  id: number;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'urgent' | 'success';
}
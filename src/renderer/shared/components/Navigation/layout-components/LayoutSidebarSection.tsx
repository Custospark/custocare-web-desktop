// components/layout/LayoutSidebarSection.tsx
import React from 'react';
import { cn } from '../../../utils/classNameUtils';
import { Sidebar } from './../Sidebar';
import { LayoutThemeClasses, SidebarPosition } from './LayoutTypes';

interface LayoutSidebarSectionProps {
  mobileSidebarOpen: boolean;
  sidebarOpen: boolean;
  sidebarPosition: SidebarPosition;
  isTransitioning: boolean;
  topPaddingPx: number;
  NAVBAR_H: number;
  themeClasses: LayoutThemeClasses;
  theme: 'light' | 'dark';
  onCloseMobileSidebar: () => void;
  onToggleSidebar: () => void;
}

export const LayoutSidebarSection: React.FC<LayoutSidebarSectionProps> = ({
  mobileSidebarOpen,
  sidebarOpen,
  sidebarPosition,
  isTransitioning,
  topPaddingPx,
  NAVBAR_H,
  themeClasses,
  theme,
  onCloseMobileSidebar,
  onToggleSidebar,
}) => {
  const isLeft = sidebarPosition === 'left';

  const positionClasses = {
    sidebarPosition: isLeft ? 'left-0' : 'right-0',
    sidebarBorder: isLeft ? 'border-r' : 'border-l',
    sidebarWidth: sidebarOpen ? 'lg:w-70' : 'lg:w-20',
    sidebarTransformMobile: mobileSidebarOpen
      ? 'translate-x-0'
      : isLeft
        ? '-translate-x-full'
        : 'translate-x-full',
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className={cn('fixed inset-0 z-40 lg:hidden', 'bg-black/50 backdrop-blur-sm', 'animate-in fade-in duration-200')}
          onClick={onCloseMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed z-40 bottom-0',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          positionClasses.sidebarPosition,
          positionClasses.sidebarWidth,
          positionClasses.sidebarBorder,
          'border',
          themeClasses.sidebarBorder,
          themeClasses.backdrop,
          positionClasses.sidebarTransformMobile,
          'lg:translate-x-0',
          isTransitioning && 'pointer-events-none'
        )}
        style={{ top: topPaddingPx - NAVBAR_H }}
      >
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={onCloseMobileSidebar}
          collapsed={!sidebarOpen}
          onToggleCollapse={onToggleSidebar}
          theme={theme}
        />
      </aside>
    </>
  );
};
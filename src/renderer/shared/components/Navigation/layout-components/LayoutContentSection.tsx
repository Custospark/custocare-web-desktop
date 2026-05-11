// components/layout/LayoutContentSection.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../../utils/classNameUtils';
import { Footer } from './../Footer';
import type { LayoutThemeClasses, SidebarPosition } from './LayoutTypes';

interface LayoutContentSectionProps {
  sidebarOpen: boolean;
  enableNestedNavigation: boolean;
  sidebarPosition: SidebarPosition;
  themeClasses: LayoutThemeClasses;
}

export const LayoutContentSection: React.FC<LayoutContentSectionProps> = ({
  sidebarOpen,
  enableNestedNavigation,
  sidebarPosition,
  themeClasses,
}) => {
  const isLeft = sidebarPosition === 'left';

  const expandedMainMargin = sidebarOpen && enableNestedNavigation ? 'lg:ml-80' : 'lg:ml-70';
  const expandedMainMarginRight = sidebarOpen && enableNestedNavigation ? 'lg:mr-80' : 'lg:mr-70';

  const contentMargin = isLeft
    ? sidebarOpen
      ? expandedMainMargin
      : 'lg:ml-20'
    : sidebarOpen
      ? expandedMainMarginRight
      : 'lg:mr-20';

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col',
        'transition-all duration-300 ease-in-out',
        contentMargin
      )}
    >
      <main className="flex-1">
        <div
          className={cn(
            'px-1 py-1 mt-4',
            'sm:px-2 sm:py-2 sm:mt-3',
            'md:px-3 md:py-3 md:mt-4',
            'min-h-[calc(100vh-11rem)]',
            themeClasses.contentArea
          )}
        >
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer
        className={cn(
          'border-t backdrop-blur-xl',
          'transition-colors duration-300',
          themeClasses.glass
        )}
      >
        <Footer
          showContact={true}
          showSocial={true}
          showCopyright={true}
          compact={true}
        />
      </footer>
    </div>
  );
};
import type { ReactNode } from 'react';
import { LayoutDashboard, Bell, Link2, Megaphone } from 'lucide-react';
import type { ThemeProp } from '../../../app/routes/modules/shared/routeUtils';

const OVERVIEW_ACTIONS: { label: string; description: string; icon: ReactNode }[] = [
  {
    label: 'View Dashboard',
    description: 'Open the hub dashboard and key metrics',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Latest Updates',
    description: 'See what changed recently across the product',
    icon: <Bell className="w-5 h-5" />,
  },
  {
    label: 'Quick Links',
    description: 'Jump to common documentation and tools',
    icon: <Link2 className="w-5 h-5" />,
  },
  {
    label: 'Announcements',
    description: 'Product announcements and release notes',
    icon: <Megaphone className="w-5 h-5" />,
  },
];

export function CustocareHubOverview({ theme }: ThemeProp) {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <header>
        <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Overview
        </h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Custocare Hub — quick entry points without the multi-action workspace strip.
        </p>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {OVERVIEW_ACTIONS.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className={`w-full cursor-pointer text-left rounded-xl border p-4 transition-colors ${
                isDark
                  ? 'border-gray-700 bg-gray-900/60 hover:border-blue-500/40 hover:bg-gray-800/80'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className={`flex items-start gap-3 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                {item.icon}
                <div className="min-w-0">
                  <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{item.label}</div>
                  <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CustocareHubOverview;

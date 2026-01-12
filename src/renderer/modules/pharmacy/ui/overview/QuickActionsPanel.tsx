// QuickActionsPanel.tsx
import React from 'react';
import {
  Plus,
  FileText,
  Pill,
  ShoppingCart,
  AlertTriangle,
  Package,
  BarChart3,
  Settings,
} from 'lucide-react';

interface QuickActionsPanelProps {
  theme: 'light' | 'dark';
  onAction: (actionType: string) => void;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  priority: 'high' | 'medium' | 'low';
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  theme,
  onAction,
}) => {
  const isDark = theme === 'dark';

  const actions: QuickAction[] = [
    {
      id: 'new-stock',
      label: 'New Stock Entry',
      description: 'Add inventory items',
      icon: Plus,
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      iconBg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
      priority: 'high',
    },
    {
      id: 'new-prescription',
      label: 'New Prescription',
      description: 'Record prescription',
      icon: FileText,
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      iconBg: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
      priority: 'high',
    },
    {
      id: 'dispense-medication',
      label: 'Dispense Medication',
      description: 'Fulfill prescription',
      icon: Pill,
      iconColor: isDark ? 'text-green-400' : 'text-green-600',
      iconBg: isDark ? 'bg-green-900/30' : 'bg-green-50',
      priority: 'high',
    },
    {
      id: 'checkout',
      label: 'Checkout / Billing',
      description: 'Process payment',
      icon: ShoppingCart,
      iconColor: isDark ? 'text-orange-400' : 'text-orange-600',
      iconBg: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
      priority: 'high',
    },
    {
      id: 'view-low-stock',
      label: 'View Low Stock',
      description: 'Check alerts',
      icon: AlertTriangle,
      iconColor: isDark ? 'text-red-400' : 'text-red-600',
      iconBg: isDark ? 'bg-red-900/30' : 'bg-red-50',
      priority: 'medium',
    },
    {
      id: 'stock-adjustment',
      label: 'Stock Adjustment',
      description: 'Update quantities',
      icon: Package,
      iconColor: isDark ? 'text-cyan-400' : 'text-cyan-600',
      iconBg: isDark ? 'bg-cyan-900/30' : 'bg-cyan-50',
      priority: 'medium',
    },
    {
      id: 'reports',
      label: 'Reports',
      description: 'View analytics',
      icon: BarChart3,
      iconColor: isDark ? 'text-indigo-400' : 'text-indigo-600',
      iconBg: isDark ? 'bg-indigo-900/30' : 'bg-indigo-50',
      priority: 'low',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Configure pharmacy',
      icon: Settings,
      iconColor: isDark ? 'text-gray-400' : 'text-gray-600',
      iconBg: isDark ? 'bg-gray-800' : 'bg-gray-100',
      priority: 'low',
    },
  ];

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark
          ? 'bg-gray-900 border-gray-800'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <span
          className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}
        >
          Frequently used workflows
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 hover:shadow-md group ${
                isDark
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600'
                  : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300'
              }`}
              aria-label={`${action.label}: ${action.description}`}
            >
              <div
                className={`p-3 rounded-lg transition-transform group-hover:scale-110 ${action.iconBg}`}
              >
                <Icon className={`w-5 h-5 ${action.iconColor}`} />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium leading-tight">
                  {action.label}
                </p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    isDark ? 'text-gray-500' : 'text-gray-500'
                  }`}
                >
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

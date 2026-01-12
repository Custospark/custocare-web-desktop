// LowStockAlert.tsx
import React from 'react';
import { AlertTriangle, Package, Clock } from 'lucide-react';

interface LowStockAlertProps {
  theme: 'light' | 'dark';
  refreshKey: number;
}

interface StockAlert {
  id: string;
  itemName: string;
  currentStock: number;
  minRequired: number;
  category: string;
  lastRestocked: string;
  urgency: 'critical' | 'warning' | 'moderate';
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({ theme, refreshKey }) => {
  const isDark = theme === 'dark';

  // Mock data
  const alerts: StockAlert[] = [
    {
      id: '1',
      itemName: 'Amoxicillin 500mg',
      currentStock: 45,
      minRequired: 200,
      category: 'Antibiotics',
      lastRestocked: '3 days ago',
      urgency: 'critical',
    },
    {
      id: '2',
      itemName: 'Ibuprofen 400mg',
      currentStock: 120,
      minRequired: 300,
      category: 'Pain Relief',
      lastRestocked: '1 week ago',
      urgency: 'warning',
    },
    {
      id: '3',
      itemName: 'Metformin 850mg',
      currentStock: 180,
      minRequired: 250,
      category: 'Diabetes',
      lastRestocked: '5 days ago',
      urgency: 'warning',
    },
    {
      id: '4',
      itemName: 'Lisinopril 10mg',
      currentStock: 95,
      minRequired: 150,
      category: 'Cardiovascular',
      lastRestocked: '2 days ago',
      urgency: 'moderate',
    },
  ];

  const getUrgencyColor = (urgency: StockAlert['urgency']) => {
    switch (urgency) {
      case 'critical':
        return {
          bg: isDark ? 'bg-red-900/30' : 'bg-red-50',
          text: isDark ? 'text-red-400' : 'text-red-600',
          border: isDark ? 'border-red-800' : 'border-red-200',
        };
      case 'warning':
        return {
          bg: isDark ? 'bg-yellow-900/30' : 'bg-yellow-50',
          text: isDark ? 'text-yellow-400' : 'text-yellow-600',
          border: isDark ? 'border-yellow-800' : 'border-yellow-200',
        };
      case 'moderate':
        return {
          bg: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
          text: isDark ? 'text-orange-400' : 'text-orange-600',
          border: isDark ? 'border-orange-800' : 'border-orange-200',
        };
    }
  };

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className={isDark ? 'text-red-400' : 'text-red-600'} />
          <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isDark
                ? 'bg-red-900/30 text-red-400'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {alerts.length} items
          </span>
        </div>
        <button
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            isDark
              ? 'text-blue-400 hover:bg-gray-800'
              : 'text-blue-600 hover:bg-gray-100'
          }`}
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const colors = getUrgencyColor(alert.urgency);
          const stockPercentage = (alert.currentStock / alert.minRequired) * 100;

          return (
            <div
              key={`${alert.id}-${refreshKey}`}
              className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className={`w-4 h-4 ${colors.text}`} />
                    <h3 className="font-medium">{alert.itemName}</h3>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {alert.category}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded uppercase font-medium ${colors.text} ${colors.bg}`}
                >
                  {alert.urgency}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Current: {alert.currentStock} units
                  </span>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Required: {alert.minRequired} units
                  </span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      stockPercentage < 30
                        ? 'bg-red-500'
                        : stockPercentage < 60
                        ? 'bg-yellow-500'
                        : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Last restocked {alert.lastRestocked}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

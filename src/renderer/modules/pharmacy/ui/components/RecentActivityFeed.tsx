// RecentActivityFeed.tsx
import React from 'react';
import {
  Clock,
  CheckCircle,
  FileText,
  Package,
  ShoppingCart,
  User,
} from 'lucide-react';

interface RecentActivityFeedProps {
  theme: 'light' | 'dark';
  refreshKey: number;
}

interface ActivityItem {
  id: string;
  type: 'prescription' | 'dispensed' | 'stock' | 'checkout';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  theme,
  refreshKey,
}) => {
  const isDark = theme === 'dark';

  // Mock data
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'dispensed',
      title: 'Medication Dispensed',
      description: 'Lisinopril 10mg x30 dispensed to patient #8472',
      timestamp: '2 minutes ago',
      user: 'Sarah Johnson',
      icon: CheckCircle,
      iconColor: isDark ? 'text-green-400' : 'text-green-600',
      iconBg: isDark ? 'bg-green-900/30' : 'bg-green-50',
    },
    {
      id: '2',
      type: 'prescription',
      title: 'New Prescription',
      description: 'Amoxicillin 500mg prescription received',
      timestamp: '8 minutes ago',
      user: 'Dr. Michael Chen',
      icon: FileText,
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      iconBg: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
    },
    {
      id: '3',
      type: 'checkout',
      title: 'Checkout Completed',
      description: 'Payment processed: $47.50',
      timestamp: '15 minutes ago',
      user: 'Emily Davis',
      icon: ShoppingCart,
      iconColor: isDark ? 'text-orange-400' : 'text-orange-600',
      iconBg: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
    },
    {
      id: '4',
      type: 'stock',
      title: 'Stock Adjustment',
      description: 'Metformin 850mg inventory updated: +200 units',
      timestamp: '32 minutes ago',
      user: 'James Wilson',
      icon: Package,
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      iconBg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
    },
    {
      id: '5',
      type: 'dispensed',
      title: 'Medication Dispensed',
      description: 'Ibuprofen 400mg x20 dispensed to patient #7291',
      timestamp: '45 minutes ago',
      user: 'Sarah Johnson',
      icon: CheckCircle,
      iconColor: isDark ? 'text-green-400' : 'text-green-600',
      iconBg: isDark ? 'bg-green-900/30' : 'bg-green-50',
    },
    {
      id: '6',
      type: 'prescription',
      title: 'New Prescription',
      description: 'Atorvastatin 20mg prescription received',
      timestamp: '1 hour ago',
      user: 'Dr. Lisa Anderson',
      icon: FileText,
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      iconBg: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
    },
  ];

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          <h2 className="text-lg font-semibold">Recent Activity</h2>
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

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={`${activity.id}-${refreshKey}`}
              className={`flex gap-3 p-3 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-gray-800/50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`p-2 rounded-lg ${activity.iconBg} h-fit`}>
                <Icon className={`w-4 h-4 ${activity.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm">{activity.title}</h3>
                  <span
                    className={`text-xs whitespace-nowrap ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}
                  >
                    {activity.timestamp}
                  </span>
                </div>
                <p
                  className={`text-sm mt-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {activity.description}
                </p>
                <div
                  className={`flex items-center gap-1 mt-2 text-xs ${
                    isDark ? 'text-gray-500' : 'text-gray-500'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>{activity.user}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

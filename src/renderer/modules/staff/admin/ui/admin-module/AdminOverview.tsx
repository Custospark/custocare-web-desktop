import React from 'react';

interface AdminOverviewProps {
  theme: 'light' | 'dark';
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        Admin Overview(Under Development)
      </h1>

      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
        Quick snapshot of your facility setup and administrative health.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Staff Members', value: 12 },
          { label: 'Departments', value: 5 },
          { label: 'Active Services', value: 18 },
        ].map(card => (
          <div
            key={card.label}
            className={`rounded-xl p-4 border ${
              isDark
                ? 'border-gray-800 bg-gray-900'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="text-2xl font-bold">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;

import React from 'react';

interface AdminTeamProps {
  theme: 'light' | 'dark';
}

export const AdminTeam: React.FC<AdminTeamProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        Team Management
      </h1>

      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
        Manage staff accounts, invitations, and access roles.
      </p>

      <div
        className={`rounded-xl p-6 border ${
          isDark
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-200 bg-white'
        }`}
      >
        <ul className="space-y-3 text-sm">
          <li>• View and manage staff members</li>
          <li>• Send and track staff invitations</li>
          <li>• Assign roles per facility</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminTeam;

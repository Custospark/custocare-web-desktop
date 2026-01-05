import React from 'react';

interface AdminFacilitySetupProps {
  theme: 'light' | 'dark';
}

export const AdminFacilitySetup: React.FC<AdminFacilitySetupProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        Facility Setup
      </h1>

      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
        Configure the internal structure of your healthcare facility.
      </p>

      <div
        className={`rounded-xl p-6 border ${
          isDark
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div className="text-sm mb-2">Departments</div>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Outpatient</li>
          <li>Laboratory</li>
          <li>Pharmacy</li>
          <li>Radiology</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminFacilitySetup;

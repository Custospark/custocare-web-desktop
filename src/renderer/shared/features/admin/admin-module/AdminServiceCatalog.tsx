import React from 'react';

interface AdminServiceCatalogProps {
  theme: 'light' | 'dark';
}

export const AdminServiceCatalog: React.FC<AdminServiceCatalogProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        Service Catalog
      </h1>

      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
        Manage services offered by the facility and their pricing versions.
      </p>

      <div
        className={`rounded-xl p-6 border ${
          isDark
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-200 bg-white'
        }`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2">Service</th>
              <th className="pb-2">Version</th>
              <th className="pb-2">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Consultation</td>
              <td>v2</td>
              <td>$10</td>
            </tr>
            <tr>
              <td>Lab Test</td>
              <td>v1</td>
              <td>$25</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminServiceCatalog;

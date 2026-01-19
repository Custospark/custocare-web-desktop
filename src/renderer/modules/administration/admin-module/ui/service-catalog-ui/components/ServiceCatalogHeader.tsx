// AdminServiceCatalog/components/ServiceCatalogHeader.tsx
import React from 'react';
import { CheckCircle, DollarSign, Layers, Plus, RefreshCw, TrendingUp, Upload } from 'lucide-react';
import type { ServiceCatalog } from '../../../api/service-catalog/serviceCatalogTypes';
import { formatPrice, normalizeAmount } from '../utils/serviceCatalogUiUtils';
import  {ServiceStatus } from '../../../api/service-catalog/serviceCatalogTypes';


interface Props {
  theme: 'light' | 'dark';
  services: ServiceCatalog[];
  onRefresh: () => void;
  onCreate: () => void;
  onImport: () => void;
}

export const ServiceCatalogHeader: React.FC<Props> = ({
  theme,
  services,
  onRefresh,
  onCreate,
  onImport,
}) => {
  const isDark = theme === 'dark';

  const totalValue = services.reduce((sum, s) => sum + normalizeAmount(s.price_amount), 0);
  const activeCount = services.filter(s => s.status === ServiceStatus.ACTIVE).length;
  const avgPrice = services.length > 0 ? totalValue / services.length : 0;

  return (
    <div className="space-y-6">
      {/* Top header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Service Catalog</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage healthcare services, pricing, availability, and governance rules for your facility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRefresh}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={onImport}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>

          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Service
          </button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Services</p>
              <p className="text-2xl font-semibold mt-1">{services.length}</p>
            </div>
            <Layers className={`${isDark ? 'text-blue-400' : 'text-blue-600'} w-8 h-8`} />
          </div>
        </div>

        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Services</p>
              <p className="text-2xl font-semibold mt-1">{activeCount}</p>
            </div>
            <CheckCircle className={`${isDark ? 'text-green-400' : 'text-green-600'} w-8 h-8`} />
          </div>
        </div>

        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Average Price</p>
              <p className="text-2xl font-semibold mt-1">{formatPrice(avgPrice, 'UGX')}</p>
            </div>
            <DollarSign className={`${isDark ? 'text-yellow-400' : 'text-yellow-600'} w-8 h-8`} />
          </div>
        </div>

        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Value</p>
              <p className="text-2xl font-semibold mt-1">{formatPrice(totalValue, 'UGX')}</p>
            </div>
            <TrendingUp className={`${isDark ? 'text-purple-400' : 'text-purple-600'} w-8 h-8`} />
          </div>
        </div>
      </div>
    </div>
  );
};

ServiceCatalogHeader.displayName = 'ServiceCatalogHeader';

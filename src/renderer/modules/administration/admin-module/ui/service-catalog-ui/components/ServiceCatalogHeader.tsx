// AdminServiceCatalog/components/ServiceCatalogHeader.tsx
import React from 'react';
import { CheckCircle, ChevronUp, DollarSign, Layers, Plus,TrendingUp } from 'lucide-react';
import type { ServiceCatalog } from '../../../api/service-catalog/serviceCatalogTypes';
import { formatPrice, normalizeAmount } from '../utils/serviceCatalogUiUtils';
import  {ServiceStatus } from '../../../api/service-catalog/serviceCatalogTypes';
import { cn } from '../../../../../../shared/utils/classNameUtils';


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
  onCreate,
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
          <h1 className="text-2xl font-semibold">Clinical & Billing Services</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage healthcare services, pricing, availability, and governance rules for your facility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Service
          </button>
        </div>
      </div>

     {/* Stats overview - Enhanced with gradients, icons, and better visual hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {/* Total Services Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          {/* Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
            )}>
              <Layers className={cn(
                'w-6 h-6',
                isDark ? 'text-blue-400' : 'text-blue-600'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}>
              Total
            </span>
          </div>
          
          {/* Value */}
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {services.length}
          </p>
          
          {/* Label */}
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Total Services
          </p>
          
          {/* Trend indicator */}
          <div className="absolute bottom-3 right-3">
            <div className={cn(
              'flex items-center gap-1 text-xs',
              isDark ? 'text-blue-400' : 'text-blue-600'
            )}>
              <span>+{services.length > 0 ? Math.floor(services.length * 0.2) : 0}%</span>
              <ChevronUp className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Active Services Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-green-500/30 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20' 
            : 'bg-gradient-to-br from-white to-green-50/50 border-green-200 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-green-500/10 group-hover:opacity-100' : 'bg-green-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          {/* Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110' 
                : 'bg-green-100 group-hover:bg-green-200 group-hover:scale-110'
            )}>
              <CheckCircle className={cn(
                'w-6 h-6',
                isDark ? 'text-green-400' : 'text-green-600'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full bg-green-500/20 text-green-500 border border-green-500/30'
            )}>
              Active
            </span>
          </div>
          
          {/* Value */}
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {activeCount}
          </p>
          
          {/* Label */}
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Active Services
          </p>
          
          {/* Progress bar */}
          <div className="absolute bottom-3 right-3 w-16">
            <div className="h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ 
                  width: `${services.length > 0 ? (activeCount / services.length) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Average Price Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/20' 
            : 'bg-gradient-to-br from-white to-yellow-50/50 border-yellow-200 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-yellow-500/10 group-hover:opacity-100' : 'bg-yellow-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          {/* Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-yellow-500/20 group-hover:bg-yellow-500/30 group-hover:scale-110' 
                : 'bg-yellow-100 group-hover:bg-yellow-200 group-hover:scale-110'
            )}>
              <DollarSign className={cn(
                'w-6 h-6',
                isDark ? 'text-yellow-400' : 'text-yellow-600'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}>
              Average
            </span>
          </div>
          
          {/* Value */}
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {formatPrice(avgPrice, 'UGX')}
          </p>
          
          {/* Label */}
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Average Price
          </p>
          
          {/* Price range indicator */}
          <div className="absolute bottom-3 right-3">
            <div className={cn(
              'flex items-center gap-1 text-xs',
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            )}>
              <span>per service</span>
            </div>
          </div>
        </div>

        {/* Total Value Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20' 
            : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-purple-500/10 group-hover:opacity-100' : 'bg-purple-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          {/* Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110' 
                : 'bg-purple-100 group-hover:bg-purple-200 group-hover:scale-110'
            )}>
              <TrendingUp className={cn(
                'w-6 h-6',
                isDark ? 'text-purple-400' : 'text-purple-600'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}>
              Total Value
            </span>
          </div>
          
          {/* Value */}
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {formatPrice(totalValue, 'UGX')}
          </p>
          
          {/* Label */}
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Total Portfolio Value
          </p>
          
          {/* Portfolio indicator */}
          {totalValue > 0 && (
            <div className="absolute bottom-3 right-3">
              <div className={cn(
                'text-xs px-2 py-1 rounded-full',
                isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
              )}>
                {services.length} {services.length === 1 ? 'service' : 'services'}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

ServiceCatalogHeader.displayName = 'ServiceCatalogHeader';

// AdminServiceCatalog/components/ServiceCatalogList.tsx
import React from 'react';
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Edit2,
  RefreshCw,
  Shield,
  Tag,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { ServiceCatalog, ServiceCategory } from '../../../api/service-catalog/serviceCatalogTypes';
import { formatPrice, getRiskLevelColor, getStatusBgColor, getStatusColor } from '../utils/serviceCatalogUiUtils';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

type ViewMode = 'list' | 'grid';

interface PaginationLike {
  total: number;
  from?: number;
  to?: number;
  current_page: number;
  last_page: number;
}

interface Props {
  theme: 'light' | 'dark';
  viewMode: ViewMode;

  isLoading: boolean;
  error: Error | null;

  services: ServiceCatalog[];
  expandedServices: Set<string>;
  onToggleExpand: (uuid: string) => void;

  onEdit: (service: ServiceCatalog) => void;
  onDuplicate: (service: ServiceCatalog) => void;
  onDelete: (service: ServiceCatalog) => void;
  onRestore: (service: ServiceCatalog) => void;

  onRetry: () => void;

  serviceCategoryOptions: { value: ServiceCategory; label: string; icon: React.ElementType; color: string }[];

  pagination?: PaginationLike;
  onPageChange: (page: number) => void;
}

export const ServiceCatalogList: React.FC<Props> = ({
  theme,
  viewMode,
  isLoading,
  error,
  services,
  expandedServices,
  onToggleExpand,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
  onRetry,
  serviceCategoryOptions,
  pagination,
  onPageChange,
}) => {
  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className={`rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <LoadingSkeleton variant="table" theme={theme} message="Loading services..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="text-center">
          <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Error loading services</p>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error.message}</p>
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className={`rounded-xl p-10 text-center ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <Tag className={`w-12 h-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <h3 className="mt-4 text-lg font-medium">No services found</h3>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Try adjusting filters or create your first service.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewMode === 'list' ? (
        <div className={`rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="grid grid-cols-12 gap-4 text-sm font-medium">
              <div className="col-span-6">Service</div>
              <div className="col-span-2 hidden md:block">Category</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
          </div>

          <div>
            {services.map((service) => {
              const category = serviceCategoryOptions.find(c => c.value === service.service_category);
              const CategoryIcon = category?.icon ?? Tag;

              return (
                <div
                  key={service.service_uuid}
                  className={`p-4 border-b last:border-b-0 ${
                    isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onToggleExpand(service.service_uuid)}
                          className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                          aria-label="Toggle details"
                        >
                          {expandedServices.has(service.service_uuid) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <CategoryIcon className={`w-4 h-4 ${category?.color ?? ''}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{service.service_name}</div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                              Code: {service.service_code} • {service.code_system}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 hidden md:block">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {service.service_category.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <div className="font-medium">{formatPrice(service.price_amount, service.currency_code)}</div>
                      {service.default_duration_minutes ? (
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {service.default_duration_minutes} mins
                        </div>
                      ) : null}
                      <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(service.status, isDark)} ${getStatusColor(service.status, isDark)}`}>
                        {service.status}
                      </div>
                    </div>

                    <div className="col-span-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onDuplicate(service)}
                          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEdit(service)}
                          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {service.deleted_at ? (
                          <button
                            onClick={() => onRestore(service)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-green-400 hover:text-green-300' : 'hover:bg-gray-200 text-green-600 hover:text-green-700'}`}
                            title="Restore"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onDelete(service)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' : 'hover:bg-gray-200 text-red-600 hover:text-red-700'}`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedServices.has(service.service_uuid) ? (
                    <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Service Details</h4>
                          <div className={`text-sm space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div><span className="font-medium">Department:</span> {service.department_specialty || 'General'}</div>
                            <div className={`inline-flex items-center gap-1 ${getRiskLevelColor(service.risk_level, isDark)}`}>
                              <Shield className="w-4 h-4" />
                              <span>Risk Level: {service.risk_level}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Validity Period</h4>
                          <div className={`text-sm space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>From: {service.effective_from}</span>
                            </div>
                            {service.effective_to ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>To: {service.effective_to}</span>
                              </div>
                            ) : null}

                            <div className="flex items-center gap-2">
                              {service.requires_informed_consent ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-500" />
                              )}
                              <span>Consent required: {service.requires_informed_consent ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Notes</h4>
                          <div className={`text-sm space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div>{service.service_description || '—'}</div>
                            <div>Created: {new Date(service.created_at).toLocaleDateString()}</div>
                            {service.updated_at !== service.created_at ? (
                              <div>Updated: {new Date(service.updated_at).toLocaleDateString()}</div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map((service) => {
              const category = serviceCategoryOptions.find(c => c.value === service.service_category);
              const CategoryIcon = category?.icon ?? Tag;

              return (
                <div
                  key={service.service_uuid}
                  className={`rounded-lg border p-4 ${isDark ? 'border-gray-800 hover:border-gray-700' : 'border-gray-200 hover:border-gray-300'} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <CategoryIcon className={`w-5 h-5 ${category?.color ?? ''}`} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium truncate">{service.service_name}</h4>
                        <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{service.service_code}</p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(service.status, isDark)} ${getStatusColor(service.status, isDark)}`}>
                      {service.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {formatPrice(service.price_amount, service.currency_code)}
                      </span>
                      {service.default_duration_minutes ? (
                        <span className={`inline-flex items-center gap-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Clock className="w-4 h-4" />
                          {service.default_duration_minutes}m
                        </span>
                      ) : null}
                    </div>

                    {service.service_description ? (
                      <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {service.service_description}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {service.code_system}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs ${getRiskLevelColor(service.risk_level, isDark)}`}>
                        <Shield className="w-3 h-3" />
                        {service.risk_level}
                      </span>
                    </div>

                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      Valid from: {service.effective_from}
                    </div>
                  </div>

                  <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(service)}
                        className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDuplicate(service)}
                        className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    {service.deleted_at ? (
                      <button
                        onClick={() => onRestore(service)}
                        className={`px-3 py-1.5 rounded text-xs font-medium ${
                          isDark ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50' : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => onDelete(service)}
                        className={`px-3 py-1.5 rounded text-xs font-medium ${
                          isDark ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pagination && pagination.total > 0 ? (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} services
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              disabled={pagination.current_page === 1}
              onClick={() => onPageChange(Math.max(1, pagination.current_page - 1))}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                pagination.current_page === 1
                  ? (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')
                  : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
              }`}
            >
              Previous
            </button>

            <span className={`px-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Page
            </span>

            <input
              type="number"
              min={1}
              max={pagination.last_page}
              value={pagination.current_page}
              onChange={(e) => {
                const next = Number(e.target.value) || 1;
                onPageChange(Math.max(1, Math.min(pagination.last_page, next)));
              }}
              className={`w-20 px-2 py-1.5 rounded border text-sm ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              aria-label="Page number"
            />

            <span className={`px-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              of {pagination.last_page}
            </span>

            <button
              disabled={pagination.current_page === pagination.last_page}
              onClick={() => onPageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                pagination.current_page === pagination.last_page
                  ? (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')
                  : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
              }`}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

ServiceCatalogList.displayName = 'ServiceCatalogList';

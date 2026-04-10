import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Pill, ShieldAlert, Boxes, ChevronRight, Package } from 'lucide-react';

import type {
  ControlledItem,
  InventoryItemNeedingReorder,
  InventoryRiskSummary,
} from '../../../api/admin-overview/FacilityAdminAnalyticsTypes';
import { EmptyChartState } from '../../../../../medical-records/ui/overview/medical-records-dashboard/dashboard.primitives';
import {
  cn,
  formatCurrency,
  formatNumber,
  getPanelClass,
  getRiskPillStyles,
  getSubtlePanelClass,
  sortInventoryByRisk,
} from './facilityAdminDashboard.utils';
import { ADMIN_ROUTES } from '../../../../../../app/routes/constants/administration.paths';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
interface FacilityAdminInventorySectionProps {
  isDark: boolean;
  summary: InventoryRiskSummary;
  itemsNeedingReorder: InventoryItemNeedingReorder[];
  controlledItems: ControlledItem[];
  controlledSubstancesCount: number;
}

const FacilityAdminInventorySection: React.FC<FacilityAdminInventorySectionProps> = ({
  isDark,
  summary,
  itemsNeedingReorder,
  controlledItems,
  controlledSubstancesCount,
}) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  const prioritizedItems = sortInventoryByRisk(itemsNeedingReorder).slice(0, 6);

  // Navigation handler with loading state
  const handleNavigate = (url: string, sectionName: string) => {
    setIsNavigating(sectionName);
    navigate(url);
  };

  // Show loading skeleton if navigating
  if (isNavigating) {
    return (
      <LoadingSkeleton 
        variant="dashboard" 
        theme={isDark ? 'dark' : 'light'}
        message={`Loading ${isNavigating}...`}
      />
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24 }}
      className={cn(panelClass, 'p-6')}
    >
      <div className="mb-6">
        <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
          Inventory Risk
        </h2>
        <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
          Reorder pressure, high-risk inventory, and controlled item visibility.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
            Active Items
          </p>
          <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {formatNumber(summary.total_active_items)}
          </p>
        </div>

        <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
            Below Reorder Point
          </p>
          <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {formatNumber(summary.items_below_reorder_point)}
          </p>
        </div>

        <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
            High Risk Items
          </p>
          <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {formatNumber(summary.high_risk_inventory_count)}
          </p>
        </div>

        <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
            Controlled Substances
          </p>
          <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {formatNumber(controlledSubstancesCount)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {/* Items Needing Reorder Section */}
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-col items-start gap-3">
              <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                Items Needing Reorder
              </h3>

              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold cursor-default',
                  isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700'
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Priority queue
              </div>
            </div>
          </div>

          {prioritizedItems.length ? (
            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {prioritizedItems.map((item) => (
                <div
                  key={item.item_code}
                  className={cn(
                    'rounded-2xl border p-4 cursor-default',
                    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'truncate text-sm font-semibold',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {item.item_name}
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-xs',
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        )}
                      >
                        {item.category} • {item.item_code}
                      </p>
                    </div>

                    <span
                      className={cn(
                        'w-fit rounded-full px-3 py-1 text-xs font-semibold cursor-default',
                        getRiskPillStyles(item.risk_level, isDark)
                      )}
                    >
                      {item.risk_level}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        Current
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-sm font-semibold',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {formatNumber(item.current_stock)}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        Reorder Point
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-sm font-semibold',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {formatNumber(item.reorder_point)}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        Shortage
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-sm font-semibold',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {formatNumber(item.shortage_units)}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        Reorder Qty
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-sm font-semibold',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {formatNumber(item.reorder_qty)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 text-xs">
                    <span className={cn(isDark ? 'text-slate-400' : 'text-slate-600')}>
                      Safety Stock: <strong>{formatNumber(item.safety_stock)}</strong>
                    </span>
                    <span className={cn(isDark ? 'text-slate-400' : 'text-slate-600')}>
                      Unit Cost: <strong>{formatCurrency(item.unit_cost)}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState
              title="No reorder risks"
              subtitle="Inventory reorder pressure will appear when items fall below thresholds."
              isDark={isDark}
            />
          )}

          {/* Manage Inventory Button */}
          <div className={cn('mt-4 pt-4 border-t', isDark ? 'border-white/10' : 'border-slate-200')}>
            <button
              onClick={() => handleNavigate(ADMIN_ROUTES.INVENTORY, 'Inventory Management')}
              className={cn(
                'w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer',
                isDark
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              )}
            >
              <Boxes className="h-4 w-4" />
              <span>Manage Inventory</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Controlled Items Section */}
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-col items-start gap-3">
              <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                Controlled Items
              </h3>

              <div
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold cursor-default',
                  isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-50 text-violet-700'
                )}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Monitored
              </div>
            </div>
          </div>

          {controlledItems.length ? (
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {controlledItems.slice(0, 10).map((item, index) => (
                <div
                  key={`${item.item_name}-${index}`}
                  className={cn(
                    'rounded-2xl border px-4 py-3 cursor-default',
                    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
                          isDark
                            ? 'bg-violet-500/10 text-violet-300'
                            : 'bg-violet-100 text-violet-700'
                        )}
                      >
                        <Pill className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm font-semibold',
                            isDark ? 'text-white' : 'text-slate-900'
                          )}
                        >
                          {item.item_name}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold cursor-default shrink-0',
                        isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
                      )}
                    >
                      {item.schedule}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState
              title="No controlled items"
              subtitle="Controlled item listings will appear here when returned by the API."
              isDark={isDark}
            />
          )}

          {/* Manage Stock Items Button */}
          <div className={cn('mt-4 pt-4 border-t', isDark ? 'border-white/10' : 'border-slate-200')}>
            <button
              onClick={() => handleNavigate(ADMIN_ROUTES.INVENTORY, 'Stock Items')}
              className={cn(
                'w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer',
                isDark
                  ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
              )}
            >
              <Package className="h-4 w-4" />
              <span>Browse Stock Items</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f1f1'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#94a3b8'};
        }
      `}</style>
    </motion.section>
  );
};

export default FacilityAdminInventorySection;
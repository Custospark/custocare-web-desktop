import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  type RenderableChargeItem,
  type BackendChargeItem,
  formatCurrency,
} from '../billing-types';
import { isInventoryItem } from '../../../../api/billable-items/BillingItemsTypes';
import { getRoleDisplayName as formatName } from '../../../../../../shared/utils/facilityRoleFormator';

interface ChargeItemRowProps {
  item: RenderableChargeItem;
  index: number;
  isReadOnly: boolean;
  theme: 'light' | 'dark';
  colors: any;
  itemsFullData?: any[];
  viewMode: 'desktop' | 'mobile';
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onQuantityChange: (itemId: string, value: string) => void;
  onQuantityBlur: (itemId: string, value: string) => void;
}

const getStockBadge = (
  item: RenderableChargeItem,
  itemsFullData: any[] | undefined,
  isDark: boolean
) => {
  const service = item.service;
  const fullItem = itemsFullData?.find(
    (x) => x.id === service.id && x.code === service.code && x.category === service.category
  );

  if (!fullItem) {
    return (
      <span
        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
          isDark ? 'bg-purple-900/50 text-purple-200' : 'bg-purple-50 text-purple-700'
        }`}
      >
        Service
      </span>
    );
  }

  if (isInventoryItem(fullItem)) {
    const units = fullItem.package_quantity;
    const isLow = fullItem.stock.is_low_stock;
    const isOut = units <= 0;

    const unitName = fullItem.unit_of_measure ?? 'unit';
    const pluralUnit = unitName.endsWith('y')
      ? unitName.slice(0, -1) + 'ies'
      : unitName.endsWith('s')
      ? unitName
      : unitName + 's';

    const displayUnit = units === 1 ? unitName : pluralUnit;

    return (
      <span
        className={`text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${
          isOut
            ? isDark
              ? 'bg-red-900/50 text-red-200'
              : 'bg-red-100 text-red-700'
            : isLow
            ? isDark
              ? 'bg-yellow-900/50 text-yellow-200'
              : 'bg-yellow-100 text-yellow-700'
            : isDark
            ? 'bg-green-900/50 text-green-200'
            : 'bg-green-100 text-green-700'
        }`}
      >
        {isOut ? 'Out of stock' : `${units} ${displayUnit}`}
      </span>
    );
  }

  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
        isDark ? 'bg-purple-900/50 text-purple-200' : 'bg-purple-50 text-purple-700'
      }`}
    >
      Service
    </span>
  );
};

export const ChargeItemRow: React.FC<ChargeItemRowProps> = ({
  item,
  index,
  isReadOnly,
  theme,
  colors,
  itemsFullData,
  viewMode,
  onIncrease,
  onDecrease,
  onRemove,
  onQuantityChange,
  onQuantityBlur,
}) => {
  const isDark = theme === 'dark';

  const isPersistedBackendItem = item.source === 'backend';
  const backendItem = isPersistedBackendItem ? (item as BackendChargeItem) : null;
  const requiresReason = !!backendItem?.permissions?.reason_required;

  const actionButtonClass = `p-2 border ${
    isDark
      ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300'
      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'
  } transition-colors cursor-pointer rounded`;

  const removeButtonClass = `ml-1 p-2 ${
    isDark
      ? 'bg-gray-800 hover:bg-red-900/20 text-gray-300 hover:text-red-400'
      : 'bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500'
  } transition-colors cursor-pointer rounded-full`;

  const renderQuantityControlDesktop = () => {
    if (isReadOnly) {
      return (
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-2 border ${
              isDark
                ? 'border-gray-700 bg-gray-800 text-gray-100'
                : 'border-gray-200 bg-gray-50 text-gray-900'
            } rounded text-center w-20`}
          >
            {item.quantity}
          </span>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
            × {formatCurrency(item.service.unitPrice)}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => onDecrease(item.id)}
          className={actionButtonClass}
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </motion.button>

        {isPersistedBackendItem ? (
          <div
            className={`w-20 px-2 py-2 text-center border rounded ${
              isDark
                ? 'border-gray-700 bg-gray-800 text-gray-100'
                : 'border-gray-200 bg-white text-gray-900'
            }`}
            title="Persisted item quantity is adjusted via audited modal"
          >
            {item.quantity}
          </div>
        ) : (
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={9999}
            value={item.quantity}
            onChange={(e) => onQuantityChange(item.id, e.target.value)}
            onBlur={(e) => onQuantityBlur(item.id, e.target.value)}
            className={`w-20 px-2 py-2 text-center border ${
              isDark
                ? 'border-gray-700 bg-gray-800 text-gray-100'
                : 'border-gray-200 bg-white text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded`}
          />
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => onIncrease(item.id)}
          className={actionButtonClass}
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(item.id)}
          className={removeButtonClass}
          title={isPersistedBackendItem ? 'Adjust/remove persisted item' : 'Remove item'}
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>

        {isPersistedBackendItem && (
          <span className={`text-[11px] ${isDark ? 'text-amber-300' : 'text-amber-700'} ml-1`}>
            Audited adjustment
          </span>
        )}
      </div>
    );
  };

  const renderQuantityControlMobile = () => {
    if (isReadOnly) {
      return (
        <div className="space-y-2">
          <div
            className={`p-3 ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            } border ${colors.border.primary} rounded-lg text-center`}
          >
            <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Quantity: {item.quantity}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onDecrease(item.id)}
            className={`flex-1 p-2 border ${
              isDark
                ? 'border-gray-700 bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'
            } transition-colors cursor-pointer rounded-lg`}
          >
            <Minus className="w-4 h-4 mx-auto" />
          </motion.button>

          {isPersistedBackendItem ? (
            <div
              className={`w-20 px-2 py-2 text-center border rounded ${
                isDark
                  ? 'border-gray-700 bg-gray-800 text-gray-100'
                  : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              {item.quantity}
            </div>
          ) : (
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={9999}
              value={item.quantity}
              onChange={(e) => onQuantityChange(item.id, e.target.value)}
              onBlur={(e) => onQuantityBlur(item.id, e.target.value)}
              className={`w-20 px-2 py-2 text-center border ${
                isDark
                  ? 'border-gray-700 bg-gray-800 text-gray-100'
                  : 'border-gray-200 bg-white text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded`}
            />
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onIncrease(item.id)}
            className={`flex-1 p-2 border ${
              isDark
                ? 'border-gray-700 bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'
            } transition-colors cursor-pointer rounded-lg`}
          >
            <Plus className="w-4 h-4 mx-auto" />
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onRemove(item.id)}
            className={`p-2 ${
              isDark
                ? 'bg-gray-700 hover:bg-red-900/20 text-gray-300 hover:text-red-400'
                : 'bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500'
            } cursor-pointer rounded-full shrink-0`}
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>

        {isPersistedBackendItem && (
          <div className={`text-center text-[11px] ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            Quantity changes open audited adjustment modal
          </div>
        )}
      </div>
    );
  };

  if (viewMode === 'desktop') {
    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16, height: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`grid grid-cols-12 gap-3 px-4 py-3 items-center border-b last:border-b-0
          ${colors.border.primary} transition-colors duration-150
          ${!isReadOnly ? `hover:${colors.bg.hover}` : ''}
          ${
            index % 2 === 0
              ? isDark
                ? 'bg-gray-800/30'
                : 'bg-gray-50/50'
              : isDark
              ? 'bg-transparent'
              : 'bg-transparent'
          }`}
      >
        <div className="col-span-1">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full
              ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-600'} text-sm font-medium`}
          >
            {index + 1}
          </div>
        </div>

        <div className="col-span-4 min-w-0">
          <p className={`font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {item.service.name ?? 'NA'}
          </p>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`text-xs px-1.5 py-0.5 ${
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              } rounded`}
            >
              {item.service.code}
            </span>

            <span className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatName(item.service.category)}
            </span>

            {getStockBadge(item, itemsFullData, isDark)}

            {isPersistedBackendItem ? (
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700'
                }`}
              >
                Persisted
              </span>
            ) : (
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                Draft
              </span>
            )}

            {requiresReason && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-50 text-rose-700'
                }`}
              >
                Reason required
              </span>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <span className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {formatCurrency(item.service.unitPrice)}
          </span>
        </div>

        <div className="col-span-3">{renderQuantityControlDesktop()}</div>

        <div className="col-span-2 text-right">
          <span className="font-extrabold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            {formatCurrency(item.totalAmount)}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`border ${colors.border.primary} ${
        isDark ? 'bg-gray-800' : 'bg-gray-50'
      } p-4 rounded-xl ${
        index % 2 === 0
          ? isDark
            ? 'bg-gray-800/80'
            : 'bg-gray-50'
          : isDark
          ? 'bg-gray-800/60'
          : 'bg-gray-50/80'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-full
              ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-600'} text-xs font-medium shrink-0`}
          >
            {index + 1}
          </div>

          <div className="min-w-0">
            <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'} truncate`}>
              {item.service.name}
            </p>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-xs px-1.5 py-0.5 ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                } rounded`}
              >
                {item.service.code}
              </span>

              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                {item.service.category}
              </span>

              {getStockBadge(item, itemsFullData, isDark)}

              {isPersistedBackendItem ? (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  Persisted
                </span>
              ) : (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  Draft
                </span>
              )}

              {requiresReason && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  Reason required
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 items-center">
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unit price</p>
          <p className={`font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {formatCurrency(item.service.unitPrice)}
          </p>
        </div>

        <div className="text-right">
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
          <p className="font-extrabold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            {formatCurrency(item.totalAmount)}
          </p>
        </div>

        <div className="col-span-2">
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Quantity</p>
          {renderQuantityControlMobile()}
        </div>
      </div>
    </motion.div>
  );
};
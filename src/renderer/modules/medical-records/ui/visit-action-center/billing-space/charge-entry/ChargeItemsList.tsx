import React from 'react';
import { Calculator, Trash2, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, itemVariants } from '../../../../../../shared/components/animations/motionVariants';
import { type RenderableChargeItem, formatCurrency } from '../billing-types';
import { ChargeItemRow } from './ChargeItemRow';

interface ChargeItemsListProps {
  chargeItems: RenderableChargeItem[];
  subtotal: number;
  isReadOnly: boolean;
  isSearchSticky: boolean;
  theme: 'light' | 'dark';
  colors: any;
  itemsFullData?: any[];
  onClearAll: () => void;
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onQuantityChange: (itemId: string, value: string) => void;
  onQuantityBlur: (itemId: string, value: string) => void;
  onViewHistory: (item: RenderableChargeItem) => void;
}

export const ChargeItemsList: React.FC<ChargeItemsListProps> = ({
  chargeItems,
  subtotal,
  isReadOnly,
  isSearchSticky,
  theme,
  colors,
  itemsFullData,
  onClearAll,
  onIncrease,
  onDecrease,
  onRemove,
  onQuantityChange,
  onQuantityBlur,
  onViewHistory,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex-1 min-h-0">
      {/* Items header */}
      <motion.div
        variants={itemVariants}
        className={`sticky top-16 z-20 mb-3 rounded-xl px-2 py-2 ${colors.bg.primary} transition-all duration-200 ${
          isSearchSticky ? 'bg-opacity-95 shadow-sm backdrop-blur-sm' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-1 sm:px-2">
          <h3 className="text-base sm:text-lg font-bold">
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Selected items
            </span>{' '}
            <span className={`${isDark ? 'text-gray-300' : 'text-gray-500'} font-semibold`}>
              ({chargeItems.length})
            </span>
            {isReadOnly && (
              <span
                className={`ml-2 text-xs font-normal ${
                  isDark 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-600'
                } px-2 py-0.5 rounded-full`}
              >
                View only
              </span>
            )}
          </h3>

          {!isReadOnly && chargeItems.length > 0 && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClearAll}
              className={`flex items-center gap-2 px-3.5 py-2 ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              } transition-colors cursor-pointer rounded-lg`}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Clear all</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Items list area */}
      {chargeItems.length === 0 ? (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className={`h-full min-h-[260px] flex flex-col items-center justify-center text-center
            border ${colors.border.primary} rounded-xl ${colors.bg.secondary}`}
        >
          <div className={`p-4 ${colors.bg.primary} rounded-full mb-4`}>
            <Calculator className={`w-10 h-10 sm:w-12 sm:h-12 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
          </div>
          <p className={`text-base font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
            No items added
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {isReadOnly
              ? 'This settled billing session has no items.'
              : 'Search and add services/items to start billing'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className={`h-full border ${colors.border.primary} rounded-xl overflow-hidden flex flex-col min-h-0
            shadow-sm ${isReadOnly ? 'opacity-90' : ''}`}
        >
          {/* Desktop table header */}
          <div
            className={`hidden md:grid min-w-[720px] grid-cols-12 gap-3 px-4 py-3 text-sm font-semibold border-b
              ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'} 
              ${colors.border.primary} sticky top-0 z-10 rounded-t-xl`}
          >
            <div className="col-span-1 flex items-center gap-1">
              <Hash className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <div className="col-span-3 min-w-0">Item</div>
            <div className="col-span-2 text-center">Unit</div>
            <div className="col-span-4 text-center">Qty / Actions</div>
            <div className="col-span-2 text-right tabular-nums">Total</div>
          </div>

          {/* Scrollable list */}
          <div
            className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scroll-smooth
              [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-track]:rounded-full
              dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 
              dark:[&::-webkit-scrollbar-track]:bg-gray-800
              dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500
              [&::-webkit-scrollbar-thumb]:bg-gray-300 
              [&::-webkit-scrollbar-track]:bg-gray-100
              hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
          >
            {/* Desktop rows */}
            <div className="hidden md:block">
              <AnimatePresence initial={false}>
                {chargeItems.map((item, index) => (
                  <ChargeItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    isReadOnly={isReadOnly}
                    theme={theme}
                    colors={colors}
                    itemsFullData={itemsFullData}
                    viewMode="desktop"
                    onIncrease={onIncrease}
                    onDecrease={onDecrease}
                    onRemove={onRemove}
                    onQuantityChange={onQuantityChange}
                    onQuantityBlur={onQuantityBlur}
                    onViewHistory={onViewHistory}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden p-3 space-y-3">
              <AnimatePresence initial={false}>
                {chargeItems.map((item, index) => (
                  <ChargeItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    isReadOnly={isReadOnly}
                    theme={theme}
                    colors={colors}
                    itemsFullData={itemsFullData}
                    viewMode="mobile"
                    onIncrease={onIncrease}
                    onDecrease={onDecrease}
                    onRemove={onRemove}
                    onQuantityChange={onQuantityChange}
                    onQuantityBlur={onQuantityBlur}
                    onViewHistory={onViewHistory}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom mini footer */}
          <div
            className={`px-4 py-3 border-t ${colors.border.primary} ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
            } flex min-w-0 items-center justify-between gap-3 sticky bottom-0 z-10 rounded-b-xl`}
          >
            <span className={`min-w-0 shrink text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
              Subtotal
            </span>
            <span className="shrink-0 text-lg font-extrabold tabular-nums whitespace-nowrap bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
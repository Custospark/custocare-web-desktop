// ChargeEntryStep.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Minus, Trash2, Calculator, X, AlertCircle, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addChargeItem,
  increaseQuantity,
  decreaseQuantity,
  removeChargeItem,
  clearCharges,
  setStep,
  selectChargeItems,
  setQuantity, 
} from './billing-slice';
import { MOCK_SERVICES, ServiceItem, formatCurrency } from './billing-types';

interface ChargeEntryStepProps {
  theme?: 'light' | 'dark';
}

const safeLower = (v: string) => v.toLowerCase();

export const ChargeEntryStep: React.FC<ChargeEntryStepProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();

  const chargeItems = useSelector(selectChargeItems);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ServiceItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50',
      elevated: isDark ? 'bg-gray-900' : 'bg-white',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
    },
  };

  const subtotal = useMemo(
    () => chargeItems.reduce((sum, item) => sum + item.totalAmount, 0),
    [chargeItems]
  );

  // Search filter
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const t = safeLower(term);
    const results = MOCK_SERVICES.filter((s) => {
      return (
        safeLower(s.name).includes(t) ||
        safeLower(s.code).includes(t) ||
        safeLower(s.category).includes(t)
      );
    }).slice(0, 8);

    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  }, [searchTerm]);

  // Close search results on outside click + esc
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node)) setShowSearchResults(false);
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSearchResults(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleAddItem = (service: ServiceItem) => {
    dispatch(addChargeItem(service));
    setSearchTerm('');
    setShowSearchResults(false);
    inputRef.current?.focus();
  };

  const handleClearAll = () => {
    if (chargeItems.length === 0) return;
    if (confirm('Clear all selected charge items?')) dispatch(clearCharges());
  };

  const handleProceedToBilling = () => dispatch(setStep('billing_summary'));

  const isDisabledProceed = chargeItems.length === 0;

  // ✅ normalize quantity input
  const clampQty = (val: number) => {
    if (!Number.isFinite(val)) return 1;
    const n = Math.floor(val);
    if (n < 1) return 1;
    if (n > 9999) return 9999;
    return n;
  };

  const handleQtyChange = (itemId: string, raw: string) => {
    // allow empty while typing
    if (raw.trim() === '') {
      dispatch(setQuantity({ itemId, quantity: 1 }));
      return;
    }
    const parsed = Number(raw);
    dispatch(setQuantity({ itemId, quantity: clampQty(parsed) }));
  };

  const handleQtyBlur = (itemId: string, raw: string) => {
    const parsed = Number(raw);
    dispatch(setQuantity({ itemId, quantity: clampQty(parsed) }));
  };

  return (
    <div className="p-4 sm:p-5 lg:p-6 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 h-full">
        {/* Left: Search + Items */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-0">
          {/* Search */}
          <div ref={searchWrapRef} className="relative">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.text.tertiary}`} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by service/item  name, code, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.trim() && setShowSearchResults(true)}
                className={`w-full pl-9 pr-10 py-2.5 sm:py-3 border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setShowSearchResults(false);
                    inputRef.current?.focus();
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 ${colors.bg.hover} ${colors.text.secondary} cursor-pointer`}
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results (no rounded) */}
            {showSearchResults && searchResults.length > 0 && (
              <div
                className={`absolute z-20 w-full mt-2 border shadow-2xl ${colors.border.primary} ${colors.bg.elevated}
                max-h-72 overflow-y-auto`}
              >
                {searchResults.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleAddItem(service)}
                    className={`w-full text-left p-3 border-b last:border-b-0 ${colors.border.primary}
                    ${colors.bg.hover} transition-colors cursor-pointer`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold truncate ${colors.text.primary}`}>
                            {service.name}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 ${colors.bg.secondary} ${colors.text.secondary} flex-shrink-0`}
                          >
                            {service.code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-sm">
                          <span className={`truncate ${colors.text.secondary}`}>{service.category}</span>
                          <span className={`font-semibold ${colors.text.primary}`}>
                            {formatCurrency(service.unitPrice)}
                          </span>
                        </div>
                      </div>
                      <Plus className={`${isDark ? 'text-blue-400' : 'text-blue-600'} w-4 h-4 flex-shrink-0`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Items header */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <h3 className={`text-base sm:text-lg font-bold ${colors.text.primary}`}>
              Selected items <span className={`${colors.text.secondary} font-semibold`}>({chargeItems.length})</span>
            </h3>

            {chargeItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className={`flex items-center gap-2 px-3 py-2 ${colors.bg.hover} ${colors.text.secondary}
                transition-colors cursor-pointer`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Clear all</span>
              </button>
            )}
          </div>

          {/* Items list area */}
          <div className="mt-3 flex-1 min-h-0">
            {chargeItems.length === 0 ? (
              <div className={`h-full min-h-[260px] flex flex-col items-center justify-center text-center border ${colors.border.primary}`}>
                <Calculator className={`w-10 h-10 sm:w-12 sm:h-12 mb-3 ${colors.text.tertiary}`} />
                <p className={`text-base font-semibold ${colors.text.primary}`}>No items added</p>
                <p className={`text-sm mt-1 ${colors.text.secondary}`}>
                  Search and add services/items to start billing
                </p>
              </div>
            ) : (
              // ✅ force internal scrolling: max-h + overflow-y-auto
              <div className={`h-full border ${colors.border.primary} overflow-hidden flex flex-col min-h-0`}>
                {/* Desktop table header */}
                <div className={`hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-sm font-semibold border-b ${colors.bg.secondary} ${colors.border.primary}`}>
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-3">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Scrollable list container */}
                <div className="flex-1 min-h-0 overflow-y-auto max-h-[58vh] lg:max-h-[62vh]">
                  {/* Desktop rows */}
                  <div className="hidden md:block">
                    {chargeItems.map((item) => (
                      <div
                        key={item.id}
                        className={`grid grid-cols-12 gap-3 px-4 py-3 items-center border-b last:border-b-0 ${colors.border.primary}`}
                      >
                        {/* Item */}
                        <div className="col-span-5 min-w-0">
                          <p className={`font-semibold truncate ${colors.text.primary}`}>{item.service.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 ${colors.bg.secondary} ${colors.text.secondary}`}>
                              {item.service.code}
                            </span>
                            <span className={`text-xs truncate ${colors.text.secondary}`}>{item.service.category}</span>
                          </div>
                        </div>

                        {/* Unit */}
                        <div className="col-span-2">
                          <span className={`font-semibold ${colors.text.primary}`}>
                            {formatCurrency(item.service.unitPrice)}
                          </span>
                        </div>

                        {/* Qty (buttons + input) */}
                        <div className="col-span-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => dispatch(decreaseQuantity(item.id))}
                              className={`p-2 border ${colors.border.primary} ${colors.bg.hover} transition-colors cursor-pointer`}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={9999}
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(item.id, e.target.value)}
                              onBlur={(e) => handleQtyBlur(item.id, e.target.value)}
                              className={`w-20 px-2 py-2 text-center border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                              focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                            />

                            <button
                              type="button"
                              onClick={() => dispatch(increaseQuantity(item.id))}
                              className={`p-2 border ${colors.border.primary} ${colors.bg.hover} transition-colors cursor-pointer`}
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => dispatch(removeChargeItem(item.id))}
                              className={`ml-1 p-2 ${colors.bg.hover} ${colors.text.secondary} transition-colors cursor-pointer`}
                              title="Remove item"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="col-span-2 text-right">
                          <span className={`font-extrabold ${colors.text.primary}`}>
                            {formatCurrency(item.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile cards (no rounded) */}
                  <div className="md:hidden p-3 space-y-3">
                    {chargeItems.map((item) => (
                      <div key={item.id} className={`border ${colors.border.primary} ${colors.bg.secondary} p-3`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`font-semibold ${colors.text.primary} truncate`}>{item.service.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-1.5 py-0.5 ${colors.bg.primary} ${colors.text.secondary}`}>
                                {item.service.code}
                              </span>
                              <span className={`text-xs ${colors.text.secondary} truncate`}>{item.service.category}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => dispatch(removeChargeItem(item.id))}
                            className={`p-2 ${colors.bg.hover} ${colors.text.secondary} cursor-pointer`}
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 items-center">
                          <div>
                            <p className={`text-xs ${colors.text.secondary}`}>Unit price</p>
                            <p className={`font-bold ${colors.text.primary}`}>
                              {formatCurrency(item.service.unitPrice)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className={`text-xs ${colors.text.secondary}`}>Total</p>
                            <p className={`font-extrabold ${colors.text.primary}`}>
                              {formatCurrency(item.totalAmount)}
                            </p>
                          </div>

                          <div className="col-span-2">
                            <p className={`text-xs ${colors.text.secondary} mb-2`}>Quantity</p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => dispatch(decreaseQuantity(item.id))}
                                className={`flex-1 p-2 border ${colors.border.primary} ${colors.bg.hover} transition-colors cursor-pointer`}
                              >
                                <Minus className="w-4 h-4 mx-auto" />
                              </button>

                              <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={9999}
                                value={item.quantity}
                                onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                onBlur={(e) => handleQtyBlur(item.id, e.target.value)}
                                className={`w-20 px-2 py-2 text-center border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                                focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
                              />

                              <button
                                type="button"
                                onClick={() => dispatch(increaseQuantity(item.id))}
                                className={`flex-1 p-2 border ${colors.border.primary} ${colors.bg.hover} transition-colors cursor-pointer`}
                              >
                                <Plus className="w-4 h-4 mx-auto" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom mini footer */}
                <div className={`px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary} flex items-center justify-between`}>
                  <span className={`text-sm ${colors.text.secondary}`}>Subtotal</span>
                  <span className={`text-lg font-extrabold text-green-500`}>
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-4 xl:col-span-3 min-h-0">
          <div className="lg:sticky lg:top-4 space-y-4">
            <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary}`}>
              <h3 className={`text-base sm:text-lg font-bold mb-4 ${colors.text.primary}`}>Bill summary</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={colors.text.secondary}>Subtotal</span>
                  <span className={`font-semibold ${colors.text.primary}`}>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={colors.text.secondary}>Tax</span>
                  <span className={colors.text.tertiary}>Handled next</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={colors.text.secondary}>Discount</span>
                  <span className={colors.text.tertiary}>Handled next</span>
                </div>

                <div className={`pt-4 border-t ${colors.border.primary}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${colors.text.secondary}`}>Grand total</span>
                    <span className="text-2xl font-extrabold text-green-500">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary}`}>
              <button
                type="button"
                onClick={handleProceedToBilling}
                disabled={isDisabledProceed}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-colors
                ${
                  isDisabledProceed
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer`
                }`}
              >
                <span>Proceed to billing</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className={`text-xs leading-relaxed ${colors.text.secondary}`}>
                  Taxes, discounts, payment methods, and receipt printing are handled in Billing Summary.
                </p>
              </div>
            </div>

            <div className={`p-4 border ${colors.border.primary} ${colors.bg.secondary}`}>
              <p className={`text-xs ${colors.text.secondary}`}>
                <span className="font-semibold">Workflow tip:</span> keep the cursor in the search box and keep selecting
                items.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Shield,
  Phone,
  Zap,
  AlertCircle,
  
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { formatCurrency } from '../billing-types';

interface PaymentMethodsProps {
  theme: 'light' | 'dark';
  isReadOnly: boolean;
  isProcessing: boolean;
  paymentMethods: any[];
  focusedAmountInputs: Record<number, boolean>;
  cashChangeByIndex: Record<number, { dueBefore: number; change: number }>;
  billingData: any;
  onPaymentTypeChange: (index: number, newType: string) => void;
  onPaymentAmountChange: (index: number, rawValue: string) => void;
  onAutoFillRemaining: (index: number) => void;
  onMobilePhoneChange: (index: number, rawValue: string) => void;
  onInitiateMobilePayment: (index: number) => void;
  onAddPaymentMethod: () => void;
  onRemovePaymentMethod: (index: number) => void;
  onFocusAmountInput: (index: number) => void;
  onBlurAmountInput: (index: number) => void;
  colors: any;
}

const paymentIcon = (type: string) => {
  switch (type) {
    case 'cash':
      return <FaCashRegister className="w-4 h-4 text-green-500" />;
    case 'card':
      return <CreditCard className="w-4 h-4 text-blue-500" />;
    case 'insurance':
      return <Shield className="w-4 h-4 text-purple-500" />;
    case 'mobile':
      return <Banknote className="w-4 h-4 text-yellow-500" />;
    default:
      return <Wallet className="w-4 h-4 text-gray-500" />;
  }
};

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  isReadOnly,
  isProcessing,
  paymentMethods,
  focusedAmountInputs,
  cashChangeByIndex,
  onPaymentTypeChange,
  onPaymentAmountChange,
  onAutoFillRemaining,
  onMobilePhoneChange,
  onInitiateMobilePayment,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onFocusAmountInput,
  onBlurAmountInput,
  colors,
}) => {
  const getDisplayAmount = (index: number, amount: number) => {
    const isFocused = focusedAmountInputs[index];
    const isZero = amount === 0;
    return !isFocused && isZero ? '' : String(amount);
  };

  return (
    <div className={`border ${colors.border.primary} rounded-lg overflow-hidden shadow-sm`}>
      <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h4 className={`text-sm font-bold ${colors.text.primary}`}>Payment Methods</h4>
          {!isReadOnly && (
            <button
              type="button"
              onClick={onAddPaymentMethod}
              disabled={paymentMethods.length >= 3}
              className={`text-xs font-semibold px-3 py-1.5 border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}
              transition-all duration-200 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm active:scale-95`}
            >
              + Add Method
            </button>
          )}
        </div>
      </div>

      <div className={`p-4 space-y-3 ${colors.bg.secondary}`}>
        {paymentMethods.map((method, index) => {
          const isMobile = method.type === 'mobile';
          const isCash = method.type === 'cash';
          const cashCalculation = isCash ? cashChangeByIndex[index] : undefined;
          const tendered = Number(method.amount) || 0;
          const showCashCalculation = isCash && (focusedAmountInputs[index] || tendered > 0);

          return (
            <div
              key={index}
              className={`p-3 sm:p-4 border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm ${
                isReadOnly ? 'bg-opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {paymentIcon(method.type)}
                  <div
                    className={`border ${
                      isReadOnly ? colors.border.disabled : colors.select.border
                    } ${colors.select.wrap} px-2.5 py-1.5 rounded`}
                  >
                    <select
                      value={method.type}
                      onChange={(e) => onPaymentTypeChange(index, e.target.value)}
                      disabled={isReadOnly}
                      className={`text-sm ${
                        isReadOnly
                          ? `${colors.select.disabled} cursor-not-allowed`
                          : `${colors.select.text} cursor-pointer`
                      } bg-transparent capitalize outline-none`}
                    >
                      <option className={colors.select.option} value="cash">Cash</option>
                      <option className={colors.select.option} value="card">Card</option>
                      <option className={colors.select.option} value="insurance">Insurance</option>
                      <option className={colors.select.option} value="mobile">Mobile Money</option>
                      <option className={colors.select.option} value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                {!isReadOnly && paymentMethods.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemovePaymentMethod(index)}
                    className={`p-2 ${colors.bg.hover} ${colors.text.secondary} transition-all duration-200 rounded cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600`}
                    aria-label="Remove payment method"
                    title="Remove"
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                )}
              </div>

              {/* Mobile phone input */}
              {isMobile && (
                <div className="mb-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-8">
                    <div className="relative">
                      <Phone
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                          isReadOnly ? colors.text.disabled : colors.text.tertiary
                        } pointer-events-none`}
                      />
                      <input
                        type="tel"
                        value={method.details || ''}
                        onChange={(e) => onMobilePhoneChange(index, e.target.value)}
                        placeholder="Phone number (e.g. 2567xxxxxxx)"
                        inputMode="numeric"
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
                        className={`w-full pl-10 pr-3 py-2.5 text-sm border ${
                          isReadOnly
                            ? `${colors.border.disabled} ${colors.bg.disabled} ${colors.text.disabled} cursor-not-allowed`
                            : `${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 ${colors.accent.ring}`
                        } rounded-lg transition-shadow`}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <button
                      type="button"
                      onClick={() => onInitiateMobilePayment(index)}
                      disabled={isProcessing || isReadOnly}
                      className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg
                      ${
                        isProcessing || isReadOnly
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer hover:shadow-md active:scale-95`
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Initiate</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Amount input */}
              <div className="space-y-2">
                <input
                  type="number"
                  value={getDisplayAmount(index, method.amount)}
                  onFocus={() => {
                    if (isReadOnly) return;
                    if (!focusedAmountInputs[index]) {
                      onFocusAmountInput(index);
                    }
                  }}
                  onBlur={() => {
                    if (isReadOnly) return;
                    if (method.amount === 0) {
                      onBlurAmountInput(index);
                    }
                  }}
                  onChange={(e) => {
                    if (isReadOnly) return;
                    if (!focusedAmountInputs[index]) {
                      onFocusAmountInput(index);
                    }
                    onPaymentAmountChange(index, e.target.value);
                  }}
                  placeholder={isCash ? 'Enter cash amount' : 'Enter amount'}
                  min={0}
                  step="0.01"
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  className={`w-full px-3.5 py-2.5 text-sm border ${
                    isReadOnly
                      ? `${colors.border.disabled} ${colors.bg.disabled} ${colors.text.disabled} cursor-not-allowed`
                      : `${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 ${colors.accent.ring}`
                  } rounded-lg transition-shadow`}
                />

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => onAutoFillRemaining(index)}
                    className={`w-full text-xs font-semibold px-3 py-2 border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}
                    transition-all duration-200 rounded-lg cursor-pointer hover:shadow-sm active:scale-98`}
                  >
                    Fill Remaining Balance
                  </button>
                )}

                {/* Cash calculation */}
                {showCashCalculation && cashCalculation && (
                  <div className={`p-3 sm:p-4 border ${colors.border.primary} ${colors.bg.secondary} rounded-lg`}>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <p className={`text-xs ${colors.text.secondary} mb-1`}>Due</p>
                        <p className={`text-sm sm:text-base font-extrabold ${colors.text.primary}`}>
                          {formatCurrency(cashCalculation.dueBefore)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.text.secondary} mb-1`}>Tendered</p>
                        <p className={`text-sm sm:text-base font-extrabold ${colors.text.primary}`}>
                          {formatCurrency(tendered)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.text.secondary} mb-1`}>Change</p>
                        <p className="text-sm sm:text-base font-extrabold text-green-600 dark:text-green-400">
                          {formatCurrency(cashCalculation.change)}
                        </p>
                      </div>
                    </div>

                    {!isReadOnly && tendered < cashCalculation.dueBefore && (
                      <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-yellow-600 text-white dark:bg-yellow-500 dark:text-white">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" />
                        <p className="text-sm font-medium">
                          Insufficient cash by{' '}
                          <span className="font-bold underline decoration-white/60">
                            {formatCurrency(cashCalculation.dueBefore - tendered)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
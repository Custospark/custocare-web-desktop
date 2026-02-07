/**
 * ============================================================================
 * BILLING CONTEXT - SHARED STATE MANAGEMENT
 * ============================================================================
 * 
 * Centralized billing state with dirty tracking and session persistence
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  ChargeItem,
  ServiceItem,
  Discount,
  Tax,
  PaymentMethod,
  BillingStatus,
} from './billing.types';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export type BillingStep = 'charge_entry' | 'billing_summary';

interface BillingContextState {
  // State
  charges: ChargeItem[];
  discount: Discount;
  taxes: Tax[];
  paymentMethods: PaymentMethod[];
  additionalNotes: string;
  status: BillingStatus;
  step: BillingStep;
  trayOpen: boolean;
  visitId: number | null;
  
  // Computed
  subtotal: number;
  grandTotal: number;
  balance: number;
  isDirty: boolean;
  
  // Actions
  openTray: (step?: BillingStep) => void;
  closeTray: () => void;
  setStep: (step: BillingStep) => void;
  addCharge: (service: ServiceItem, quantity?: number) => void;
  increaseQty: (serviceId: number) => void;
  decreaseQty: (serviceId: number) => void;
  removeLine: (serviceId: number) => void;
  clearCharges: () => void;
  updateDiscount: (discount: Discount) => void;
  updatePaymentMethods: (methods: PaymentMethod[]) => void;
  updateNotes: (notes: string) => void;
  settle: () => void;
  resetBilling: () => void;
}

const BillingContext = createContext<BillingContextState | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface BillingProviderProps {
  children: React.ReactNode;
  visitId: number | null;
  defaultTaxes: Tax[];
  defaultDiscount: Discount;
}

export const BillingProvider: React.FC<BillingProviderProps> = ({ 
  children, 
  visitId,
  defaultTaxes,
  defaultDiscount 
}) => {
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [charges, setCharges] = useState<ChargeItem[]>([]);
  const [discount, setDiscount] = useState<Discount>(defaultDiscount);
  const [taxes, setTaxes] = useState<Tax[]>(defaultTaxes);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { type: 'cash', amount: 0, details: '' }
  ]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [status, setStatus] = useState<BillingStatus>('draft');
  const [step, setStep] = useState<BillingStep>('charge_entry');
  const [trayOpen, setTrayOpen] = useState(false);

  // ============================================================================
  // SESSION STORAGE KEY
  // ============================================================================
  
  const storageKey = useMemo(() => 
    visitId ? `billing_draft_visit_${visitId}` : null,
    [visitId]
  );

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const subtotal = useMemo(() => 
    charges.reduce((sum, item) => sum + item.totalAmount, 0),
    [charges]
  );

  const grandTotal = useMemo(() => {
    const discountAmount = discount.type === 'percentage' 
      ? subtotal * (discount.value / 100)
      : discount.value;
    const taxableAmount = subtotal - Math.min(discountAmount, subtotal);
    const taxTotal = taxes.reduce((sum, tax) => sum + (taxableAmount * (tax.rate / 100)), 0);
    return taxableAmount + taxTotal;
  }, [subtotal, discount, taxes]);

  const balance = useMemo(() => {
    const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    return Math.max(0, grandTotal - totalPaid);
  }, [grandTotal, paymentMethods]);

  const isDirty = useMemo(() => 
    charges.length > 0 || 
    discount.value > 0 || 
    paymentMethods.some(m => m.amount > 0) ||
    additionalNotes.trim().length > 0,
    [charges.length, discount.value, paymentMethods, additionalNotes]
  );

  // ============================================================================
  // PERSISTENCE - Load from sessionStorage
  // ============================================================================
  
  useEffect(() => {
    if (!storageKey) return;
    
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCharges(data.charges || []);
        setDiscount(data.discount || defaultDiscount);
        setTaxes(data.taxes || defaultTaxes);
        setPaymentMethods(data.paymentMethods || [{ type: 'cash', amount: 0, details: '' }]);
        setAdditionalNotes(data.additionalNotes || '');
        setStatus(data.status || 'draft');
      } catch (error) {
        console.error('Failed to load billing draft:', error);
      }
    }
  }, [storageKey, defaultDiscount, defaultTaxes]);

  // ============================================================================
  // PERSISTENCE - Save to sessionStorage
  // ============================================================================
  
  useEffect(() => {
    if (!storageKey || !isDirty) return;
    
    const data = {
      charges,
      discount,
      taxes,
      paymentMethods,
      additionalNotes,
      status,
      lastUpdated: new Date().toISOString(),
    };
    
    sessionStorage.setItem(storageKey, JSON.stringify(data));
  }, [storageKey, charges, discount, taxes, paymentMethods, additionalNotes, status, isDirty]);

  // ============================================================================
  // ACTIONS
  // ============================================================================
  
  const openTray = useCallback((targetStep?: BillingStep) => {
    if (targetStep) setStep(targetStep);
    setTrayOpen(true);
  }, []);

  const closeTray = useCallback(() => {
    setTrayOpen(false);
  }, []);

  const addCharge = useCallback((service: ServiceItem, quantity: number = 1) => {
    setCharges(prev => {
      const existing = prev.find(item => item.service.id === service.id);
      
      if (existing) {
        return prev.map(item =>
          item.service.id === service.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalAmount: (item.quantity + quantity) * service.unitPrice,
              }
            : item
        );
      }
      
      return [
        ...prev,
        {
          service,
          quantity,
          totalAmount: quantity * service.unitPrice,
        },
      ];
    });
    
    if (status !== 'draft') setStatus('draft');
  }, [status]);

  const increaseQty = useCallback((serviceId: number) => {
    setCharges(prev =>
      prev.map(item => {
        if (item.service.id === serviceId) {
          const newQty = item.quantity + 1;
          return {
            ...item,
            quantity: newQty,
            totalAmount: newQty * item.service.unitPrice,
          };
        }
        return item;
      })
    );
  }, []);

  const decreaseQty = useCallback((serviceId: number) => {
    setCharges(prev =>
      prev.map(item => {
        if (item.service.id === serviceId) {
          const newQty = Math.max(1, item.quantity - 1);
          return {
            ...item,
            quantity: newQty,
            totalAmount: newQty * item.service.unitPrice,
          };
        }
        return item;
      })
    );
  }, []);

  const removeLine = useCallback((serviceId: number) => {
    setCharges(prev => prev.filter(item => item.service.id !== serviceId));
  }, []);

  const clearCharges = useCallback(() => {
    setCharges([]);
  }, []);

  const updateDiscount = useCallback((newDiscount: Discount) => {
    setDiscount(newDiscount);
  }, []);

  const updatePaymentMethods = useCallback((methods: PaymentMethod[]) => {
    setPaymentMethods(methods);
  }, []);

  const updateNotes = useCallback((notes: string) => {
    setAdditionalNotes(notes);
  }, []);

  const settle = useCallback(() => {
    setStatus('settled');
    if (storageKey) {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const resetBilling = useCallback(() => {
    setCharges([]);
    setDiscount(defaultDiscount);
    setTaxes(defaultTaxes);
    setPaymentMethods([{ type: 'cash', amount: 0, details: '' }]);
    setAdditionalNotes('');
    setStatus('draft');
    setStep('charge_entry');
    if (storageKey) {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey, defaultDiscount, defaultTaxes]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  
  const value: BillingContextState = {
    charges,
    discount,
    taxes,
    paymentMethods,
    additionalNotes,
    status,
    step,
    trayOpen,
    visitId,
    subtotal,
    grandTotal,
    balance,
    isDirty,
    openTray,
    closeTray,
    setStep,
    addCharge,
    increaseQty,
    decreaseQty,
    removeLine,
    clearCharges,
    updateDiscount,
    updatePaymentMethods,
    updateNotes,
    settle,
    resetBilling,
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useBilling = (): BillingContextState => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within BillingProvider');
  }
  return context;
};
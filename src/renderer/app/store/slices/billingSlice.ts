import { createSlice, createEntityAdapter, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Invoice,
  InsuranceClaim,
  Payment,
  BillingSummary,
} from '../../../shared/features/types/billing';

export interface BillingState {
  invoices: Invoice[];
  claims: InsuranceClaim[];
  pendingClaims: InsuranceClaim[];
  selectedInvoice: Invoice | null;
  selectedClaim: InsuranceClaim | null;
  billingSummary: BillingSummary | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string[];
    dateRange?: { start: string; end: string };
    patientId?: string;
  };
}

const billingAdapter = createEntityAdapter<Invoice>({
  sortComparer: (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
});

const initialState = billingAdapter.getInitialState<BillingState>({
  invoices: [],
  claims: [],
  pendingClaims: [],
  selectedInvoice: null,
  selectedClaim: null,
  billingSummary: null,
  isLoading: false,
  error: null,
  filters: {},
});

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    // Invoice management
    setInvoices: (state, action: PayloadAction<Invoice[]>) => {
      billingAdapter.setAll(state, action.payload);
      state.invoices = action.payload;
    },
    
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      billingAdapter.addOne(state, action.payload);
      state.invoices.push(action.payload);
    },
    
    updateInvoice: (state, action: PayloadAction<Invoice>) => {
      billingAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });
      const index = state.invoices.findIndex(inv => inv.id === action.payload.id);
      if (index !== -1) {
        state.invoices[index] = action.payload;
      }
    },
    
    // Claim management
    setClaims: (state, action: PayloadAction<InsuranceClaim[]>) => {
      state.claims = action.payload;
      state.pendingClaims = action.payload.filter(claim => 
        claim.status === 'PENDING' || claim.status === 'SUBMITTED'
      );
    },
    
    addClaim: (state, action: PayloadAction<InsuranceClaim>) => {
      state.claims.push(action.payload);
      if (action.payload.status === 'PENDING' || action.payload.status === 'SUBMITTED') {
        state.pendingClaims.push(action.payload);
      }
    },
    
    updateClaim: (state, action: PayloadAction<InsuranceClaim>) => {
      const index = state.claims.findIndex(claim => claim.id === action.payload.id);
      if (index !== -1) {
        state.claims[index] = action.payload;
      }
      
      // Update pending claims
      const pendingIndex = state.pendingClaims.findIndex(claim => claim.id === action.payload.id);
      if (pendingIndex !== -1) {
        if (action.payload.status === 'PAID' || action.payload.status === 'DENIED') {
          state.pendingClaims.splice(pendingIndex, 1);
        } else {
          state.pendingClaims[pendingIndex] = action.payload;
        }
      } else if (action.payload.status === 'PENDING' || action.payload.status === 'SUBMITTED') {
        state.pendingClaims.push(action.payload);
      }
    },
    
    // Payment management
    addPayment: (state, action: PayloadAction<{ invoiceId: string; payment: Payment }>) => {
      const invoice = state.entities[action.payload.invoiceId];
      if (invoice) {
        invoice.payments.push(action.payload.payment);
        invoice.balanceDue -= action.payload.payment.amount;
        
        if (invoice.balanceDue <= 0) {
          invoice.status = 'PAID';
        } else if (invoice.balanceDue < invoice.total) {
          invoice.status = 'PARTIAL';
        }
      }
    },
    
    // Selection
    selectInvoice: (state, action: PayloadAction<Invoice | null>) => {
      state.selectedInvoice = action.payload;
    },
    
    selectClaim: (state, action: PayloadAction<InsuranceClaim | null>) => {
      state.selectedClaim = action.payload;
    },
    
    // Billing summary
    setBillingSummary: (state, action: PayloadAction<BillingSummary>) => {
      state.billingSummary = action.payload;
    },
    
    // Filters
    setBillingFilters: (state, action: PayloadAction<Partial<BillingState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearBillingFilters: (state) => {
      state.filters = {};
    },
    
    // Loading states
    setBillingLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setBillingError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Reset
    resetBillingState: () => initialState,
  },
});

export const {
  selectAll: selectAllInvoices,
  selectById: selectInvoiceById,
  selectIds: selectInvoiceIds,
  selectTotal: selectTotalInvoices,
} = billingAdapter.getSelectors((state: { billing: ReturnType<typeof billingSlice.reducer> }) => state.billing);

export const {
  setInvoices,
  addInvoice,
  updateInvoice,
  setClaims,
  addClaim,
  updateClaim,
  addPayment,
  selectInvoice,
  selectClaim,
  setBillingSummary,
  setBillingFilters,
  clearBillingFilters,
  setBillingLoading,
  setBillingError,
  resetBillingState,
} = billingSlice.actions;

export default billingSlice.reducer;
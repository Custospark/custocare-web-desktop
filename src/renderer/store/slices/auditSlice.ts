import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import {
  AuditTrail,
  AuditEntityType,
  AuditAction,
} from '../../features//types/shared';

export interface AuditState {
  trail: AuditTrail[];
  isLoading: boolean;
  error: string | null;
  filters: {
    entityType?: AuditEntityType;
    entityId?: string;
    userId?: string;
    action?: AuditAction;
    dateRange?: { start: string; end: string };
  };
  exportInProgress: boolean;
}

const auditAdapter = createEntityAdapter<AuditTrail>({
  sortComparer: (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
});

const initialState = auditAdapter.getInitialState<AuditState>({
  trail: [],
  isLoading: false,
  error: null,
  filters: {},
  exportInProgress: false,
});

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    // Audit trail management
    setAuditTrail: (state, action: PayloadAction<AuditTrail[]>) => {
      auditAdapter.setAll(state, action.payload);
      state.trail = action.payload;
    },
    
    addAuditEntry: (state, action: PayloadAction<AuditTrail>) => {
      auditAdapter.addOne(state, action.payload);
      state.trail.unshift(action.payload); // Add to beginning for chronological order
    },
    
    logAuditTrail: (
      state,
      action: PayloadAction<{
        entityId: string;
        entityType: AuditEntityType;
        action: AuditAction;
        userId: string;
        userName: string;
        previousState?: unknown;
        newState?: unknown;
        changes?: Record<string, { old: unknown; new: unknown }>;
        notes?: string;
      }>
    ) => {
      const auditEntry: AuditTrail = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entityId: action.payload.entityId,
        entityType: action.payload.entityType,
        action: action.payload.action,
        userId: action.payload.userId,
        userName: action.payload.userName,
        previousState: action.payload.previousState,
        newState: action.payload.newState,
        changes: action.payload.changes,
        notes: action.payload.notes,
        timestamp: new Date().toISOString(),
      };
      
      auditAdapter.addOne(state, auditEntry);
      state.trail.unshift(auditEntry);
    },
    
    // // Entity-specific audit
    // getEntityAudit: (
    //   state,
    //   action: PayloadAction<{
        
    //     entityType: AuditEntityType;
    //     entityId: string;
    //   }>
    // ) => {
    //   // This would typically filter in a selector
    //   return state;
    // },
    
    // Filters
    setAuditFilters: (state, action: PayloadAction<Partial<AuditState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearAuditFilters: (state) => {
      state.filters = {};
    },
    
    // Export
    startExport: (state) => {
      state.exportInProgress = true;
    },
    
    completeExport: (state) => {
      state.exportInProgress = false;
    },
    
    // Loading states
    setAuditLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setAuditError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Reset
    resetAuditState: () => initialState,
  },
});

export const {
  selectAll: selectAllAuditEntries,
  selectById: selectAuditEntryById,
  selectIds: selectAuditEntryIds,
  selectTotal: selectTotalAuditEntries,
} = auditAdapter.getSelectors((state: { audit: ReturnType<typeof auditSlice.reducer> }) => state.audit);

export const {
  setAuditTrail,
  addAuditEntry,
  logAuditTrail,
//   getEntityAudit,
  setAuditFilters,
  clearAuditFilters,
  startExport,
  completeExport,
  setAuditLoading,
  setAuditError,
  resetAuditState,
} = auditSlice.actions;

export default auditSlice.reducer;
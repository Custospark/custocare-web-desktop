import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { 
  Visit, 
  VisitStatus, 
  PriorityLevel,
  VisitFilterParams,
  DispositionType
} from '../../features/types/visit';
import { PatientStatus } from '../../features/types/patient';

export interface VisitState {
  currentVisit: Visit | null;
  patientVisits: Visit[];
  filterParams: VisitFilterParams;
  queueItems: Visit[];
  isLoading: boolean;
  error: string | null;
  transitionsInProgress: Record<string, boolean>;
}

// Create entity adapter for normalized visit storage
const visitsAdapter = createEntityAdapter<Visit>({
  sortComparer: (a, b) => 
    new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime(),
});

const initialState = visitsAdapter.getInitialState<VisitState>({
  currentVisit: null,
  patientVisits: [],
  filterParams: {
    page: 1,
    limit: 50,
  },
  queueItems: [],
  isLoading: false,
  error: null,
  transitionsInProgress: {},
});

const visitSlice = createSlice({
  name: 'visits',
  initialState,
  reducers: {
    // Visit CRUD operations
    setVisits: (state, action: PayloadAction<Visit[]>) => {
      visitsAdapter.setAll(state, action.payload);
    },
    
    addVisit: (state, action: PayloadAction<Visit>) => {
      visitsAdapter.addOne(state, action.payload);
      if (state.currentVisit?.id === action.payload.id) {
        state.currentVisit = action.payload;
      }
    },
    
    updateVisit: (state, action: PayloadAction<Visit>) => {
      visitsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });
      if (state.currentVisit?.id === action.payload.id) {
        state.currentVisit = action.payload;
      }
    },
    
    removeVisit: (state, action: PayloadAction<string>) => {
      visitsAdapter.removeOne(state, action.payload);
      if (state.currentVisit?.id === action.payload) {
        state.currentVisit = null;
      }
    },
    
    // Visit selection and current visit management
    setCurrentVisit: (state, action: PayloadAction<Visit | null>) => {
      state.currentVisit = action.payload;
    },
    
    clearCurrentVisit: (state) => {
      state.currentVisit = null;
    },
    
    // Patient-visit relationship
    setPatientVisits: (state, action: PayloadAction<Visit[]>) => {
      state.patientVisits = action.payload;
      visitsAdapter.upsertMany(state, action.payload);
    },
    
    clearPatientVisits: (state) => {
      state.patientVisits = [];
    },
    
    // State transitions (core workflow)
    transitionVisitStatus: (
      state, 
      action: PayloadAction<{
        visitId: string;
        newStatus: VisitStatus;
        notes?: string;
        userId: string;
      }>
    ) => {
      const { visitId, newStatus, userId } = action.payload;
      const visit = state.entities[visitId];
      
      if (visit) {
        const updatedVisit = {
          ...visit,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
          auditTrail: [
            ...visit.auditTrail,
            `Status changed to ${newStatus} by ${userId} at ${new Date().toISOString()}`,
          ],
        };
        
        visitsAdapter.updateOne(state, {
          id: visitId,
          changes: updatedVisit,
        });
        
        if (state.currentVisit?.id === visitId) {
          state.currentVisit = updatedVisit;
        }
        
        // Set transition in progress flag
        state.transitionsInProgress[visitId] = false;
      }
    },
    
    startTransition: (state, action: PayloadAction<string>) => {
      state.transitionsInProgress[action.payload] = true;
    },
    
    endTransition: (state, action: PayloadAction<string>) => {
      state.transitionsInProgress[action.payload] = false;
    },
    
    // Queue management
    setQueueItems: (state, action: PayloadAction<Visit[]>) => {
      state.queueItems = action.payload;
      visitsAdapter.upsertMany(state, action.payload);
    },
    
    updateQueueItem: (state, action: PayloadAction<Visit>) => {
      visitsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });
      
      // Update in queue items array
      const index = state.queueItems.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.queueItems[index] = action.payload;
      }
    },
    
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queueItems = state.queueItems.filter(item => item.id !== action.payload);
    },
    
    // Priority updates
    updateVisitPriority: (
      state, 
      action: PayloadAction<{
        visitId: string;
        priority: PriorityLevel;
        userId: string;
      }>
    ) => {
      const { visitId, priority, userId } = action.payload;
      const visit = state.entities[visitId];
      
      if (visit) {
        const updatedVisit = {
          ...visit,
          priority,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
          auditTrail: [
            ...visit.auditTrail,
            `Priority changed to ${priority} by ${userId} at ${new Date().toISOString()}`,
          ],
        };
        
        visitsAdapter.updateOne(state, {
          id: visitId,
          changes: updatedVisit,
        });
        
        if (state.currentVisit?.id === visitId) {
          state.currentVisit = updatedVisit;
        }
        
        // Update in queue
        const queueIndex = state.queueItems.findIndex(item => item.id === visitId);
        if (queueIndex !== -1) {
          state.queueItems[queueIndex] = updatedVisit;
        }
      }
    },
    
    // Assignment management
    assignVisit: (
      state, 
      action: PayloadAction<{
        visitId: string;
        assignedTo: string;
        role: 'NURSE' | 'PHYSICIAN';
        userId: string;
      }>
    ) => {
      const { visitId, assignedTo, role, userId } = action.payload;
      const visit = state.entities[visitId];
      
      if (visit) {
        const changes: Partial<Visit> = {
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
          auditTrail: [
            ...visit.auditTrail,
            `Assigned to ${assignedTo} (${role}) by ${userId} at ${new Date().toISOString()}`,
          ],
        };
        
        if (role === 'NURSE') {
          changes.assignedNurseId = assignedTo;
        } else if (role === 'PHYSICIAN') {
          changes.assignedPhysicianId = assignedTo;
        }
        
        visitsAdapter.updateOne(state, {
          id: visitId,
          changes,
        });
      }
    },
    
    // Filter management
    setFilterParams: (state, action: PayloadAction<Partial<VisitFilterParams>>) => {
      state.filterParams = { ...state.filterParams, ...action.payload };
    },
    
    resetFilterParams: (state) => {
      state.filterParams = initialState.filterParams;
    },
    
    // Emergency visit creation
    addEmergencyVisit: (state, action: PayloadAction<Visit>) => {
      const visit = {
        ...action.payload,
        isEmergency: true,
        status: VisitStatus.EMERGENCY,
      };
      
      visitsAdapter.addOne(state, visit);
      state.currentVisit = visit;
      
      // Add to queue if appropriate status
      if ([
        VisitStatus.REGISTERED,
        VisitStatus.TRIAGED,
        VisitStatus.EMERGENCY
      ].includes(visit.status)) {
        state.queueItems.unshift(visit);
      }
    },
    
    // Dual-entity state synchronization
    syncVisitCompletion: (
      state, 
      action: PayloadAction<{
        visitId: string;
        outcome: {
          patientStatus?: PatientStatus;
          followUpRequired: boolean;
          dischargeInstructions?: string;
        };
      }>
    ) => {
      const { visitId, outcome } = action.payload;
      const visit = state.entities[visitId];
      
      if (visit) {
        const updatedVisit = {
          ...visit,
          status: VisitStatus.DISCHARGED,
          disposition: {
            type: 'DISCHARGE' as DispositionType,
            instructions: outcome.dischargeInstructions,
            followUpDate: outcome.followUpRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          },
          dischargeTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          auditTrail: [
            ...visit.auditTrail,
            `Visit completed with outcome: ${JSON.stringify(outcome)} at ${new Date().toISOString()}`,
          ],
        };
        
        visitsAdapter.updateOne(state, {
          id: visitId,
          changes: updatedVisit,
        });
        
        // Remove from queue
        state.queueItems = state.queueItems.filter(item => item.id !== visitId);
        
        // Note: Patient status update will be handled in patientSlice
      }
    },
    
    // Loading states
    setVisitsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setVisitsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Reset state
    resetVisitState: () => initialState,
  },
});

// Export the entity adapter selectors
export const {
  selectAll: selectAllVisits,
  selectById: selectVisitById,
  selectIds: selectVisitIds,
  selectTotal: selectTotalVisits,
} = visitsAdapter.getSelectors((state: { visits: ReturnType<typeof visitSlice.reducer> }) => state.visits);

// Export actions
export const {
  setVisits,
  addVisit,
  updateVisit,
  removeVisit,
  setCurrentVisit,
  clearCurrentVisit,
  setPatientVisits,
  clearPatientVisits,
  transitionVisitStatus,
  startTransition,
  endTransition,
  setQueueItems,
  updateQueueItem,
  removeFromQueue,
  updateVisitPriority,
  assignVisit,
  setFilterParams,
  resetFilterParams,
  addEmergencyVisit,
  syncVisitCompletion,
  setVisitsLoading,
  setVisitsError,
  resetVisitState,
} = visitSlice.actions;

// Export reducer
export default visitSlice.reducer;
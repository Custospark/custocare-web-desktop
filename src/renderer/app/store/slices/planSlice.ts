import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PaymentQuoteIntent } from '../../../modules/administration/admin-module/api/subscriptions/SubscriptionTypes';

const PLAN_SELECTION_STORAGE_KEY = 'custocare_plan_selection_v1';

export interface PlanSelection {
  planId: number;
  planName: string;
  planPrice: number;
  onboardingFee: number;
  quoteIntent?: PaymentQuoteIntent;
  targetPlanId?: number;
}

interface PlanState {
  selected: PlanSelection | null;
}

type PersistedPlanSelections = Record<string, PlanSelection>;

const loadPlanSelection = (facilityId: number): PlanSelection | null => {
  try {
    const raw = localStorage.getItem(PLAN_SELECTION_STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as PersistedPlanSelections;
    return all[String(facilityId)] ?? null;
  } catch {
    return null;
  }
};

const savePlanSelection = (facilityId: number, selection: PlanSelection | null): void => {
  try {
    const raw = localStorage.getItem(PLAN_SELECTION_STORAGE_KEY);
    const all: PersistedPlanSelections = raw ? JSON.parse(raw) : {};
    if (selection) {
      all[String(facilityId)] = selection;
    } else {
      delete all[String(facilityId)];
    }
    localStorage.setItem(PLAN_SELECTION_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / private mode
  }
};

const initialState: PlanState = {
  selected: null,
};

interface SelectPlanPayload extends PlanSelection {
  facilityId: number;
}

const planSlice = createSlice({
  name: 'plan',
  initialState,
  reducers: {
    hydratePlanForFacility(state, action: PayloadAction<number>) {
      state.selected = loadPlanSelection(action.payload);
    },
    selectPlan(state, action: PayloadAction<SelectPlanPayload>) {
      const { facilityId, ...selection } = action.payload;
      state.selected = selection;
      savePlanSelection(facilityId, selection);
    },
    clearPlan(state, action: PayloadAction<number | undefined>) {
      state.selected = null;
      if (action.payload != null) {
        savePlanSelection(action.payload, null);
      }
    },
  },
});

export const { hydratePlanForFacility, selectPlan, clearPlan } = planSlice.actions;
export default planSlice.reducer;

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PlanSelection {
  planId: number | null;
  planName: string;
  planPrice: number;
  onboardingFee: number;
}

interface PlanState {
  selected: PlanSelection | null;
}

const initialState: PlanState = {
  selected: null,
};

const planSlice = createSlice({
  name: 'plan',
  initialState,
  reducers: {
    selectPlan(state, action: PayloadAction<PlanSelection>) {
      state.selected = action.payload;
    },
    clearPlan(state) {
      state.selected = null;
    },
  },
});

export const { selectPlan, clearPlan } = planSlice.actions;
export default planSlice.reducer;

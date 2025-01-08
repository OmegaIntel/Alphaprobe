import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CompanyInsightState {
  data: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: CompanyInsightState = {
  data: null,
  loading: false,
  error: null,
};

const companyInsightSlice = createSlice({
  name: "companyInsight",
  initialState,
  reducers: {
    fetchCompanyInsightStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchCompanyInsightSuccess(state, action: PayloadAction<any>) {
      state.loading = false;
      state.data = action.payload;
    },
    clearCompanyInsight(state) {
      state.data = null;
    },
    fetchCompanyInsightFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchCompanyInsightStart,
  fetchCompanyInsightSuccess,
  fetchCompanyInsightFailure,
  clearCompanyInsight,
} = companyInsightSlice.actions;

export default companyInsightSlice.reducer;

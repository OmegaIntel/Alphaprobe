import { createSlice } from '@reduxjs/toolkit';

const companyInsightSlice = createSlice({
  name: 'companyInsight',
  initialState: {
    data: null,
    loading: false,
    error: null
  },
  reducers: {
    fetchCompanyInsightStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchCompanyInsightSuccess(state, action) {
      state.loading = false;
      state.data = action.payload;
    },
    clearCompanyInsight: (state) => {
      state.data = null; 
    },
    fetchCompanyInsightFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

export const { fetchCompanyInsightStart, fetchCompanyInsightSuccess, fetchCompanyInsightFailure ,clearCompanyInsight} = companyInsightSlice.actions;
export default companyInsightSlice.reducer;
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PaymentState {
  paymentCompleted: boolean;
}

const initialState: PaymentState = {
  paymentCompleted: false,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setPaymentCompleted: (state, action: PayloadAction<boolean>) => {
      state.paymentCompleted = action.payload;
    },
  },
});

export const { setPaymentCompleted } = paymentSlice.actions;
export default paymentSlice.reducer;

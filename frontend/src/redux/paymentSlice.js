// src/redux/paymentSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    paymentCompleted: false,
};

const paymentSlice = createSlice({
    name: 'payment',
    initialState,
    reducers: {
        setPaymentCompleted: (state, action) => {
            state.paymentCompleted = action.payload;
        },
    },
});

export const { setPaymentCompleted } = paymentSlice.actions;
export default paymentSlice.reducer;

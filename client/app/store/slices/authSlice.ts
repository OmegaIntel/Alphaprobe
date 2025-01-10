// src/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: any;
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    auth0Login: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    auth0Logout: (state) => {
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
    },
  },
});

export const { auth0Login, auth0Logout } = authSlice.actions;
export default authSlice.reducer;

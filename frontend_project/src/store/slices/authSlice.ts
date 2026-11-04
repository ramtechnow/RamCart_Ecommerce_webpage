import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  uid: string;
  email: string | null;
  name: string | null;
  role: "admin" | "customer" | "vendor";
  vendorName?: string;
  emailVerified: boolean;
}

interface AuthState {
  user: UserState | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState | null>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    }
  }
});

export const { setUser, setAuthLoading, setAuthError, clearAuth } = authSlice.actions;
export default authSlice.reducer;

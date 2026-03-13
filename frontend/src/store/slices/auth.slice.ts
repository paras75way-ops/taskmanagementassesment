import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface IUser {
  id: string;
  email: string;
}

interface IAuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  accessToken: string | null;
}

const initialState: IAuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: localStorage.getItem("accessToken"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<string>) {
      state.isAuthenticated = true;
      state.accessToken = action.payload;
    },

    setUser(state, action: PayloadAction<IUser>) {
      state.user = action.payload;
    },

    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },

    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const { loginSuccess, logout, setAccessToken, setUser } = authSlice.actions;
export default authSlice.reducer;
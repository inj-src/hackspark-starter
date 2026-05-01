import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  token: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.currentUser = action.payload.user;
      state.isAuthenticated = true;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.token = null;
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;

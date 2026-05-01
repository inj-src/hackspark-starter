import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  isDark: boolean;
}

const savedTheme = localStorage.getItem('rentpi-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

const initialState: ThemeState = {
  isDark: savedTheme ? savedTheme === 'dark' : prefersDark,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDark = !state.isDark;
      localStorage.setItem('rentpi-theme', state.isDark ? 'dark' : 'light');
    },
    setTheme: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload;
      localStorage.setItem('rentpi-theme', action.payload ? 'dark' : 'light');
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;

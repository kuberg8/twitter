import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuth: !!localStorage.getItem('token'),
  userId: localStorage.getItem('userId') || null,
  token: localStorage.getItem('token') || null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login(state, action) {
      state.isAuth = true;
      state.userId = action.payload.userId;
      state.token = action.payload.token;
      localStorage.setItem('userId', action.payload.userId);
      localStorage.setItem('token', action.payload.token);
    },
    logout(state) {
      state.isAuth = false;
      state.userId = null;
      state.token = null;
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
    },
  },
});

export const { login, logout } = userSlice.actions;

export default userSlice.reducer;

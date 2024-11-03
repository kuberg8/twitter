import { configureStore } from '@reduxjs/toolkit';
import userSlice from './userSlice';
import alertSlice from './alertSlice';

const store = configureStore({
  reducer: {
    user: userSlice,
    alert: alertSlice,
  },
});

export default store;

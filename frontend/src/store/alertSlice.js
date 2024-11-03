import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  text: '',
  show: false,
  type: 'success',
};

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    showAlert(state, action) {
      state.text = action.payload.text;
      state.type = action.payload.type;
      state.show = true;
    },
    hideAlert(state) {
      state.show = false;
    },
  },
});

export const { showAlert, hideAlert } = alertSlice.actions;

export default alertSlice.reducer;

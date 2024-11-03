import React, { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert, hideAlert } from '../store/alertSlice';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const dispatch = useDispatch();
  const alert = useSelector((state) => state.alert);

  const triggerAlert = (text, type = 'success') => {
    dispatch(showAlert({ text, type }));
    setTimeout(() => dispatch(hideAlert()), 5000);
  };

  return (
    <AlertContext.Provider value={{ alert, triggerAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  return useContext(AlertContext);
};

import React, { createContext, useReducer, useContext } from 'react';
import alertReducer, { showAlert, hideAlert } from '../reducers/alertReducer';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const initialState = {
    alertText: '',
    alertShow: false,
    alertType: 'success',
  };

  const [state, dispatch] = useReducer(alertReducer, initialState);

  const triggerAlert = (text, type = 'success') => {
    dispatch(showAlert(text, type));
    setTimeout(() => dispatch(hideAlert()), 5000);
  };

  return (
    <AlertContext.Provider value={{ alert: state, triggerAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  return useContext(AlertContext);
};

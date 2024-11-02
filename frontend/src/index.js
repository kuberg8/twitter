import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { AlertProvider } from './context/AlertContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter basename={process.env.PUBLIC_URL}>
    <AlertProvider>
      <App />
    </AlertProvider>
  </BrowserRouter>
);

reportWebVitals();

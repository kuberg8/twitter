import React from 'react';
import Alert from '@mui/material/Alert';

const AlertComponent = ({ text, type, show }) =>
  show ? (
    <Alert
      severity={type}
      style={{
        position: 'fixed',
        alignItems: 'center',
        right: '10px',
        top: '10px',
        zIndex: '100',
        maxWidth: 'calc(100vw - 20px)',
        transition: '0.4s',
        opacity: show ? '1' : '0',
      }}
    >
      {text}
    </Alert>
  ) : null;

export default AlertComponent;

import React from 'react';
import { Navigate } from 'react-router-dom';

export function withAuthRedirect(InputComponent) {
  if (!InputComponent.props.isAuth) {
    return <Navigate to="/sing-in" replace={true} />;
  }

  return InputComponent;
}

import React from 'react';
import { Navigate } from 'react-router-dom';

export function withAuthRedirect(InputComponent) {
  const isAuth = InputComponent.props?.isAuth;

  if (!isAuth) {
    return <Navigate to="/sign-in" replace={true} />;
  }

  return InputComponent;
}

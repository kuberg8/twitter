import React from 'react';
import { Navigate } from 'react-router-dom';

export function withAuthRedirect(InputComponent) {
  const isAuth = InputComponent.props?.isAuth;
  const currentPath = window.location.pathname;
  const isAuthPage = currentPath === '/sign-in' || currentPath === '/sign-up';

  if (!isAuth && !isAuthPage) {
    return <Navigate to="/sign-in" replace={true} />;
  } else if (isAuth && isAuthPage) {
    return <Navigate to="/" replace={true} />;
  }

  return InputComponent;
}

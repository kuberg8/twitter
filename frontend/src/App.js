import React, { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { withAuthRedirect } from './hoc/withAuthRedirect';
import { useSelector } from 'react-redux';
import { useAlert } from './context/AlertContext';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Posts from './pages/Posts';
import NotFound from './pages/NotFound';
import Alert from './components/alert/alert';

function App() {
  const { alert, triggerAlert } = useAlert();
  const { isAuth, userId, token } = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnhandledRejection = ({ reason }) => {
      const { errors } = reason?.response?.data || {};

      const error =
        (errors?.length && errors[0].msg) ||
        reason?.response?.data?.message ||
        reason.message;

      triggerAlert(error, 'error');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, [navigate, triggerAlert]);

  return (
    <>
      <Alert show={alert.show} text={alert.text} type={alert.type} />
      <Routes>
        <Route
          exact
          path="/"
          element={withAuthRedirect(
            <Posts isAuth={isAuth} userId={userId} token={token} />
          )}
        />
        <Route
          path="/sign-in"
          element={withAuthRedirect(<SignIn isAuth={isAuth} />)}
        />
        <Route
          path="/sign-up"
          element={withAuthRedirect(
            <SignUp setAlert={triggerAlert} isAuth={isAuth} />
          )}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;

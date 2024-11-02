import React, { useReducer, useEffect } from 'react';
import rootReducer from './reducers/rootReducer';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { withAuthRedirect } from './hoc/withAuthRedirect';
import { useAlert } from './context/AlertContext';
// Pages
import SingIn from './pages/SingIn';
import SingUp from './pages/SingUp';
import Posts from './pages/Posts';
import NotFound from './pages/NotFound';

import Alert from './components/alert/alert';

function App() {
  const [state, dispatch] = useReducer(rootReducer, { user: {} });
  const { alert, triggerAlert } = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnhandledRejection = ({ reason }) => {
      const { errors } = reason?.response?.data || {};

      const error =
        (errors?.length && errors[0].msg) ||
        reason?.response?.data?.message ||
        reason.message;

      triggerAlert(error, 'error');

      if (reason?.response?.status === 403) {
        dispatch({ type: 'LOGOUT' });
        localStorage.clear();
        navigate('/sing-in');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, [triggerAlert, navigate]);

  const setUserData = (userId, token) => {
    dispatch({
      type: 'LOGIN',
      payload: { userId },
    });

    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
  };

  return (
    <>
      <Routes>
        <Route
          exact
          path="/"
          element={withAuthRedirect(
            <Posts isAuth={state.user.isAuth} userId={state.user.userId} />
          )}
        />
        <Route path="/sing-in" element={<SingIn setUserData={setUserData} />} />
        <Route path="/sing-up" element={<SingUp setAlert={triggerAlert} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Alert
        show={alert.alertShow}
        type={alert.alertType}
        text={alert.alertText}
      />
    </>
  );
}

export default App;

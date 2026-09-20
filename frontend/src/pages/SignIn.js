import AuthLayout from '../components/AuthLayout';
import * as React from 'react';

import { LoadingButton } from '@mui/lab';

import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import Grid from '@mui/material/Grid';

// FORM
import { Form } from 'react-final-form';
import { FORM_ERROR } from 'final-form';
import { validation } from '../utils/validation';
import Input from '../components/input/Input';

import { login } from '../api/auth';
import { useDispatch } from 'react-redux';
import { login as loginAction } from '../store/userSlice';
import { useNavigate } from 'react-router-dom';

const SignInFormRender = ({ submitError, handleSubmit, submitting }) => (
  <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '10px' }}>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Input
          name="email"
          label="Электронная почта"
          type="email"
          autoComplete="username"
        />
      </Grid>
      <Grid item xs={12}>
        <Input
          name="password"
          label="Пароль"
          type="password"
          autoComplete="current-password"
        />
      </Grid>
    </Grid>

    <LoadingButton
      type="submit"
      fullWidth
      variant="contained"
      sx={{ mt: 3, mb: 2 }}
      loading={submitting}
    >
      Войти
    </LoadingButton>

    {submitError && (
      <div role="alert" style={{ color: '#d32f2f', textAlign: 'right' }}>
        {submitError}
      </div>
    )}

    <Grid container>
      <Grid item xs />
      <Grid item>
        <Link component={RouterLink} to="/sign-up">
          Нет аккаунта? Зарегистрироваться
        </Link>
      </Grid>
    </Grid>
  </form>
);

function SignIn() {
  const dispatch = useDispatch();
  const history = useNavigate();

  const onSubmit = async ({ email, password }) => {
    try {
      const { data } = await login(email, password);

      dispatch(loginAction({ userId: data.user_id, token: data.token }));
      history(`/${window.location.search}`);
    } catch (error) {
      return {
        [FORM_ERROR]:
          error.response?.data?.message ||
          'Не удалось связаться с сервером. Попробуйте ещё раз.',
      };
    }
  };

  return (
    <AuthLayout
      title="С возвращением"
      subtitle="Войдите, чтобы продолжить разговор."
    >
      <Form
        onSubmit={onSubmit}
        render={SignInFormRender}
        validate={(values) => validation(values, ['email', 'password'])}
      />
    </AuthLayout>
  );
}
export default SignIn;

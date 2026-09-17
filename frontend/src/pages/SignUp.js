import AuthLayout from '../components/AuthLayout';
import * as React from 'react';

import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import Grid from '@mui/material/Grid';

import { LoadingButton } from '@mui/lab';

import { Form } from 'react-final-form';
import { FORM_ERROR } from 'final-form';
import Input from '../components/input/Input';
import { validation } from '../utils/validation';

import { registration } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const SignUpFormRender = ({ submitError, handleSubmit, submitting }) => (
  <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '10px' }}>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Input name="first_name" label="Имя" autoComplete="given-name" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Input name="last_name" label="Фамилия" autoComplete="family-name" />
      </Grid>
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
          autoComplete="new-password"
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
      Создать аккаунт
    </LoadingButton>

    {submitError && (
      <div role="alert" style={{ color: '#d32f2f', textAlign: 'right' }}>
        {submitError}
      </div>
    )}
    <Grid container justifyContent="flex-end">
      <Grid item>
        <Link component={RouterLink} to="/sign-in">
          Уже есть аккаунт? Войти
        </Link>
      </Grid>
    </Grid>
  </form>
);

export default function SignUp(props) {
  const history = useNavigate();

  const onSubmit = async (values) => {
    const { email, password, first_name, last_name } = values;

    try {
      const { data } = await registration(
        email,
        password,
        first_name,
        last_name
      );

      props.setAlert(data.message);
      history('/sign-in');
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
      title="Присоединяйтесь"
      subtitle="Создайте аккаунт и начните общение."
    >
      <Form
        onSubmit={onSubmit}
        render={SignUpFormRender}
        validate={(values) =>
          validation(values, ['first_name', 'last_name', 'email', 'password'])
        }
      />
    </AuthLayout>
  );
}

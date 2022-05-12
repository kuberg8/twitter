import * as React from "react";
import Avatar from "@mui/material/Avatar";
import CssBaseline from "@mui/material/CssBaseline";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { LoadingButton } from "@mui/lab";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { Form } from "react-final-form";
import { FORM_ERROR } from "final-form";
import Input from "../components/input/Input";
import { validation } from "../utils/validation";

import { registration } from "../api/auth";
import { useNavigate } from "react-router-dom";

const theme = createTheme();

const SingUpFormRender = ({ submitError, handleSubmit, submitting }) => (
  <form onSubmit={handleSubmit} style={{ width: "100%", marginTop: "10px" }}>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Input name="first_name" label="First Name" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Input name="last_name" label="Last Name" />
      </Grid>
      <Grid item xs={12}>
        <Input name="email" label="Email" />
      </Grid>
      <Grid item xs={12}>
        <Input
          name="password"
          label="Password"
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
      Sign Up
    </LoadingButton>

    {submitError && (
      <div style={{ color: "#d32f2f", textAlign: "right" }}>{submitError}</div>
    )}
    <Grid container justifyContent="flex-end">
      <Grid item>
        <Link href="/sing-in" variant="body2">
          Already have an account? Sign in
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
      history("/sing-in");
    } catch ({ response }) {
      return { [FORM_ERROR]: response.data.message };
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>

          <Form
            onSubmit={onSubmit}
            render={SingUpFormRender}
            validate={(values) =>
              validation(values, ["first_name", "last_name", "email", "password"])
            }
          />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import { LoadingButton } from "@mui/lab";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";

// FORM
import { Form } from "react-final-form";
import { FORM_ERROR } from "final-form";
import { validation } from "../utils/validation";
import Input from "../components/input/Input";

import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";

const theme = createTheme();

const SingInFormRender = ({ submitError, handleSubmit, submitting }) => (
  <form onSubmit={handleSubmit} style={{ width: "100%", marginTop: "10px" }}>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Input name="email" label="Email" />
      </Grid>
      <Grid item xs={12}>
        <Input name="password" label="Password" type="password" />
      </Grid>
    </Grid>

    <LoadingButton
      type="submit"
      fullWidth
      variant="contained"
      sx={{ mt: 3, mb: 2 }}
      loading={submitting}
    >
      Sign In
    </LoadingButton>

    {submitError && (
      <div style={{ color: "#d32f2f", textAlign: "right" }}>{submitError}</div>
    )}

    <Grid container>
      <Grid item xs />
      <Grid item>
        <Link href="/sing-up" variant="body2">
          {"Don't have an account? Sign Up"}
        </Link>
      </Grid>
    </Grid>
  </form>
);

function SignIn({ auth }) {
  const history = useNavigate();

  const onSubmit = async ({ email, password }) => {
    try {
      const { data } = await login(email, password);
      
      auth(data.user_id, data.token);
      history("/");
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
            Sign in
          </Typography>

          <Form
            onSubmit={onSubmit}
            render={SingInFormRender}
            validate={(values) => validation(values, ["email", "password"])}
          />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default SignIn;

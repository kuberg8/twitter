import { createTheme } from '@mui/material/styles';
export function createAppTheme(mode) {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: dark ? '#ffffff' : '#0a7ea4',
        contrastText: dark ? '#151718' : '#ffffff',
      },
      background: {
        default: dark ? '#151718' : '#ffffff',
        paper: dark ? '#151718' : '#ffffff',
      },
      text: {
        primary: dark ? '#ecedee' : '#11181c',
        secondary: dark ? '#9ba1a6' : '#687076',
      },
      divider: dark ? '#343a3e' : '#e3e8eb',
    },
    typography: {
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { padding: '10px 16px' } },
      },
      MuiCssBaseline: {
        styleOverrides: { body: { WebkitFontSmoothing: 'antialiased' } },
      },
    },
  });
}

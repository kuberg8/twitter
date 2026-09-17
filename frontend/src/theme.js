import { createTheme } from '@mui/material/styles';
export function createAppTheme(mode) {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? '#a8c792' : '#526b48' },
      background: {
        default: dark ? '#101612' : '#f2f5ef',
        paper: dark ? '#1b241e' : '#ffffff',
      },
      text: {
        primary: dark ? '#e5ece4' : '#243128',
        secondary: dark ? '#a3b1a6' : '#758276',
      },
      divider: dark ? '#303c33' : '#e4eae1',
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

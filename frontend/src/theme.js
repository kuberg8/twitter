import { createTheme } from '@mui/material/styles';
export default createTheme({
  palette: {
    primary: { main: '#526846' },
    background: { default: '#f7f8f5' },
    text: { primary: '#242d25', secondary: '#778071' },
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
      styleOverrides: { root: { padding: '12px 20px' } },
    },
    MuiOutlinedInput: { styleOverrides: { root: { background: '#fff' } } },
  },
});

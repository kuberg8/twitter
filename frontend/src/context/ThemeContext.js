import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createAppTheme } from '../theme';
const KEY = 'twitter-theme';
const valid = (value) =>
  ['light', 'dark', 'system'].includes(value) ? value : 'system';
const readPreference = () => {
  try {
    return valid(localStorage.getItem(KEY));
  } catch {
    return 'system';
  }
};
const ThemeContext = createContext({
  preference: 'system',
  setPreference: () => {},
});
export const useThemePreference = () => useContext(ThemeContext);
export default function ThemeSettingsProvider({ children }) {
  const [preference, setValue] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches || false
  );
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    const changed = (event) => setSystemDark(event.matches);
    query?.addEventListener('change', changed);
    const stored = (event) => {
      if (event.key === KEY || event.key === null) setValue(readPreference());
    };
    window.addEventListener('storage', stored);
    return () => {
      query?.removeEventListener('change', changed);
      window.removeEventListener('storage', stored);
    };
  }, []);
  const setPreference = useCallback((value) => {
    const selected = valid(value);
    setValue(selected);
    try {
      localStorage.setItem(KEY, selected);
    } catch {
      /* The selection still works when storage is unavailable. */
    }
  }, []);
  const mode =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const context = useMemo(
    () => ({ preference, setPreference }),
    [preference, setPreference]
  );
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', mode === 'dark' ? '#151718' : '#ffffff');
  }, [mode]);
  return (
    <ThemeContext.Provider value={context}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

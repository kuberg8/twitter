import React from 'react';
import { useThemePreference } from '../context/ThemeContext';
export default function ThemeChoice() {
  const { preference, setPreference } = useThemePreference();
  return (
    <label className="theme-choice">
      <span>Оформление</span>
      <select
        aria-label="Тема оформления"
        value={preference}
        onChange={(event) => setPreference(event.target.value)}
      >
        <option value="system">Как в системе</option>
        <option value="light">Светлая</option>
        <option value="dark">Тёмная</option>
      </select>
    </label>
  );
}

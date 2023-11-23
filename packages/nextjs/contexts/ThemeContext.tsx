import { createContext } from "react";

export const ThemeContext = createContext({
  isDarkTheme: false,
  toggleTheme: () => {
    console.warn("toggleTheme was called without a ThemeContext provider");
  },
});

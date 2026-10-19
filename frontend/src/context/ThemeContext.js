import { createContext } from 'react'

// Estado global del tema: { theme: 'light' | 'dark', toggleTheme }.
// Lo provee <ThemeProvider> y se consume con el hook useTheme().
export const ThemeContext = createContext(null)

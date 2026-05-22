import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Always use dark theme for professional look
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = {
    isDark,
    colors: {
      // Primary brand colors
      primary: '#00D9FF', // Cyan
      primaryDark: '#00A8CC',
      
      // Background
      bgPrimary: '#030014', // Deep obsidian indigo
      bgSecondary: 'rgba(10, 8, 28, 0.45)', // Translucent deep purple-gray
      bgTertiary: 'rgba(20, 16, 44, 0.55)',
      
      // Surface
      surfacePrimary: 'rgba(15, 12, 38, 0.45)', // High-premium translucent container
      surfaceSecondary: 'rgba(25, 20, 50, 0.55)',
      
      // Text
      textPrimary: '#FFFFFF',
      textSecondary: '#A0AEC0',
      textTertiary: '#718096',
      
      // Accent colors
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      
      // Borders
      borderLight: 'rgba(255, 255, 255, 0.08)',
      borderMedium: 'rgba(0, 217, 255, 0.15)',
      borderDark: 'rgba(0, 217, 255, 0.3)',
    },
    fonts: {
      family: {
        sans: '"Inter", "Segoe UI", sans-serif',
        mono: '"Fira Code", monospace',
      },
      size: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      glow: '0 0 30px rgba(0, 217, 255, 0.3)',
    },
    transitions: {
      fast: '150ms',
      base: '300ms',
      slow: '500ms',
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

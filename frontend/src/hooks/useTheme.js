import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = (isDark) => {
      const activeTheme = isDark ? 'dark' : 'light';
      setTheme(activeTheme);
      document.documentElement.setAttribute('data-theme', activeTheme);
    };

    // Initial check
    applyTheme(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e) => applyTheme(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return theme;
}

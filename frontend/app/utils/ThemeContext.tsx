import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors, THEME_COLORS } from './theme';

// Theme context type
type ThemeContextType = {
  theme: 'light' | 'dark';
  colors: typeof THEME_COLORS.light | typeof THEME_COLORS.dark;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  isSystemTheme: boolean;
};

// Create the context
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: THEME_COLORS.light,
  setTheme: () => {},
  isSystemTheme: true,
});

// Theme storage key
const THEME_STORAGE_KEY = '@swach_village_theme_preference';

// Theme provider component
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get system color scheme
  const systemColorScheme = useColorScheme() as 'light' | 'dark';
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [isSystemTheme, setIsSystemTheme] = useState(true);
  
  // Current active theme (either user preference or system)
  const activeTheme = themePreference === 'system' 
    ? systemColorScheme || 'light' 
    : themePreference;
  
  // Theme colors based on active theme
  const colors = getThemeColors(activeTheme);
  
  // Load saved theme preference on startup
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setThemePreference(savedTheme as 'light' | 'dark' | 'system');
          setIsSystemTheme(savedTheme === 'system');
        }
      } catch (error) {
        console.log('Error loading theme preference', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Set theme function
  const setTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    setThemePreference(newTheme);
    setIsSystemTheme(newTheme === 'system');
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.log('Error saving theme preference', error);
    }
  };
  
  return (
    <ThemeContext.Provider 
      value={{ 
        theme: activeTheme, 
        colors, 
        setTheme,
        isSystemTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Default export for Expo Router
export default ThemeProvider;

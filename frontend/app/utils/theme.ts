// Theme configuration for the SwachVillageApp
import { ColorSchemeName } from 'react-native';

// Define the theme colors
export const THEME_COLORS = {
  // Light Mode
  light: {
    primary: '#FF7B00', // Primary orange
    primaryDark: '#E56700', // Darker shade of orange for buttons
    primaryLight: '#FFB066', // Lighter shade for highlights
    
    background: '#FFFFFF', // White background
    surface: '#F9F9F9', // Slight off-white for cards
    border: '#EEEEEE', // Light border color
    
    text: '#212121', // Almost black for primary text
    textSecondary: '#757575', // Dark gray for secondary text
    textDisabled: '#BDBDBD', // Light gray for disabled text
    
    error: '#E53935', // Error red
    success: '#43A047', // Success green
    warning: '#FFB300', // Warning yellow
    
    divider: '#E0E0E0', // Subtle divider color
  },

  // Dark Mode
  dark: {
    primary: '#FF7B00', // Same primary orange
    primaryDark: '#CC6200', // Darker shade of orange for buttons in dark mode
    primaryLight: '#FF9E40', // Lighter shade for highlights
    
    background: '#121212', // Dark background
    surface: '#1E1E1E', // Slightly lighter than background for cards
    border: '#333333', // Dark border color
    
    text: '#FFFFFF', // White for text
    textSecondary: '#B0B0B0', // Light gray for secondary text
    textDisabled: '#666666', // Dark gray for disabled text
    
    error: '#FF5252', // Brighter red for dark mode
    success: '#69F0AE', // Brighter green for dark mode
    warning: '#FFD740', // Brighter yellow for dark mode
    
    divider: '#424242', // Subtle divider color for dark mode
  },
};

// Theme shape configurations
export const THEME_SIZING = {
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xl: 20,
    circle: 9999,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  fontSize: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Theme animation timings
export const THEME_ANIMATION = {
  duration: {
    short: 200,
    medium: 300,
    long: 500,
  },
};

// Function to get theme based on color scheme
export const getThemeColors = (colorScheme: ColorSchemeName) => {
  return colorScheme === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light;
};

// Shadow presets
export const getShadow = (elevation = 1, colorScheme: ColorSchemeName = 'light') => {
  const isDark = colorScheme === 'dark';
  
  if (isDark) {
    // Dark mode shadows (more subtle)
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation,
      },
      shadowOpacity: 0.3,
      shadowRadius: elevation * 2,
      elevation: elevation,
    };
  }
  
  // Light mode shadows
  return {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: elevation,
    },
    shadowOpacity: 0.1 + (elevation * 0.03),
    shadowRadius: elevation * 1.5,
    elevation: elevation,
  };
};

// Theme object for default export
const theme = {
  THEME_COLORS,
  THEME_SIZING,
  getThemeColors,
  getShadow,
};

// Default export for Expo Router
export default theme;

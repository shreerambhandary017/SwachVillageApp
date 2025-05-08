import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';

interface ThemeToggleIconProps {
  color?: string;
  size?: number;
  style?: any;
}

const ThemeToggleIcon: React.FC<ThemeToggleIconProps> = ({ 
  color, 
  size = 24, 
  style 
}) => {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={toggleTheme}
      accessibilityLabel={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <Ionicons
        name={theme === 'light' ? 'moon-outline' : 'sunny-outline'}
        size={size}
        color={color || (theme === 'light' ? '#333' : '#FFF')}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
});

export default ThemeToggleIcon;

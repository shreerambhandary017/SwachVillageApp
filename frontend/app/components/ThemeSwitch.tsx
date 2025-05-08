import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { THEME_SIZING } from '../utils/theme';

type ThemeSwitchProps = {
  compact?: boolean;
};

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ compact = false }) => {
  const { theme, setTheme, isSystemTheme, colors } = useTheme();
  
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };
  
  const setSystemTheme = () => {
    setTheme('system');
  };
  
  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.surface }]}>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: '#DDDDDD', true: colors.primaryLight }}
          thumbColor={theme === 'dark' ? colors.primary : '#FFFFFF'}
          ios_backgroundColor="#DDDDDD"
        />
        <Ionicons
          name={theme === 'dark' ? 'moon' : 'sunny'}
          size={18}
          color={colors.primary}
          style={styles.compactIcon}
        />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            theme === 'light' && !isSystemTheme && { backgroundColor: colors.primaryLight },
          ]}
          onPress={() => setTheme('light')}
        >
          <Ionicons name="sunny" size={24} color={theme === 'light' && !isSystemTheme ? colors.primary : colors.textSecondary} />
          <Text style={[
            styles.optionText,
            { color: theme === 'light' && !isSystemTheme ? colors.primary : colors.text }
          ]}>
            Light
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.option,
            theme === 'dark' && !isSystemTheme && { backgroundColor: colors.primaryLight },
          ]}
          onPress={() => setTheme('dark')}
        >
          <Ionicons name="moon" size={24} color={theme === 'dark' && !isSystemTheme ? colors.primary : colors.textSecondary} />
          <Text style={[
            styles.optionText,
            { color: theme === 'dark' && !isSystemTheme ? colors.primary : colors.text }
          ]}>
            Dark
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.option,
            isSystemTheme && { backgroundColor: colors.primaryLight },
          ]}
          onPress={setSystemTheme}
        >
          <Ionicons name="phone-portrait" size={24} color={isSystemTheme ? colors.primary : colors.textSecondary} />
          <Text style={[
            styles.optionText,
            { color: isSystemTheme ? colors.primary : colors.text }
          ]}>
            System
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {isSystemTheme 
          ? 'Using system theme setting'
          : `Using ${theme} theme`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: THEME_SIZING.spacing.l,
    borderRadius: THEME_SIZING.borderRadius.medium,
    borderWidth: 1,
    marginVertical: THEME_SIZING.spacing.m,
  },
  title: {
    fontSize: THEME_SIZING.fontSize.l,
    fontWeight: '600',
    marginBottom: THEME_SIZING.spacing.m,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME_SIZING.spacing.m,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME_SIZING.spacing.m,
    borderRadius: THEME_SIZING.borderRadius.medium,
    flex: 1,
    marginHorizontal: THEME_SIZING.spacing.xs,
  },
  optionText: {
    marginTop: THEME_SIZING.spacing.s,
    fontSize: THEME_SIZING.fontSize.s,
    fontWeight: '500',
  },
  hint: {
    fontSize: THEME_SIZING.fontSize.s,
    textAlign: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME_SIZING.spacing.xs,
    borderRadius: THEME_SIZING.borderRadius.medium,
  },
  compactIcon: {
    marginLeft: THEME_SIZING.spacing.xs,
  },
});

// Default export for Expo Router
export default ThemeSwitch;

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Platform, 
  StyleProp, 
  ViewStyle,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ThemeSwitch from './ThemeSwitch';
import { THEME_SIZING, getShadow } from '../utils/theme';

interface AppBarProps {
  title: string;
  showBackButton?: boolean;
  showThemeToggle?: boolean;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onBackPress?: () => void;
}

const AppBar: React.FC<AppBarProps> = ({
  title,
  showBackButton = false,
  showThemeToggle = false,
  rightAction,
  style,
  onBackPress,
}) => {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <>
      <StatusBar
        backgroundColor={isDark ? '#121212' : '#FFFFFF'} 
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            ...getShadow(2, theme),
          },
          style,
        ]}
      >
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity 
              onPress={handleBackPress} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          )}
          <Text 
            style={[
              styles.title,
              { color: colors.text }
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          {showThemeToggle && <ThemeSwitch />}
          {rightAction}
        </View>
      </View>
    </>
  );
};

const APPBAR_HEIGHT = 56;
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: APPBAR_HEIGHT,
    paddingHorizontal: THEME_SIZING.spacing.m,
    borderBottomWidth: 1,
    marginTop: STATUSBAR_HEIGHT,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: THEME_SIZING.spacing.s,
  },
  title: {
    fontSize: THEME_SIZING.fontSize.l,
    fontWeight: '600',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

// Default export for Expo Router
export default AppBar;

import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { THEME_SIZING, getShadow } from '../utils/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
  disabled,
  ...rest
}) => {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  
  // Button styling based on variant
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          ...getShadow(2, theme),
        };
      case 'secondary':
        return {
          backgroundColor: isDark ? colors.surface : '#FFF8F0',
          borderColor: colors.border,
          ...getShadow(1, theme),
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          borderWidth: 1,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
    }
  };
  
  // Text styling based on variant
  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          color: colors.primary,
        };
      case 'outline':
        return {
          color: colors.primary,
        };
      case 'text':
        return {
          color: colors.primary,
        };
    }
  };
  
  // Size styling
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: THEME_SIZING.spacing.xs,
          paddingHorizontal: THEME_SIZING.spacing.m,
          borderRadius: THEME_SIZING.borderRadius.small,
        };
      case 'medium':
        return {
          paddingVertical: THEME_SIZING.spacing.s,
          paddingHorizontal: THEME_SIZING.spacing.l,
          borderRadius: THEME_SIZING.borderRadius.medium,
        };
      case 'large':
        return {
          paddingVertical: THEME_SIZING.spacing.m,
          paddingHorizontal: THEME_SIZING.spacing.xl,
          borderRadius: THEME_SIZING.borderRadius.large,
        };
    }
  };
  
  // Text size based on button size
  const getTextSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: THEME_SIZING.fontSize.s,
        };
      case 'medium':
        return {
          fontSize: THEME_SIZING.fontSize.m,
        };
      case 'large':
        return {
          fontSize: THEME_SIZING.fontSize.l,
        };
    }
  };
  
  const buttonDisabledStyle = disabled ? {
    opacity: 0.6,
    backgroundColor: isDark ? '#444444' : '#E0E0E0',
    borderColor: isDark ? '#444444' : '#E0E0E0',
    ...getShadow(0, theme),
  } : {};
  
  const textDisabledStyle = disabled ? {
    color: isDark ? '#999999' : '#999999',
  } : {};
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        buttonDisabledStyle,
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#FFFFFF' : colors.primary} 
        />
      ) : (
        <>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text 
            style={[
              styles.buttonText, 
              getTextStyle(), 
              getTextSizeStyle(),
              textDisabledStyle,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  leftIcon: {
    marginRight: THEME_SIZING.spacing.s,
  },
  rightIcon: {
    marginLeft: THEME_SIZING.spacing.s,
  },
});

// Default export for Expo Router
export default Button;

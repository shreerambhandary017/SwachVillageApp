import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { THEME_SIZING, getShadow } from '../utils/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  secureTextEntry?: boolean;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  secureTextEntry,
  required = false,
  style,
  ...rest
}) => {
  const { colors, theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (rest.onFocus) {
      rest.onFocus(e);
    }
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (rest.onBlur) {
      rest.onBlur(e);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            {label}
            {required && <Text style={{ color: colors.error }}> *</Text>}
          </Text>
        </View>
      )}
      
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: error 
              ? colors.error 
              : isFocused 
                ? colors.primary 
                : colors.border,
            backgroundColor: colors.surface,
          },
          isFocused && { 
            ...getShadow(1, theme),
            borderWidth: 2,
            borderColor: colors.primary,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: 'transparent',
            },
            style,
          ]}
          placeholderTextColor={colors.textDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...rest}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.rightIcon} 
            onPress={togglePasswordVisibility}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
      
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? colors.error : colors.textSecondary,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME_SIZING.spacing.m,
  },
  labelContainer: {
    marginBottom: THEME_SIZING.spacing.xs,
  },
  label: {
    fontSize: THEME_SIZING.fontSize.s,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: THEME_SIZING.borderRadius.medium,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: THEME_SIZING.spacing.m,
    paddingHorizontal: THEME_SIZING.spacing.m,
    fontSize: THEME_SIZING.fontSize.m,
  },
  leftIcon: {
    paddingLeft: THEME_SIZING.spacing.m,
  },
  rightIcon: {
    paddingRight: THEME_SIZING.spacing.m,
  },
  helperText: {
    fontSize: THEME_SIZING.fontSize.xs,
    marginTop: THEME_SIZING.spacing.xs,
  },
});

// Default export for Expo Router
export default Input;

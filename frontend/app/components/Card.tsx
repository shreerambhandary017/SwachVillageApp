import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { THEME_SIZING, getShadow } from '../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: number;
  withBorder?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 2,
  withBorder = false,
}) => {
  const { colors, theme } = useTheme();
  
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: withBorder ? colors.border : 'transparent',
          ...getShadow(elevation, theme),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME_SIZING.borderRadius.medium,
    padding: THEME_SIZING.spacing.l,
    borderWidth: 1,
    marginVertical: THEME_SIZING.spacing.m,
  },
});

// Default export for Expo Router
export default Card;

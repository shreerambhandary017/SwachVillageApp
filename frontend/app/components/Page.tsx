import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleProp,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import AppBar from './AppBar';

interface PageProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showThemeToggle?: boolean;
  rightAction?: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  withKeyboardAvoidingView?: boolean;
  withSafeArea?: boolean;
  appBarStyle?: StyleProp<ViewStyle>;
  onBackPress?: () => void;
}

const Page: React.FC<PageProps> = ({
  children,
  title,
  showBackButton = false,
  showThemeToggle = false,
  rightAction,
  scrollable = true,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  withKeyboardAvoidingView = true,
  withSafeArea = true,
  appBarStyle,
  onBackPress,
}) => {
  const { colors, theme } = useTheme();
  
  const Content = () => (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {title && (
        <AppBar
          title={title}
          showBackButton={showBackButton}
          showThemeToggle={showThemeToggle}
          rightAction={rightAction}
          style={appBarStyle}
          onBackPress={onBackPress}
        />
      )}
      
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.contentContainer, contentContainerStyle]}>
          {children}
        </View>
      )}
    </View>
  );
  
  if (withKeyboardAvoidingView) {
    return (
      <>
        <StatusBar
          backgroundColor="transparent"
          translucent
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        />
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {withSafeArea ? (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
              <Content />
            </SafeAreaView>
          ) : (
            <Content />
          )}
        </KeyboardAvoidingView>
      </>
    );
  }
  
  return (
    <>
      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />
      {withSafeArea ? (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
          <Content />
        </SafeAreaView>
      ) : (
        <Content />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
});

// Default export for Expo Router
export default Page;

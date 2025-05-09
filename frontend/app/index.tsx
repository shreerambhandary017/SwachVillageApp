import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './splash';

// This is the root entry point for the app
// It can check for a logout state and redirect accordingly
export default function AppEntry() {
  // State to control redirecting to auth on logout
  const [shouldRedirect, setShouldRedirect] = React.useState(false);
  
  // Check if we're in the middle of a logout process
  useEffect(() => {
    const checkForDirectLogout = async () => {
      try {
        // Special handling for direct logout
        const isLoggingOut = await AsyncStorage.getItem('is_logging_out');
        
        if (isLoggingOut === 'true') {
          console.log('Root index detected active logout - clearing flag');
          await AsyncStorage.removeItem('is_logging_out');
          
          // Additionally verify auth tokens are gone
          const keys = await AsyncStorage.getAllKeys();
          const hasAuth = keys.includes('auth_token') || keys.includes('user_data');
          
          if (!hasAuth) {
            console.log('Authentication data confirmed removed, redirect initiated');
            // Set state to trigger redirect
            setShouldRedirect(true);
            return true;
          }
        }
        
        return false;
      } catch (e) {
        console.error('Error in logout detection:', e);
        return false;
      }
    };
    
    checkForDirectLogout();
  }, []);
  
  // If logout detected, force redirect to auth
  if (shouldRedirect) {
    console.log('Root index performing redirect to auth');
    return <Redirect href="/(auth)/sign-in" />;
  }
  
  // Default behavior is to show the splash screen
  return <SplashScreen />;
}

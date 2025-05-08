import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { isAuthenticated, getUserData } from './utils/auth';

export default function SplashScreen() {
  const router = useRouter();
  const loadingAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animate the loading bar
    Animated.timing(loadingAnimation, {
      toValue: 1,
      duration: 3500, // 3.5 seconds for the loading animation
      useNativeDriver: false,
    }).start();
    
    // Check authentication and navigate accordingly
    const checkAuthAndNavigate = async () => {
      try {
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          // Get user data to determine role
          const userData = await getUserData();
          
          if (userData) {
            // Navigate based on user role
            if (userData.role === 'business') {
              router.replace('/(business)');
            } else {
              router.replace('/(consumer)');
            }
          } else {
            // User data not found, go to sign-in
            router.replace('/(auth)/sign-in');
          }
        } else {
          // Not authenticated, go to sign-in
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/(auth)/sign-in');
      }
    };
    
    // Set timeout for authentication check
    const timer = setTimeout(() => {
      checkAuthAndNavigate();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const loadingWidth = loadingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  return (
    <LinearGradient
      colors={['#3498db', '#8e44ad']}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <Image
          source={require('../assets/images/swach_logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.title}>Swach Village</Text>
        <Text style={styles.subtitle}>Empowering Clean & Cruelty-Free Businesses</Text>
        
        <View style={styles.loadingBarContainer}>
          <Animated.View 
            style={[
              styles.loadingBar,
              { width: loadingWidth }
            ]} 
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    width: width * 0.8,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.9,
  },
  loadingBarContainer: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
}); 
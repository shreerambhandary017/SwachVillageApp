import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Svg, Circle, Path } from 'react-native-svg';
import { isAuthenticated, getUserData, getAuthToken } from './utils/auth';
import { useTheme } from './utils/ThemeContext';
import { THEME_SIZING } from './utils/theme';
import { API_CONFIG } from './utils/config';

export default function SplashScreen() {
  const router = useRouter();
  const loadingAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;
  const { theme } = useTheme();

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    // Subtle scale animation
    Animated.timing(scaleAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    // Animate the loading bar
    Animated.timing(loadingAnimation, {
      toValue: 1,
      duration: 3200, // 3.2 seconds for the loading animation
      useNativeDriver: false,
    }).start();
    
    // Check authentication and navigate accordingly
    const checkAuthAndNavigate = async () => {
      try {
        console.log('Splash: Checking authentication...');
        // First check if token exists
        const token = await getAuthToken();
        let authenticated = false;
        
        // Only verify token if it exists
        if (token) {
          try {
            // Verify the token with the backend
            const response = await fetch(`${API_CONFIG.API_URL}/auth/verify-token`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              },
            });
            
            // Check if verification was successful
            if (response.ok) {
              const data = await response.json();
              authenticated = data.valid;
              console.log('Splash: Token verification result:', authenticated);
            } else {
              console.log('Splash: Token verification failed, status:', response.status);
              authenticated = false;
            }
          } catch (verifyError) {
            console.error('Splash: Token verification error:', verifyError);
            authenticated = false;
          }
        } else {
          console.log('Splash: No authentication token found');
        }
        
        if (authenticated) {
          // Get user data to determine role
          const userData = await getUserData();
          
          if (userData) {
            console.log('Splash: Authenticated as', userData.role);
            // Navigate based on user role
            if (userData.role === 'business') {
              router.replace('/(business)');
            } else {
              router.replace('/(consumer)');
            }
          } else {
            console.log('Splash: No user data found, redirecting to sign-in');
            // User data not found, go to sign-in
            router.replace('/(auth)/sign-in');
          }
        } else {
          console.log('Splash: Not authenticated, redirecting to sign-in');
          // Not authenticated, go to sign-in
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('Splash: Auth check error:', error);
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
  
  // Enhanced gradient colors for light and dark mode
  const gradientColors = theme === 'dark' 
    ? ['#121212', '#1A1A1A', '#262626'] as const // Dark mode - cleaner dark gradient
    : ['#FFFFFF', '#FAFAFA', '#F5F5F5'] as const; // Light mode - subtle light gradient
  
  // Accent colors based on theme - more vibrant for better visibility
  const accentColor = theme === 'dark' ? '#FF9800' : '#FF7B00';
  const logoRingColor = theme === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 123, 0, 0.15)';
  
  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      {/* Modern geometric background elements */}
      <View style={styles.backgroundElements}>
        {/* Larger circular accent in the background */}
        <Svg height="500" width="500" style={[styles.decorativeBubble, { top: '-10%', right: '-20%' }]}>
          <Circle cx="250" cy="250" r="250" fill={theme === 'dark' ? 'rgba(255, 152, 0, 0.05)' : 'rgba(255, 123, 0, 0.05)'} />
        </Svg>
        
        {/* Smaller accents */}
        <Svg height="200" width="200" style={[styles.decorativeBubble, styles.bubble1]}>
          <Circle cx="100" cy="100" r="50" fill={theme === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 123, 0, 0.12)'} />
        </Svg>
        <Svg height="150" width="150" style={[styles.decorativeBubble, styles.bubble2]}>
          <Circle cx="75" cy="75" r="40" fill={theme === 'dark' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 123, 0, 0.15)'} />
        </Svg>
        <Svg height="120" width="120" style={[styles.decorativeBubble, { bottom: '12%', right: '8%' }]}>
          <Circle cx="60" cy="60" r="35" fill={theme === 'dark' ? 'rgba(255, 152, 0, 0.12)' : 'rgba(255, 123, 0, 0.18)'} />
        </Svg>
      </View>

      <Animated.View 
        style={[styles.contentContainer, {
          opacity: fadeAnimation,
          transform: [{ scale: scaleAnimation }]
        }]}
      >
        {/* Enhanced logo with multi-layered background for depth */}
        <View style={[styles.logoOuter, { backgroundColor: theme === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 123, 0, 0.1)' }]}>
          <View style={[styles.logoMiddle, { backgroundColor: theme === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 123, 0, 0.15)' }]}>
            <LinearGradient
              colors={theme === 'dark' ? ['#FFFFFF', '#FFFFFF'] : ['#FFFFFF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}>
              <View style={styles.logoInnerShadow}>
                <Image
                  source={require('../assets/images/swach_logo.png')}
                  style={styles.logo}
                  contentFit="contain"
                />
              </View>
            </LinearGradient>
          </View>
        </View>
        <Text style={[styles.title, { color: theme === 'dark' ? '#FFFFFF' : '#212121' }]}>Swach Village</Text>
        <Text style={[styles.subtitle, { color: theme === 'dark' ? '#B0B0B0' : '#757575' }]}>
          Empowering Clean & Cruelty-Free Businesses
        </Text>
        <Text style={[styles.version, { color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }]}>
          v1.0.0
        </Text>
        
        <View style={[styles.loadingBarContainer, { backgroundColor: theme === 'dark' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 123, 0, 0.12)' }]}>
          <Animated.View 
            style={[
              styles.loadingBar,
              { width: loadingWidth, backgroundColor: accentColor }
            ]} 
          />
          <Text style={[styles.loadingText, { color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>
            Loading...
          </Text>
        </View>
      </Animated.View>
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
  logoOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoMiddle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoInnerShadow: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 70,
  },
  logo: {
    width: 110,
    height: 110,
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  decorativeBubble: {
    position: 'absolute',
    opacity: 0.7,
  },
  bubble1: {
    top: '15%',
    right: '10%',
  },
  bubble2: {
    bottom: '25%',
    left: '10%',
  },
  bubble3: {
    bottom: '15%',
    right: '15%',
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
    marginBottom: 10,
    textAlign: 'center',
    opacity: 0.9,
    fontWeight: '400',
  },
  version: {
    fontSize: 12,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '400',
  },
  loadingBarContainer: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 1,
  },
}); 
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Svg, Circle, Path } from 'react-native-svg';
import { isAuthenticated, getUserData } from './utils/auth';
import { useTheme } from './utils/ThemeContext';
import { THEME_SIZING } from './utils/theme';

export default function SplashScreen() {
  const router = useRouter();
  const loadingAnimation = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

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
  
  // Different gradient colors for light and dark mode
  const gradientColors = theme === 'dark' 
    ? ['#121212', '#212121', '#333333'] as const // Dark mode - shades of black
    : ['#FFFFFF', '#FFF8F0'] as const;           // Light mode - white to very light orange
  
  // Accent colors based on theme
  const accentColor = theme === 'dark' ? '#FF7B00' : '#FF7B00'; // Orange for both
  
  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      {/* Background decorative elements */}
      <View style={styles.backgroundElements}>
        <Svg height="200" width="200" style={[styles.decorativeBubble, styles.bubble1]}>
          <Circle cx="100" cy="100" r="50" fill={theme === 'dark' ? 'rgba(255, 123, 0, 0.1)' : 'rgba(255, 123, 0, 0.2)'} />
        </Svg>
        <Svg height="150" width="150" style={[styles.decorativeBubble, styles.bubble2]}>
          <Circle cx="75" cy="75" r="40" fill={theme === 'dark' ? 'rgba(255, 123, 0, 0.15)' : 'rgba(255, 123, 0, 0.25)'} />
        </Svg>
        <Svg height="100" width="100" style={[styles.decorativeBubble, styles.bubble3]}>
          <Circle cx="50" cy="50" r="30" fill={theme === 'dark' ? 'rgba(255, 123, 0, 0.2)' : 'rgba(255, 123, 0, 0.3)'} />
        </Svg>
      </View>

      <View style={styles.contentContainer}>
        {/* Logo with double circle background */}
        <View style={styles.logoOuterCircle}>
          <View style={[styles.logoContainer, { backgroundColor: accentColor }]}>
            <Image
              source={require('../assets/images/swach_logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
        </View>
        <Text style={[styles.title, { color: theme === 'dark' ? '#FFFFFF' : '#212121' }]}>Swach Village</Text>
        <Text style={[styles.subtitle, { color: theme === 'dark' ? '#B0B0B0' : '#757575' }]}>
          Empowering Clean & Cruelty-Free Businesses
        </Text>
        
        <View style={[styles.loadingBarContainer, { backgroundColor: theme === 'dark' ? 'rgba(255, 123, 0, 0.3)' : 'rgba(255, 123, 0, 0.2)' }]}>
          <Animated.View 
            style={[
              styles.loadingBar,
              { width: loadingWidth, backgroundColor: accentColor }
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
  logoOuterCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 123, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 100,
    height: 100,
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
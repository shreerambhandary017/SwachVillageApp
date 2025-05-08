import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Tabs, useRouter, usePathname } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { ProtectedRoute } from "../utils/protectedRoute";
import { useTheme } from "../utils/ThemeContext";

// Helper function to get header title based on route name
const getHeaderTitle = (route: any) => {
  const routeName = route.name;
  switch (routeName) {
    case 'index':
      return 'Home';
    case 'feedback':
      return 'Your Feedback';
    case 'verify':
      return 'Verify Products';
    case 'profile':
      return 'Profile';
    default:
      return 'Swach Village';
  }
};

export default function ConsumerLayout() {
  const { colors, theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  
  // Prevent direct access to scan-barcode and product-details screens
  useEffect(() => {
    // Check if current path is one of the removed screens
    if (pathname === '/scan-barcode' || pathname === '/product-details') {
      // Redirect to verify screen
      router.replace('/verify');
    }
  }, [pathname]);
  
  return (
    <ProtectedRoute allowedRoles={['consumer']}>
      <Tabs
        screenOptions={({ route }) => {
          // Get the route name to apply custom styles based on active tab
          const routeName = route.name;
          
          return {
            // Remove headers from all tabs
            headerShown: false,
            
            // Enhanced tab bar style with reduced height and padding
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: 'transparent',
              borderTopWidth: 0,
              height: 60, // Reduced from 75 to 60
              paddingBottom: Platform.OS === 'ios' ? 10 : 5, // Reduced padding
              paddingTop: 5, // Reduced from 10 to 5
              paddingHorizontal: 0,
              
              // Improved shadow/elevation for a floating effect
              ...Platform.select({
                ios: {
                  shadowColor: theme === 'dark' ? '#000' : colors.primary,
                  shadowOffset: { width: 0, height: -2 }, // Reduced shadow offset
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 8, // Reduced elevation
                },
              }),
              
              // Slight border radius on top edges for a softer look
              borderTopLeftRadius: 16, // Reduced from 20 to 16
              borderTopRightRadius: 16,
            },
            
            // Tab appearance - streamlined
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarShowLabel: true,
            
            // Optimized tab item styles for better spacing
            tabBarItemStyle: {
              padding: 2,
              marginHorizontal: 0,
              marginVertical: 0,
              borderRadius: 12,
              width: '100%', // Ensure even width distribution
              height: 50, // Control the height directly
            },
            
            // More compact label style
            tabBarLabelStyle: { 
              fontSize: 11, 
              fontWeight: '500',
              marginTop: -4,
              marginBottom: 4,
              letterSpacing: 0,
              opacity: 0.9,
            },
            
            // Adjusted icon positioning
            tabBarIconStyle: {
              marginTop: 0,
            },
            
            // Minimal tab button design with subtle animation
            tabBarButton: (props) => {
              // Extract needed props and handle the rest safely
              const { onPress, children, accessibilityState } = props;
              const isActive = accessibilityState?.selected;
              
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    // Attempt haptic feedback only on real devices
                    if (Platform.OS === 'ios' || Platform.OS === 'android') {
                      try {
                        // Using native feedback
                        const { Vibration } = require('react-native');
                        Vibration.vibrate(10); // Very light vibration
                      } catch (error) {
                        // Fallback if vibration is not available
                      }
                    }
                    // Call the original onPress
                    if (onPress) onPress(e);
                  }}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    // More subtle active state indicator
                    backgroundColor: isActive ? 
                      theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' : 
                      'transparent',
                    borderRadius: 10,
                    paddingVertical: 4, // Reduced padding
                    // Smaller scale effect for active tabs
                    transform: [{ 
                      scale: isActive ? 1.02 : 1 
                    }],
                  }}
                >
                  {children}
                </TouchableOpacity>
              );
            },
          };
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size+2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="verify"
          options={{
            title: "Verify",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark-outline" size={size+2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="feedback"
          options={{
            title: "Feedback",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses-outline" size={size+2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size+2} color={color} />
            ),
          }}
        />
        
        {/* Add these screens but hide them from the tab bar */}
        <Tabs.Screen
          name="scan-barcode"
          options={{
            tabBarButton: () => null, // This removes the tab button from the tab bar
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="product-details"
          options={{
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' },
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
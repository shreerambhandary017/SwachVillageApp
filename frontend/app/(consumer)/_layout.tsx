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
          return {
            // Remove headers from all tabs
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: 'transparent',
              height: 70,
              paddingBottom: Platform.OS === 'ios' ? 20 : 10,
              paddingTop: 10,
              ...Platform.select({
                ios: {
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                },
                android: {
                  elevation: 10,
                },
              }),
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarShowLabel: true,
            tabBarLabelStyle: { 
              fontSize: 12, 
              fontWeight: '600',
              marginTop: -5,
              marginBottom: 5
            },
            tabBarIconStyle: {
              marginTop: 5
            }
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
      </Tabs>
    </ProtectedRoute>
  );
}
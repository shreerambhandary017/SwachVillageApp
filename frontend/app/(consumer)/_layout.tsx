import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Tabs } from "expo-router";
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
              <Ionicons name="home" size={size+2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="feedback"
          options={{
            title: "Feedback",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble" size={size+2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size+2} color={color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
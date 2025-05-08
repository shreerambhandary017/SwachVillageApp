import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { ProtectedRoute } from "../utils/protectedRoute";
import { useTheme } from "../utils/ThemeContext";

export default function ConsumerLayout() {
  const { colors } = useTheme();
  
  return (
    <ProtectedRoute allowedRoles={['consumer']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 10,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              },
              android: {
                elevation: 8,
              },
            }),
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 12 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="feedback"
          options={{
            title: "Feedback",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="verify"
          options={{
            title: "Verify",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barcode-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
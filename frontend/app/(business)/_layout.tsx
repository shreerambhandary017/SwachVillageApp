import { Tabs } from "expo-router";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { ProtectedRoute } from "../utils/protectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/ThemeContext";

export default function BusinessLayout() {
  const { colors, theme } = useTheme();
  
  return (
    <ProtectedRoute allowedRoles={['business']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: theme === 'dark' ? '#999999' : '#888888',
          tabBarStyle: { 
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
            // Add shadow based on theme
            ...theme === 'dark' ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4
            } : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 3
            }
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            paddingBottom: 5,
          }
        }}
        // Explicitly define tab screens to show only the ones we want
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="feedback"
          options={{
            title: "Feedback",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
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
        {/* Hide these screens from the tab bar but keep them available for navigation */}
        <Tabs.Screen
          name="index"
          options={{
            href: null, // This prevents it from appearing in the tab bar
          }}
        />
        <Tabs.Screen
          name="certification"
          options={{
            href: null, // This prevents it from appearing in the tab bar
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
} 
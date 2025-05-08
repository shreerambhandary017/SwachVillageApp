import { Tabs } from "expo-router";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import ProtectedRoute from "../utils/protectedRoute";
import { Ionicons } from "@expo/vector-icons";

export default function BusinessLayout() {
  return (
    <ProtectedRoute allowedRoles={['business']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#f39c12",
          tabBarInactiveTintColor: "#888",
          tabBarStyle: { 
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#f0f0f0",
            paddingBottom: 5,
            paddingTop: 5,
            height: 60
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            paddingBottom: 5,
          }
        }}
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
      </Tabs>
    </ProtectedRoute>
  );
} 
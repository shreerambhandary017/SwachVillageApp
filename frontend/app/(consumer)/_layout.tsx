import { Stack } from "expo-router";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import ProtectedRoute from "../utils/protectedRoute";

export default function ConsumerLayout() {
  return (
    <ProtectedRoute allowedRoles={['consumer']}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </ProtectedRoute>
  );
} 
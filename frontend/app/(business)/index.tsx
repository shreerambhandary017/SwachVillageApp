import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';

export default function BusinessIndexRedirect() {
  return <Redirect href="/(business)/dashboard" />;
} 
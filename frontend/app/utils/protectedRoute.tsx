import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getUserData, isAuthenticated, UserRole } from './auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const authenticated = await isAuthenticated();
        
        if (!authenticated) {
          // Redirect to login if not authenticated
          router.replace('/(auth)/sign-in');
          return;
        }
        
        // Get user data including role
        const userData = await getUserData();
        
        if (!userData) {
          // Redirect to login if user data not found
          router.replace('/(auth)/sign-in');
          return;
        }
        
        // Check if user role is in allowed roles
        if (allowedRoles.includes(userData.role)) {
          setAuthorized(true);
        } else {
          // Redirect based on role
          if (userData.role === 'business') {
            router.replace('/(business)');
          } else {
            router.replace('/(consumer)');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/(auth)/sign-in');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.text}>Verifying access...</Text>
      </View>
    );
  }
  
  if (!authorized) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>You are not authorized to access this page.</Text>
      </View>
    );
  }
  
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center',
  },
}); 
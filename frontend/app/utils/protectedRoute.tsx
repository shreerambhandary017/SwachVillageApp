import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getUserData, isAuthenticated, UserRole, getAuthToken } from './auth';
import { API_CONFIG } from './config';

// Interface for component props
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

// Main component implementation
function ProtectedRouteComponent({ children, allowedRoles }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        console.log('ProtectedRoute: Checking authentication...');
        
        // Force a more thorough token verification instead of just checking if token exists
        const verifyResponse = await fetch(`${API_CONFIG.API_URL}/auth/verify-token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`
          },
        }).catch(err => {
          console.error('Token verification network error:', err);
          return { ok: false };
        });
        
        // Check if user is authenticated with a valid token
        const authenticated = await isAuthenticated() && verifyResponse?.ok;
        
        if (!authenticated) {
          console.log('ProtectedRoute: Not authenticated, redirecting to sign-in');
          // Redirect to login if not authenticated
          router.replace('/(auth)/sign-in');
          return;
        }
        
        // Get user data including role
        const userData = await getUserData();
        
        if (!userData) {
          console.log('ProtectedRoute: No user data found, redirecting to sign-in');
          // Redirect to login if user data not found
          router.replace('/(auth)/sign-in');
          return;
        }
        
        console.log('ProtectedRoute: User role:', userData.role, 'Allowed roles:', allowedRoles);
        
        // Check if user role is in allowed roles
        if (allowedRoles.includes(userData.role)) {
          setAuthorized(true);
        } else {
          console.log('ProtectedRoute: User role not in allowed roles, redirecting');
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

// This default export is necessary for Expo Router compatibility
export default function ProtectedRoutePage() {
  return null;
}

// Export the ProtectedRoute component for use in other files
export { ProtectedRouteComponent as ProtectedRoute };
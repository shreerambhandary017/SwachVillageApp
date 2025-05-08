import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_CONFIG } from './config';

// Types
export type UserRole = 'business' | 'consumer';

export interface LoginCredentials {
  identifier: string; // email or phone
  password: string;
  role: UserRole;
}

export interface RegisterCredentials {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  business_name?: string; // Optional, only for business role
}

export interface User {
  id: number;
  name: string;
  full_name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_verified: boolean;
  created_at?: string;
  profile_completed?: boolean;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

// Constants
const API_URL = API_CONFIG.API_URL; // Using centralized config
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// API functions
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store auth data in AsyncStorage
    await storeAuthData(data);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // Store auth data in AsyncStorage
    await storeAuthData(data);
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const verifyToken = async (): Promise<{ valid: boolean; user?: User }> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { valid: false };
    }
    
    const response = await fetch(`${API_URL}/auth/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false };
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Storage functions
const storeAuthData = async (authData: AuthResponse): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, authData.token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(authData.user));
  } catch (error) {
    console.error('Error storing auth data:', error);
    throw error;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const getUserData = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

// Helper function to navigate after authentication
export const navigateByRole = async (router: any) => {
  try {
    const userData = await getUserData();
    if (!userData) {
      console.log('No user data found, redirecting to sign-in');
      router.replace('/(auth)/sign-in');
      return;
    }
    
    console.log('Navigating by role:', userData.role);
    
    if (userData.role === 'business') {
      // For business users, check if they've completed certification
      router.replace('/(business)/certification');
    } else {
      // For consumer users, go to home
      router.replace('/(consumer)');
    }
  } catch (error) {
    console.error('Navigation error:', error);
    router.replace('/(auth)/sign-in');
  }
};

// This tells Expo Router to ignore this file as a route
export default function AuthPage() {
  return null;
} 
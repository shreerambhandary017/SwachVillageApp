import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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
  email: string;
  role: UserRole;
  is_verified: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

// Constants
const API_URL = 'http://192.168.1.5:5000/api'; // Replace with your Flask API URL
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
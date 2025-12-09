// Authentication store for BP Buddy
// Handles user login, logout, registration, and session management

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  _id: string;
  userId: string;
  email: string;
  name: string;
  profile?: {
    age?: number;
    height?: number;
    weight?: number;
    medicalConditions?: string[];
    medications?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
    };
  };
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : 'http://172.16.3.175:3001');
const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  REMEMBER_EMAIL: 'remember_email',
};

// Global auth state
let authState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
};

// Update listeners
type AuthListener = (state: AuthState) => void;
const authListeners: AuthListener[] = [];

// Subscribe to auth state changes
export const subscribeToAuth = (listener: AuthListener): (() => void) => {
  authListeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    const index = authListeners.indexOf(listener);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
};

// Notify all listeners of state changes
const notifyListeners = () => {
  authListeners.forEach(listener => listener({ ...authState }));
};

// API helper function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}/api/${endpoint}`;
  console.log('🌐 Making API call to:', url);
  console.log('📤 Request options:', options);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('📡 Response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📥 Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || `API call failed: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('🚨 API call failed:', error);
    throw error;
  }
};

// Initialize auth store
export const initializeAuth = async (): Promise<void> => {
  authState.isLoading = true;
  authState.error = null;
  notifyListeners();

  try {
    // Check for stored token and user data
    const [storedToken, storedUserData] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
    ]);

    if (storedToken && storedUserData) {
      const user = JSON.parse(storedUserData);
      
      // For now, skip token verification to avoid API call issues
      // Just use stored user data if it exists
      authState.isAuthenticated = true;
      authState.user = user;
      console.log('Auto-login successful for:', user.email);
      
      // Load user-specific data
      try {
        const { loadUserData } = await import('./bpStore');
        await loadUserData();
      } catch (error) {
        console.warn('Failed to load user data during auto-login:', error);
      }
    }
  } catch (error) {
    console.error('Failed to initialize auth:', error);
    authState.error = 'Failed to initialize authentication';
  } finally {
    authState.isLoading = false;
    notifyListeners();
  }
};

// Clear auth storage
const clearAuthStorage = async (): Promise<void> => {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
  ]);
};

// Login function
export const login = async (email: string, password: string, rememberMe = false): Promise<void> => {
  console.log('🔄 Starting login process for:', email);
  console.log('🌐 API Base URL:', API_BASE_URL);
  
  authState.isLoading = true;
  authState.error = null;
  notifyListeners();

  try {
    console.log('📡 Making API call to auth/login...');
    const response = await apiCall('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    console.log('📥 API Response:', response);

    if (response.success) {
      const { user, token } = response.data;
      
      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
        rememberMe 
          ? AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, email)
          : AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL),
      ]);

      authState.isAuthenticated = true;
      authState.user = user;
      console.log('Login successful for:', user.email);
      
      // Load user-specific data
      try {
        const { loadUserData } = await import('./bpStore');
        await loadUserData();
      } catch (error) {
        console.warn('Failed to load user data:', error);
      }
    } else {
      throw new Error(response.error || 'Login failed');
    }
  } catch (error: any) {
    console.error('❌ Login error:', error);
    authState.error = error.message || 'Login failed';
    throw error;
  } finally {
    authState.isLoading = false;
    notifyListeners();
  }
};

// Register function
export const register = async (
  email: string,
  password: string,
  name: string,
  profile?: Partial<User['profile']>
): Promise<void> => {
  authState.isLoading = true;
  authState.error = null;
  notifyListeners();

  try {
    const response = await apiCall('auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, profile }),
    });

    if (response.success) {
      const { user, token } = response.data;
      
      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);

      authState.isAuthenticated = true;
      authState.user = user;
      console.log('Registration successful for:', user.email);
      
      // Load user-specific data (will be empty for new users)
      try {
        const { loadUserData } = await import('./bpStore');
        await loadUserData();
      } catch (error) {
        console.warn('Failed to load user data:', error);
      }
    } else {
      throw new Error(response.error || 'Registration failed');
    }
  } catch (error: any) {
    authState.error = error.message || 'Registration failed';
    console.error('Registration error:', error);
    throw error;
  } finally {
    authState.isLoading = false;
    notifyListeners();
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  authState.isLoading = true;
  notifyListeners();

  try {
    // Call logout endpoint if user is authenticated
    if (authState.isAuthenticated && authState.user) {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
        if (token) {
          await apiCall('auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch (error) {
        console.log('Server logout failed, continuing with local logout');
      }
    }

    // Clear local auth data
    await clearAuthStorage();
    
    // Clear user-specific data
    try {
      const { clearUserData } = await import('./bpStore');
      clearUserData();
    } catch (error) {
      console.warn('Failed to clear user data:', error);
    }
    
    authState.isAuthenticated = false;
    authState.user = null;
    authState.error = null;
    
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local data even if server call fails
    await clearAuthStorage();
    authState.isAuthenticated = false;
    authState.user = null;
  } finally {
    authState.isLoading = false;
    notifyListeners();
  }
};

// Update user profile
export const updateUserProfile = async (updates: Partial<User['profile']>): Promise<void> => {
  if (!authState.isAuthenticated || !authState.user) {
    throw new Error('User not authenticated');
  }

  authState.isLoading = true;
  notifyListeners();

  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    const response = await apiCall('auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ profile: updates }),
    });

    if (response.success) {
      const updatedUser = { ...authState.user, profile: { ...authState.user.profile, ...updates } };
      
      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      
      authState.user = updatedUser;
      console.log('Profile updated successfully');
    } else {
      throw new Error(response.error || 'Profile update failed');
    }
  } catch (error: any) {
    authState.error = error.message || 'Profile update failed';
    console.error('Profile update error:', error);
    throw error;
  } finally {
    authState.isLoading = false;
    notifyListeners();
  }
};

// Get current auth state
export const getAuthState = (): AuthState => ({ ...authState });

// Get current user
export const getCurrentUser = (): User | null => authState.user;

// Get user token
export const getUserToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
};

// Get remembered email for login
export const getRememberedEmail = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => authState.isAuthenticated;

// Clear auth error
export const clearAuthError = (): void => {
  authState.error = null;
  notifyListeners();
};

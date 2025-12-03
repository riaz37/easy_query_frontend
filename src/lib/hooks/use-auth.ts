import { useState, useEffect, useCallback, useMemo } from 'react';
import { ServiceRegistry } from '@/lib/api';
import { clearAllEasyQueryStorage } from '@/lib/utils/storage';
import type { 
  LoginRequest, 
  TokenResponse,
} from '@/lib/api';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: string;
  role: string | null;
  isAdmin: boolean;
}

interface AuthState {
  user: any | null; // User info from getCurrentUser
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

/**
 * Custom hook for managing authentication state and operations
 * Uses standardized AuthService from ServiceRegistry
 */
export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true during initialization
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); // Track if initial auth check is complete

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => {
    return !!user && !!tokens?.accessToken && !ServiceRegistry.auth.isTokenExpired(tokens.accessToken);
  }, [user, tokens]);

  // Clear auth data from localStorage
  const clearAuthStorage = useCallback(() => {
    try {
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
    } catch (error) {
      console.error('Failed to clear auth data from localStorage:', error);
    }
  }, []);

  // Save auth data to localStorage
  const saveAuthToStorage = useCallback((authTokens: AuthTokens, userData: any) => {
    try {
      localStorage.setItem('auth_tokens', JSON.stringify(authTokens));
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save auth data to localStorage:', error);
    }
  }, []);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = localStorage.getItem('auth_tokens');
        const storedUser = localStorage.getItem('auth_user');
        
        if (storedTokens && storedUser) {
          const parsedTokens: AuthTokens = JSON.parse(storedTokens);
          const parsedUser: any = JSON.parse(storedUser);
          
          // Check if token is still valid
          if (!ServiceRegistry.auth.isTokenExpired(parsedTokens.accessToken)) {
            setTokens(parsedTokens);
            setUser(parsedUser);
          } else {
            // Token expired, clear storage
            clearAuthStorage();
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth from localStorage:', error);
        clearAuthStorage();
      } finally {
        // Mark initialization as complete and stop loading
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [clearAuthStorage]);

  // Login function
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Login and get tokens
      const authResponse = await ServiceRegistry.auth.login(credentials);
      
      if (!authResponse.success) {
        // Normalize invalid credential errors for the UI
        const message = authResponse.error && /unauthorized|invalid|credentials|401/i.test(authResponse.error)
          ? 'Invalid user ID or password'
          : (authResponse.error || 'Login failed');
        throw new Error(message);
      }
      
      const tokenData: TokenResponse = authResponse.data;
      const authTokens: AuthTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type,
        userId: tokenData.user_id,
        role: tokenData.role,
        isAdmin: tokenData.is_admin,
      };

      // Store tokens immediately so subsequent requests include Authorization header
      setTokens(authTokens);
      try {
        localStorage.setItem('auth_tokens', JSON.stringify(authTokens));
      } catch (storageError) {
        console.warn('Failed to persist auth tokens:', storageError);
      }

      // Get current user info (requires Authorization header)
      const userResponse = await ServiceRegistry.auth.getCurrentUser();
      
      if (!userResponse.success) {
        throw new Error(userResponse.error || 'Failed to get user info');
      }

      // Update user state
      setUser(userResponse.data);

      // Save full auth state to storage
      saveAuthToStorage(authTokens, userResponse.data);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [saveAuthToStorage]);

  // Note: Signup is no longer available - users must be created by admins using createUser

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      // Call logout API to blacklist tokens (if we have tokens)
      if (tokens?.accessToken) {
        try {
          const logoutResponse = await ServiceRegistry.auth.logout(tokens.refreshToken);
          if (logoutResponse.success) {
            console.log('Tokens blacklisted successfully');
          }
        } catch (apiError) {
          // Even if API call fails, proceed with local logout
          console.warn('Logout API call failed, proceeding with local logout:', apiError);
        }
      }

      // Clear local state
      setUser(null);
      setTokens(null);
      setError(null);

      // Clear storage
      clearAuthStorage();
      clearAllEasyQueryStorage();

    } catch (err: any) {
      console.error('Logout error:', err);
      // Even on error, clear local state
      setUser(null);
      setTokens(null);
      clearAuthStorage();
      clearAllEasyQueryStorage();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthStorage, tokens]);

  // Change password function
  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<void> => {
    if (!tokens?.userId) {
      throw new Error('No user ID available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ServiceRegistry.auth.changePassword(tokens.userId, oldPassword, newPassword);
      
      if (!response.success) {
        throw new Error(response.error || 'Password change failed');
      }

      // Password changed successfully - no need to update tokens as they remain valid

    } catch (err: any) {
      const errorMessage = err.message || 'Password change failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tokens]);

  // Refresh user profile
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!tokens?.accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await ServiceRegistry.auth.getCurrentUser();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to refresh profile');
      }

      setUser(response.data);
      saveAuthToStorage(tokens, response.data);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to refresh profile';
      setError(errorMessage);
      
      // If token is invalid, logout
      if (err.statusCode === 401) {
        await logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [tokens, saveAuthToStorage, logout]);

  // Check token validity
  const checkTokenValidity = useCallback((): boolean => {
    if (!tokens?.accessToken) {
      return false;
    }

    return !ServiceRegistry.auth.isTokenExpired(tokens.accessToken);
  }, [tokens]);

  // Get user ID from token
  const getUserId = useCallback((): string | null => {
    if (!tokens?.accessToken) {
      return null;
    }

    return ServiceRegistry.auth.getUserIdFromToken(tokens.accessToken);
  }, [tokens]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auth state object
  const authState: AuthState = {
    user,
    tokens,
    isLoading,
    error,
    isAuthenticated,
  };

  return {
    // State
    ...authState,
    isInitialized,

    // Actions
    login,
    logout,
    changePassword,
    refreshProfile,

    // Utilities
    checkTokenValidity,
    getUserId,
    clearError,
    clearAuthStorage,
  };
} 
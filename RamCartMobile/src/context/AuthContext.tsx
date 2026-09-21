import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import { parseJwtUser } from '../utils/jwt';

export interface User {
  id?: string;
  name?: string;
  email?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string; status?: number }>;
  loginWithGoogle: (email: string, name: string, uid?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        setIsLoading(true);
        const storedToken = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const storedUserJson = await storage.getItem(STORAGE_KEYS.USER_DATA);

        if (storedToken) {
          setToken(storedToken);
          apiService.setAuthToken(storedToken);

          const jwtUser = parseJwtUser(storedToken);

          if (storedUserJson) {
            try {
              const parsedUser = JSON.parse(storedUserJson);
              setUser({
                ...parsedUser,
                isAdmin: jwtUser?.isAdmin ?? parsedUser.isAdmin ?? false,
              });
            } catch {
              setUser({
                email: jwtUser?.email || 'user@ramcart.com',
                name: jwtUser?.name || 'Shopper',
                isAdmin: jwtUser?.isAdmin || false,
              });
            }
          } else if (jwtUser) {
            setUser({
              email: jwtUser.email || 'user@ramcart.com',
              name: jwtUser.name || 'Shopper',
              isAdmin: jwtUser.isAdmin || false,
            });
          } else {
            setUser({ email: 'user@ramcart.com', name: 'Shopper', isAdmin: false });
          }
        }
      } catch (error) {
        console.error('Failed to restore auth token from secure storage', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    try {
      const response = await apiService.login(email, password);

      if (response.success && response.token) {
        const authToken = response.token;
        const jwtUser = parseJwtUser(authToken);

        const userData: User = {
          email: response.user?.email || jwtUser?.email || email.trim(),
          name: response.user?.name || jwtUser?.name || email.trim().split('@')[0],
          isAdmin: response.user?.isAdmin ?? jwtUser?.isAdmin ?? false,
        };

        await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, authToken);
        await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));

        apiService.setAuthToken(authToken);
        setToken(authToken);
        setUser(userData);

        return { success: true };
      }

      return {
        success: false,
        error: response.error || response.errors || 'Login failed. Please check your credentials.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'An error occurred during authentication.',
      };
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail || !password) {
      return { success: false, error: 'Full name, email, and password are required.' };
    }

    try {
      const response = await apiService.signup(trimmedUsername, trimmedEmail, password);

      if (response.success && response.token) {
        const authToken = response.token;
        const jwtUser = parseJwtUser(authToken);

        const userData: User = {
          email: response.user?.email || jwtUser?.email || trimmedEmail,
          name: response.user?.name || jwtUser?.name || trimmedUsername,
          isAdmin: response.user?.isAdmin ?? jwtUser?.isAdmin ?? false,
        };

        await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, authToken);
        await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));

        apiService.setAuthToken(authToken);
        setToken(authToken);
        setUser(userData);

        return { success: true };
      }

      const backendError =
        response.error ||
        response.errors ||
        (response.status ? `Backend responded with HTTP status ${response.status}` : 'Registration failed.');

      return {
        success: false,
        status: response.status,
        error: backendError,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'An unexpected network error occurred during registration.',
      };
    }
  };

  /**
   * Sync Google user with backend POST /auth/firebase-sync and store returned JWT token
   */
  const loginWithGoogle = async (email: string, name: string, uid?: string) => {
    if (!email) {
      return { success: false, error: 'Google email is required for sync.' };
    }

    try {
      const response = await apiService.firebaseSync(email, name, uid);

      if (response.success && response.token) {
        const authToken = response.token;
        const jwtUser = parseJwtUser(authToken);

        const userData: User = {
          email: response.user?.email || jwtUser?.email || email,
          name: response.user?.name || jwtUser?.name || name || email.split('@')[0],
          isAdmin: response.user?.isAdmin ?? jwtUser?.isAdmin ?? false,
        };

        await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, authToken);
        await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));

        apiService.setAuthToken(authToken);
        setToken(authToken);
        setUser(userData);

        return { success: true };
      }

      return {
        success: false,
        error: response.error || response.errors || 'Failed to sync Google user with backend.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'An unexpected error occurred during Google Sign-In.',
      };
    }
  };

  const logout = async () => {
    try {
      await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await storage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error removing token on logout', error);
    } finally {
      apiService.setAuthToken(null);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

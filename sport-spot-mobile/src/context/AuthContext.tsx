import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
const TOKEN_KEY = 'sportspot_auth_token';
const USER_KEY = 'sportspot_auth_user';

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
};

type LoginResult = {
  success: boolean;
  error?: string;
};

type LoginResponse = {
  success?: boolean;
  token?: unknown;
  user?: unknown;
  error?: unknown;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const authStorage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? null;
    }

    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string) {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AuthUser>;

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.email === 'string' &&
    typeof candidate.fullName === 'string' &&
    typeof candidate.role === 'string'
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to sign in. Please try again.';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          authStorage.getItem(TOKEN_KEY),
          authStorage.getItem(USER_KEY),
        ]);

        if (!isMounted) {
          return;
        }

        if (!storedToken || !storedUser) {
          setToken(null);
          setUser(null);
          return;
        }

        const parsedUser = JSON.parse(storedUser);

        if (isAuthUser(parsedUser)) {
          setToken(storedToken);
          setUser(parsedUser);
        } else {
          await Promise.all([
            authStorage.deleteItem(TOKEN_KEY),
            authStorage.deleteItem(USER_KEY),
          ]);
          setToken(null);
          setUser(null);
        }
      } catch {
        await Promise.all([
          authStorage.deleteItem(TOKEN_KEY),
          authStorage.deleteItem(USER_KEY),
        ]);

        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    if (!API_BASE_URL) {
      return {
        success: false,
        error: 'Missing EXPO_PUBLIC_API_BASE_URL configuration.',
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: typeof data.error === 'string' ? data.error : 'Invalid email or password.',
        };
      }

      if (typeof data.token !== 'string' || !isAuthUser(data.user)) {
        return {
          success: false,
          error: 'Unexpected login response. Please try again.',
        };
      }

      await Promise.all([
        authStorage.setItem(TOKEN_KEY, data.token),
        authStorage.setItem(USER_KEY, JSON.stringify(data.user)),
      ]);

      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      authStorage.deleteItem(TOKEN_KEY),
      authStorage.deleteItem(USER_KEY),
    ]);

    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isLoggedIn: Boolean(token && user),
      login,
      logout,
    }),
    [isLoading, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

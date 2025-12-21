import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AuthState, GoogleUserProfile } from '../shared/types';

interface GoogleAuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(null);

interface GoogleAuthProviderProps {
  children: ReactNode;
  authEndpoint?: string;
}

export function GoogleAuthProvider({ 
  children, 
  authEndpoint = '/api/auth' 
}: GoogleAuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch(`${authEndpoint}/session`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      
      const data = await response.json();
      
      setState({
        isAuthenticated: data.isAuthenticated,
        isLoading: false,
        user: data.user,
        error: null,
      });
    } catch (err) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [authEndpoint]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = useCallback(() => {
    window.location.href = `${authEndpoint}/google`;
  }, [authEndpoint]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${authEndpoint}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Logout failed',
      }));
    }
  }, [authEndpoint]);

  const value: GoogleAuthContextValue = {
    ...state,
    login,
    logout,
    refetch: fetchSession,
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth(): GoogleAuthContextValue {
  const context = useContext(GoogleAuthContext);
  
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  
  return context;
}

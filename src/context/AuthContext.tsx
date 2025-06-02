import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null; data: any | null }>;
}

const defaultContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  signUp: async () => ({ error: null, data: null }),
  signIn: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null, data: null }),
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Disable email confirmation for immediate sign in
          emailRedirectTo: `${window.location.origin}`,
          data: {
            emailConfirm: false
          }
        }
      });
      
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      return { error, data: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Check if we're rate limited and use throttling
      const lastAttemptTime = localStorage.getItem('lastAuthAttempt');
      const now = Date.now();
      const timeSinceLastAttempt = lastAttemptTime ? now - parseInt(lastAttemptTime) : Infinity;
      
      // If we've attempted auth within the last 3 seconds, delay to avoid rate limiting
      if (timeSinceLastAttempt < 3000) {
        await new Promise(resolve => setTimeout(resolve, 3000 - timeSinceLastAttempt));
      }
      
      // Store the current attempt time
      localStorage.setItem('lastAuthAttempt', now.toString());
      
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // If successful, clear any temporary rate limit markers
      if (!response.error) {
        localStorage.removeItem('authRateLimited');
      } else if (response.error.message?.includes('rate limit')) {
        // Mark that we've been rate limited
        localStorage.setItem('authRateLimited', 'true');
        localStorage.setItem('rateLimitTime', now.toString());
      }
      
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      return { error, data: null };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsLoading(false);
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    const response = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    return response;
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

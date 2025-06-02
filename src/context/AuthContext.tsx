import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { showSuccess, showError, showInfo } from '../utils/toast';

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
      // Add throttling for sign up as well to prevent rate limiting
      const lastSignupTime = localStorage.getItem('lastSignupAttempt');
      const now = Date.now();
      const timeSinceLastAttempt = lastSignupTime ? now - parseInt(lastSignupTime) : Infinity;
      
      if (timeSinceLastAttempt < 3000) {
        await new Promise(resolve => setTimeout(resolve, 3000 - timeSinceLastAttempt));
      }
      
      localStorage.setItem('lastSignupAttempt', now.toString());
      
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
      
      if (response.error) {
        // Let the Auth component handle the toast notification
        console.error('Signup error:', response.error.message);
      } else {
        console.log('Signup successful');
      }
      
      setIsLoading(false);
      return response;
    } catch (error) {
      console.error('Unexpected signup error:', error);
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
        console.log('Authentication successful');
      } else {
        // Better error logging based on error type - let Auth component handle the toast
        if (response.error.message?.includes('rate limit')) {
          console.error('Rate limit exceeded:', response.error.message);
          localStorage.setItem('authRateLimited', 'true');
          localStorage.setItem('rateLimitTime', now.toString());
        } else if (response.error.status === 400) {
          console.error('Authentication error (400):', response.error.message);
        } else if (response.error.status === 429) {
          console.error('Too many requests (429):', response.error.message);
        } else {
          console.error('Authentication error:', response.error);
        }
      }
      
      setIsLoading(false);
      return response;
    } catch (error) {
      console.error('Unexpected authentication error:', error);
      setIsLoading(false);
      return { error, data: null };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      showSuccess('You have been signed out successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('Sign out error:', error);
      showError('Error signing out. Please try again.');
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (response.error) {
        console.error('Password reset error:', response.error.message);
        // Let the Auth component handle the toast notification
      } else {
        console.log('Password reset email sent successfully');
      }
      
      setIsLoading(false);
      return response;
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      setIsLoading(false);
      return { error, data: null };
    }
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

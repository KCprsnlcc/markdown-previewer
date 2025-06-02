import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconMail, IconLock, IconBrandGithub, IconLogin, IconUserPlus } from '@tabler/icons-react';
import { showSuccess, showError } from '../utils/toast';

enum AuthMode {
  SignIn,
  SignUp,
  ForgotPassword
}

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>(AuthMode.SignIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // No longer using state for error/message display, using toasts instead
  const { signIn, signUp, resetPassword, isLoading } = useAuth();
  


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showError('Please fill in all fields');
      return;
    }

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          showError('Invalid email or password');
        } else if (error.message?.includes('Rate limit')) {
          showError('Too many attempts. Please try again later.');
        } else {
          showError(error.message || 'Authentication error');
        }
      }
    } catch (err) {
      showError('An unexpected error occurred. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      showError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        if (error.message?.includes('rate limit')) {
          showError('Too many signup attempts. Please try again later.');
        } else if (error.message?.includes('already registered')) {
          showError('This email is already registered. Please sign in instead.');
        } else {
          showError(error.message || 'Registration error');
        }
      } else {
        showSuccess('Sign up successful! You can now sign in with your credentials.');
        // Automatically switch to sign-in mode after successful signup
        setTimeout(() => {
          setMode(AuthMode.SignIn);
        }, 1000);
      }
    } catch (err) {
      showError('An unexpected error occurred. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showError('Please enter your email');
      return;
    }

    const { error } = await resetPassword(email);
    
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Check your email for a password reset link!');
      // Switch back to sign-in mode after 3 seconds
      setTimeout(() => {
        setMode(AuthMode.SignIn);
      }, 3000);
    }
  };

  const getContainerStyle = (): React.CSSProperties => ({
    maxWidth: '400px',
    width: '100%',
    margin: '0 auto',
    padding: '2rem',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-light)',
    boxShadow: 'var(--shadow-md)',
    color: 'var(--text-light)',
  });

  const getInputContainerStyle = (): React.CSSProperties => ({
    marginBottom: '1.25rem',
    position: 'relative',
  });

  const getInputStyle = (): React.CSSProperties => ({
    width: '100%',
    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    fontSize: '1rem',
    backgroundColor: 'var(--input-bg-light)',
    color: 'var(--text-light)',
    transition: 'border-color 0.3s ease',
  });

  const getIconStyle = (): React.CSSProperties => ({
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--primary-color)',
  });

  const getButtonStyle = (isPrimary: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: 'none',
    backgroundColor: isPrimary ? 'var(--primary-color)' : 'transparent',
    color: isPrimary ? '#fff' : 'var(--text-light)',
  });

  const getLinkStyle = (): React.CSSProperties => ({
    color: 'var(--primary-color)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
  });

  const renderSignIn = () => (
    <form onSubmit={handleSignIn}>
      <div style={getInputContainerStyle()}>
        <div style={getIconStyle()}>
          <IconMail size={18} />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={getInputStyle()}
          autoComplete="email"
        />
      </div>
      <div style={getInputContainerStyle()}>
        <div style={getIconStyle()}>
          <IconLock size={18} />
        </div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={getInputStyle()}
          autoComplete="current-password"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <a 
            onClick={() => setMode(AuthMode.ForgotPassword)} 
            style={getLinkStyle()}
          >
            Forgot password?
          </a>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <button 
          type="submit" 
          style={getButtonStyle(true)}
          disabled={isLoading}
        >
          <IconLogin size={18} />
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
        <button 
          type="button" 
          style={getButtonStyle(false)}
          onClick={() => setMode(AuthMode.SignUp)}
        >
          <IconUserPlus size={18} />
          Sign Up
        </button>
      </div>
    </form>
  );

  const renderSignUp = () => (
    <form onSubmit={handleSignUp}>
      <div style={getInputContainerStyle()}>
        <div style={getIconStyle()}>
          <IconMail size={18} />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={getInputStyle()}
          autoComplete="email"
        />
      </div>
      <div style={getInputContainerStyle()}>
        <div style={getIconStyle()}>
          <IconLock size={18} />
        </div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={getInputStyle()}
          autoComplete="new-password"
        />
      </div>
      <div style={getInputContainerStyle()}>
        <div style={getIconStyle()}>
          <IconLock size={18} />
        </div>
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={getInputStyle()}
          autoComplete="new-password"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
        <button 
          type="submit" 
          style={getButtonStyle(true)}
          disabled={isLoading}
        >
          <IconUserPlus size={18} />
          {isLoading ? 'Signing up...' : 'Create Account'}
        </button>
        <button 
          type="button" 
          style={getButtonStyle(false)}
          onClick={() => setMode(AuthMode.SignIn)}
        >
          <IconLogin size={18} />
          Sign In
        </button>
      </div>
    </form>
  );

  const renderForgotPassword = () => (
    <form onSubmit={handleResetPassword}>
      <div style={getInputContainerStyle()}>
        <div style={getIconStyle()}>
          <IconMail size={18} />
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={getInputStyle()}
          autoComplete="email"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
        <button 
          type="submit" 
          style={getButtonStyle(true)}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Reset Password'}
        </button>
        <button 
          type="button" 
          style={getButtonStyle(false)}
          onClick={() => setMode(AuthMode.SignIn)}
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      height: '100%',
      padding: '1rem',
      backgroundColor: 'var(--bg-light)'
    }}>
      <div style={getContainerStyle()}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 600, 
            marginBottom: '0.5rem',
            color: 'var(--primary-color)'
          }}>
            Markdown Previewer
          </h1>
          <p style={{ color: 'var(--text-light)', opacity: 0.8 }}>
            {mode === AuthMode.SignIn && 'Sign in to access your documents'}
            {mode === AuthMode.SignUp && 'Create an account to get started'}
            {mode === AuthMode.ForgotPassword && 'Reset your password'}
          </p>
        </div>

        {/* Removed error and success messages - now using toast notifications */}
        


        {mode === AuthMode.SignIn && renderSignIn()}
        {mode === AuthMode.SignUp && renderSignUp()}
        {mode === AuthMode.ForgotPassword && renderForgotPassword()}
      </div>
    </div>
  );
};

export default Auth;

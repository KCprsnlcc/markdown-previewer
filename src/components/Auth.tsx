import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconMail, IconLock, IconBrandGithub, IconLogin, IconUserPlus, IconArrowRight } from '@tabler/icons-react';
import { showSuccess, showError } from '../utils/toast';
import Logo from './Logo';

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
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  // No longer using state for error/message display, using toasts instead
  const { signIn, signUp, resetPassword, isLoading } = useAuth();
  
  // Check screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

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
    maxWidth: isSmallScreen ? '92%' : '460px',
    width: '100%',
    margin: '0 auto',
    padding: isSmallScreen ? '2rem 1.5rem' : '2.5rem',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--input-bg-light)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    color: 'var(--text-light)',
    animation: 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    border: '1px solid rgba(0, 0, 0, 0.05)'
  });

  const getInputContainerStyle = (): React.CSSProperties => ({
    marginBottom: '1.5rem',
    position: 'relative',
  });

  const getInputStyle = (): React.CSSProperties => ({
    width: '100%',
    padding: '0.85rem 1rem 0.85rem 3rem',
    borderRadius: '12px',
    border: '1.5px solid var(--border-color)',
    fontSize: '1rem',
    backgroundColor: 'white',
    color: 'var(--text-light)',
    transition: 'all var(--transition-normal)',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
  });

  const getIconStyle = (): React.CSSProperties => ({
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--primary-color)',
  });

  const getButtonStyle = (isPrimary: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: isPrimary ? '0.85rem 1.75rem' : '0.85rem 1.5rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    border: isPrimary ? 'none' : '1.5px solid var(--border-color)',
    backgroundColor: isPrimary ? 'var(--primary-color)' : 'transparent',
    color: isPrimary ? '#fff' : 'var(--text-light)',
    boxShadow: isPrimary ? '0 4px 10px rgba(var(--primary-rgb), 0.25)' : 'none'
  });

  const getLinkStyle = (): React.CSSProperties => ({
    color: 'var(--primary-color)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'color var(--transition-fast)',
  });

  const getButtonContainerStyle = (): React.CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    flexDirection: isSmallScreen ? 'column' : 'row'
  });

  const renderSignIn = () => (
    <form onSubmit={handleSignIn} className="slide-in">
      <div style={getInputContainerStyle()}>
        <div style={getIconStyle()}>
          <IconMail size={20} />
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
          <IconLock size={20} />
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <a 
            onClick={() => setMode(AuthMode.ForgotPassword)} 
            style={getLinkStyle()}
          >
            Forgot password?
          </a>
        </div>
      </div>
      <div style={getButtonContainerStyle()}>
        <button 
          type="submit" 
          style={getButtonStyle(true)}
          disabled={isLoading}
          className="hover-lift"
        >
          <IconLogin size={20} />
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
        <button 
          type="button" 
          style={getButtonStyle(false)}
          onClick={() => setMode(AuthMode.SignUp)}
        >
          <IconUserPlus size={20} />
          Sign Up
        </button>
      </div>
    </form>
  );

  const renderSignUp = () => (
    <form onSubmit={handleSignUp} className="slide-in">
      <div style={getInputContainerStyle()}>
        <div style={getIconStyle()}>
          <IconMail size={20} />
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
          <IconLock size={20} />
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
          <IconLock size={20} />
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
      <div style={getButtonContainerStyle()}>
        <button 
          type="submit" 
          style={getButtonStyle(true)}
          disabled={isLoading}
          className="hover-lift"
        >
          <IconUserPlus size={20} />
          {isLoading ? 'Signing up...' : 'Create Account'}
        </button>
        <button 
          type="button" 
          style={getButtonStyle(false)}
          onClick={() => setMode(AuthMode.SignIn)}
        >
          <IconLogin size={20} />
          Sign In
        </button>
      </div>
    </form>
  );

  const renderForgotPassword = () => (
    <form onSubmit={handleResetPassword} className="slide-in">
      <div style={getInputContainerStyle()}>
        <div style={getIconStyle()}>
          <IconMail size={20} />
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
      <div style={getButtonContainerStyle()}>
        <button 
          type="submit" 
          style={getButtonStyle(true)}
          disabled={isLoading}
          className="hover-lift"
        >
          <IconArrowRight size={20} />
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
      padding: '1.5rem',
      background: 'linear-gradient(145deg, var(--bg-light), #f1f3f9)'
    }} className="optimize-gpu">
      <div style={getContainerStyle()} className="bounce-in">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            marginBottom: '1.5rem', 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center' 
          }}>
            <Logo size="large" showText={true} />
          </div>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 600, 
            marginBottom: '0.75rem',
            background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color, #7c4dff))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {mode === AuthMode.SignIn && 'Sign In'}
            {mode === AuthMode.SignUp && 'Create Account'}
            {mode === AuthMode.ForgotPassword && 'Reset Password'}
          </h2>
          <p style={{ 
            color: 'var(--text-light)', 
            opacity: 0.8,
            fontSize: '1.1rem',
            maxWidth: '320px',
            margin: '0 auto'
          }} className="slide-in">
            {mode === AuthMode.SignIn && 'Welcome back! Sign in to access your documents'}
            {mode === AuthMode.SignUp && 'Join now to create and manage your markdown documents'}
            {mode === AuthMode.ForgotPassword && 'Enter your email to receive a reset link'}
          </p>
        </div>

        {mode === AuthMode.SignIn && renderSignIn()}
        {mode === AuthMode.SignUp && renderSignUp()}
        {mode === AuthMode.ForgotPassword && renderForgotPassword()}
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.7 }}>
          <p>The ultimate markdown editing experience</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;

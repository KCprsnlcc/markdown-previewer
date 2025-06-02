import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconMail, IconLock, IconBrandGithub, IconLogin, IconUserPlus } from '@tabler/icons-react';

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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<any | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testInProgress, setTestInProgress] = useState<boolean>(false);
  const { signIn, signUp, resetPassword, isLoading } = useAuth();
  
  // Function to test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      setTestInProgress(true);
      setTestResult('Testing Supabase connection...');
      
      // Import supabase client directly to test
      const { supabase } = await import('../supabase');
      
      // Test 1: Check if we can connect to Supabase at all
      const startTime = Date.now();
      const { data, error } = await supabase.from('markdown_documents').select('count').limit(1);
      const endTime = Date.now();
      
      if (error) {
        setTestResult(`Connection test failed: ${error.message}\nResponse time: ${endTime - startTime}ms`);
        setErrorDetails(error);
      } else {
        // Test 2: Try a simple auth operation
        const { error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          setTestResult(`Connected to database but auth test failed: ${authError.message}\nResponse time: ${endTime - startTime}ms`);
          setErrorDetails(authError);
        } else {
          setTestResult(`Supabase connection successful!\nResponse time: ${endTime - startTime}ms\nDatabase access: OK\nAuth service: OK`);
        }
      }
    } catch (err) {
      console.error('Test connection error:', err);
      setTestResult('Connection test failed with exception');
      setErrorDetails(err);
    } finally {
      setTestInProgress(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setErrorDetails(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const { error, data } = await signIn(email, password);
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (error.message?.includes('Rate limit')) {
          setError('Too many attempts. Please try again later.');
        } else {
          setError(error.message || 'Authentication error');
        }
      } else {
        // Removed console log
      }
    } catch (err) {
      setErrorDetails(err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setErrorDetails(null);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { error, data } = await signUp(email, password);
      
      if (error) {
        if (error.message?.includes('rate limit')) {
          setError('Too many signup attempts. Please try again later.');
        } else if (error.message?.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(error.message || 'Registration error');
        }
      } else {
        setMessage('Sign up successful! You can now sign in with your credentials.');
        // Automatically switch to sign-in mode after successful signup
        setTimeout(() => {
          setMode(AuthMode.SignIn);
          setMessage(null);
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Please enter your email');
      return;
    }

    const { error } = await resetPassword(email);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a password reset link!');
      // Switch back to sign-in mode after 3 seconds
      setTimeout(() => {
        setMode(AuthMode.SignIn);
        setMessage(null);
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

        {/* Error Message */}
        {error && (
          <div style={{ 
            padding: '0.75rem', 
            marginBottom: '1.5rem', 
            backgroundColor: '#FEE2E2', 
            color: '#B91C1C', 
            borderRadius: '8px',
            fontSize: '0.875rem'
          }}>
            {error}
            {debugMode && errorDetails && (
              <div style={{ 
                marginTop: '0.5rem', 
                backgroundColor: 'rgba(255,0,0,0.1)', 
                padding: '0.5rem', 
                borderRadius: '4px', 
                whiteSpace: 'pre-wrap', 
                fontSize: '0.75rem' 
              }}>
                <strong>Debug details:</strong><br />
                {JSON.stringify(errorDetails, null, 2)}
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div style={{ 
            padding: '0.75rem', 
            marginBottom: '1.5rem', 
            backgroundColor: '#ECFDF5', 
            color: '#047857', 
            borderRadius: '8px',
            fontSize: '0.875rem'
          }}>
            {message}
          </div>
        )}
        
        {/* Debug Toggle and Test Section */}
        <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
          <button 
            onClick={() => setDebugMode(!debugMode)}
            style={{
              background: 'none',
              border: 'none',
              textDecoration: 'underline',
              color: 'var(--text-light-secondary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              marginRight: '1rem'
            }}
          >
            {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
          
          {debugMode && (
            <button 
              onClick={testSupabaseConnection}
              disabled={testInProgress}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                color: 'var(--text-light-secondary)',
                cursor: testInProgress ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem'
              }}
            >
              {testInProgress ? 'Testing...' : 'Test Supabase Connection'}
            </button>
          )}
          
          {/* Test Results */}
          {debugMode && testResult && (
            <div style={{ 
              marginTop: '0.75rem',
              padding: '0.5rem',
              backgroundColor: 'var(--bg-dark)',
              color: 'var(--text-dark)',
              borderRadius: '4px',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              fontSize: '0.75rem',
              maxHeight: '150px',
              overflowY: 'auto'
            }}>
              {testResult}
            </div>
          )}
        </div>

        {mode === AuthMode.SignIn && renderSignIn()}
        {mode === AuthMode.SignUp && renderSignUp()}
        {mode === AuthMode.ForgotPassword && renderForgotPassword()}
      </div>
    </div>
  );
};

export default Auth;

import React, { useState } from 'react';
import { useDB } from '../context/DBContext';
import { supabase } from '../services/db';

export const Auth: React.FC = () => {
  const { signIn, signUp, isLoading, error } = useDB();
  const [isLogin, setIsLogin] = useState(true);
  
  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Field validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const isSupabase = !!supabase;

  const validate = () => {
    let isValid = true;

    // Email validation
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    // Name validation for signup
    if (!isLogin) {
      if (!fullName.trim()) {
        setNameError('Full name is required');
        isValid = false;
      } else if (fullName.trim().length < 2) {
        setNameError('Full name must be at least 2 characters');
        isValid = false;
      } else {
        setNameError('');
      }
    } else {
      setNameError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setLocalError('');

    if (!validate()) return;

    try {
      if (isLogin) {
        await signIn(email, password);
        setSuccessMessage('Successfully signed in!');
      } else {
        await signUp(email, password, fullName);
        setSuccessMessage('Successfully signed up! Logged into your new account.');
      }
    } catch (err: any) {
      console.error(err);
      setLocalError(err?.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmailError('');
    setPasswordError('');
    setNameError('');
    setLocalError('');
    setSuccessMessage('');
  };

  return (
    <div className="auth-container">
      <div className="md-card md-card--elevated auth-card">
        <div className="auth-header text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2.5" style={{ marginBottom: '12px' }}>
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
            {isLogin ? 'Sign in to manage family medication & orders' : 'Get started with collaborative medication tracking'}
          </p>
        </div>

        {/* Global Success / Error Alerts */}
        {successMessage && (
          <div className="md-alert md-alert--success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {(error || localError) && (
          <div className="md-alert md-alert--error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name field for Signup */}
          {!isLogin && (
            <div className="md-field-group">
              <label className="md-field-label">Full Name</label>
              <input
                type="text"
                className={`md-field ${nameError ? 'md-field--error' : ''}`}
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
              {nameError && <span className="md-field-error-text">{nameError}</span>}
            </div>
          )}

          {/* Email Address */}
          <div className="md-field-group">
            <label className="md-field-label">Email Address</label>
            <input
              type="email"
              className={`md-field ${emailError ? 'md-field--error' : ''}`}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            {emailError && <span className="md-field-error-text">{emailError}</span>}
          </div>

          {/* Password */}
          <div className="md-field-group">
            <label className="md-field-label">Password</label>
            <input
              type="password"
              className={`md-field ${passwordError ? 'md-field--error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {passwordError && <span className="md-field-error-text">{passwordError}</span>}
          </div>

          <button
            type="submit"
            className="md-btn md-btn--filled w-full mt-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Authenticating...
              </>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="auth-footer text-center mt-4">
          <button
            type="button"
            className="md-btn md-btn--text"
            onClick={toggleMode}
            disabled={isLoading}
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>

      {/* active database details card */}
      <div className="md-card md-card--filled db-status-card">
        <h4 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`status-dot ${isSupabase ? 'active' : 'mock'}`}></span>
          Active Database: {isSupabase ? 'Supabase cloud' : 'Mock (Local Storage)'}
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.4' }}>
          {isSupabase 
            ? 'The app is running on live cloud storage. Real passwords and emails must be used for signups.' 
            : 'Running offline mode. Mock credentials can be entered. Log in using "jane.doe@example.com" with password "password" to see pre-loaded demo data, or create a brand new account.'}
        </p>
      </div>

      <style>{`
        .auth-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          min-height: calc(100vh - 96px);
        }
        .auth-card {
          max-width: 440px;
          width: 100%;
          padding: 32px 24px;
        }
        .auth-header {
          margin-bottom: 24px;
        }
        .auth-form {
          margin-top: 16px;
        }
        .db-status-card {
          max-width: 440px;
          width: 100%;
          margin-top: 16px;
          padding: 16px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .status-dot.active {
          background-color: #2e7d32;
          box-shadow: 0 0 8px #4caf50;
        }
        .status-dot.mock {
          background-color: #f57c00;
          box-shadow: 0 0 8px #ffb74d;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
          display: inline-block;
          margin-right: 8px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/authService';

export default function Auth({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Per-field validation error states
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const validateForm = () => {
        const errors = {};

        if (!isLogin) {
            // Username validation
            if (!username.trim()) {
                errors.username = 'Username is required.';
            } else if (username.length < 3 || username.length > 20) {
                errors.username = 'Username must be between 3 and 20 characters.';
            } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                errors.username = 'Only letters, numbers, and underscores allowed.';
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            errors.email = 'Email is required.';
        } else if (!emailRegex.test(email)) {
            errors.email = 'Invalid email address format.';
        }

        // Password validation
        if (!password) {
            errors.password = 'Password is required.';
        } else if (!isLogin && password.length < 6) {
            errors.password = 'Password must be at least 6 characters long.';
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');
        setSuccessMessage('');

        // 1. Client-side validation check
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});

        // 2. Server request
        try {
            if (isLogin) {
                const data = await loginUser(email, password);
                setSuccessMessage(data.message || 'Login successful!');
                onLoginSuccess(data.username);
            } else {
                const data = await registerUser(username, email, password);
                setSuccessMessage(data.message || 'Registration successful! Please log in.');
                setIsLogin(true);
            }
        } catch (err) {
            // Handle backend response errors (e.g., username/email taken)
            const msg = err.message || '';
            if (msg.toLowerCase().includes('username')) {
                setFieldErrors({ username: msg });
            } else if (msg.toLowerCase().includes('email')) {
                setFieldErrors({ email: msg });
            } else {
                setGeneralError(msg || 'An unexpected error occurred.');
            }
        }
    };

    const handleSwitchMode = () => {
        setIsLogin(!isLogin);
        setFieldErrors({});
        setGeneralError('');
        setSuccessMessage('');
    };

    return (
        <div style={{
            maxWidth: '420px',
            margin: '40px auto',
            padding: '30px',
            background: 'rgba(26, 31, 44, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            color: '#e0e6ed'
        }}>
            <h2 style={{ 
                textAlign: 'center', 
                marginBottom: '24px', 
                fontSize: '1.5rem', 
                fontWeight: '600',
                color: '#fff',
                letterSpacing: '0.5px'
            }}>
                {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>
            
            {generalError && (
                <div style={{ 
                    background: 'rgba(211, 47, 47, 0.2)', 
                    border: '1px solid rgba(211, 47, 47, 0.4)', 
                    color: '#ff8a80', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    fontSize: '0.9rem'
                }}>
                    {generalError}
                </div>
            )}
            
            {successMessage && (
                <div style={{ 
                    background: 'rgba(46, 125, 50, 0.2)', 
                    border: '1px solid rgba(46, 125, 50, 0.4)', 
                    color: '#a5d6a7', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    fontSize: '0.9rem'
                }}>
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
                {!isLogin && (
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.9rem', 
                            color: fieldErrors.username ? '#ff8a80' : '#b0c4de', 
                            fontWeight: '500' 
                        }}>
                            Username
                        </label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: null });
                            }} 
                            placeholder="Choose a username"
                            style={{ 
                                width: '100%', 
                                padding: '10px 14px', 
                                boxSizing: 'border-box', 
                                borderRadius: '8px', 
                                border: fieldErrors.username ? '1px solid #ff5252' : '1px solid rgba(255, 255, 255, 0.15)',
                                background: fieldErrors.username ? 'rgba(255, 82, 82, 0.08)' : 'rgba(15, 20, 30, 0.6)',
                                color: '#fff',
                                fontSize: '0.95rem',
                                outline: 'none'
                            }}
                        />
                        {fieldErrors.username && (
                            <span style={{ fontSize: '0.75rem', color: '#ff8a80', marginTop: '4px', display: 'block' }}>
                                {fieldErrors.username}
                            </span>
                        )}
                    </div>
                )}
                
                <div style={{ marginBottom: '18px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '6px', 
                        fontSize: '0.9rem', 
                        color: fieldErrors.email ? '#ff8a80' : '#b0c4de', 
                        fontWeight: '500' 
                    }}>
                        Email
                    </label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                        }} 
                        placeholder="Enter your email"
                        style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            boxSizing: 'border-box', 
                            borderRadius: '8px', 
                            border: fieldErrors.email ? '1px solid #ff5252' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: fieldErrors.email ? 'rgba(255, 82, 82, 0.08)' : 'rgba(15, 20, 30, 0.6)',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none'
                        }}
                    />
                    {fieldErrors.email && (
                        <span style={{ fontSize: '0.75rem', color: '#ff8a80', marginTop: '4px', display: 'block' }}>
                            {fieldErrors.email}
                        </span>
                    )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '6px', 
                        fontSize: '0.9rem', 
                        color: fieldErrors.password ? '#ff8a80' : '#b0c4de', 
                        fontWeight: '500' 
                    }}>
                        Password
                    </label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                        }} 
                        placeholder="Enter your password"
                        style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            boxSizing: 'border-box', 
                            borderRadius: '8px', 
                            border: fieldErrors.password ? '1px solid #ff5252' : '1px solid rgba(255, 255, 255, 0.15)',
                            background: fieldErrors.password ? 'rgba(255, 82, 82, 0.08)' : 'rgba(15, 20, 30, 0.6)',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none'
                        }}
                    />
                    {fieldErrors.password && (
                        <span style={{ fontSize: '0.75rem', color: '#ff8a80', marginTop: '4px', display: 'block' }}>
                            {fieldErrors.password}
                        </span>
                    )}
                </div>

                <button type="submit" style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontWeight: '600', 
                    fontSize: '1rem',
                    cursor: 'pointer', 
                    marginBottom: '16px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease'
                }}>
                    {isLogin ? 'Log In' : 'Create Account'}
                </button>
            </form>

            <button 
                onClick={handleSwitchMode}
                style={{ 
                    width: '100%', 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#60a5fa', 
                    cursor: 'pointer', 
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    textAlign: 'center'
                }}
            >
                {isLogin ? "Don't have an account? Sign Up!" : 'Already have an account? Log In!'}
            </button>
        </div>
    );
}
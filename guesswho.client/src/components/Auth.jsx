import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/authService';

export default function Auth({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            if (isLogin) {
                const data = await loginUser(email, password);
                setSuccessMessage(data.message);
                onLoginSuccess(data.username);
            } else {
                const data = await registerUser(username, email, password);
                setSuccessMessage('Registration successful! Please log in.');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.message);
        }
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
            
            {error && (
                <div style={{ 
                    background: 'rgba(211, 47, 47, 0.2)', 
                    border: '1px solid rgba(211, 47, 47, 0.4)', 
                    color: '#ff8a80', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    fontSize: '0.9rem'
                }}>
                    {error}
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

            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#b0c4de', fontWeight: '500' }}>Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="Choose a username"
                            style={{ 
                                width: '100%', 
                                padding: '10px 14px', 
                                boxSizing: 'border-box', 
                                borderRadius: '8px', 
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                background: 'rgba(15, 20, 30, 0.6)',
                                color: '#fff',
                                fontSize: '0.95rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                )}
                
                <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#b0c4de', fontWeight: '500' }}>Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        placeholder="Enter your email"
                        style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            boxSizing: 'border-box', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            background: 'rgba(15, 20, 30, 0.6)',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#b0c4de', fontWeight: '500' }}>Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        placeholder="Enter your password"
                        style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            boxSizing: 'border-box', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            background: 'rgba(15, 20, 30, 0.6)',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none'
                        }}
                    />
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
                onClick={() => setIsLogin(!isLogin)}
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
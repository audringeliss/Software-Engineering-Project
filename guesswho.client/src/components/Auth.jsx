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
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: '#333' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{isLogin ? 'Log In to Guess Who?' : 'Create Account'}</h2>
            
            {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}
            {successMessage && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{successMessage}</div>}

            <form onSubmit={handleSubmit}>
                {!isLogin && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                )}
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <button type="submit" style={{ width: '100%', padding: '10px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                    {isLogin ? 'Log In' : 'Register'}
                </button>
            </form>

            <button 
                onClick={() => setIsLogin(!isLogin)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}
            >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Log In'}
            </button>
        </div>
    );
}
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiEye, FiEyeOff, FiMoon, FiSun } from 'react-icons/fi';
import '../index.css';
import './Auth.css';

function Auth({ onLoginSuccess, darkMode, toggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      const res = await fetch(`http://192.168.0.110:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      if (isLogin) onLoginSuccess(username);
      else {
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setError('¡Registro exitoso! Ahora inicia sesión.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg-gradient d-flex align-items-center justify-content-center min-vh-100">
      <div className="auth-card p-4 shadow-lg rounded-4">
        <h2 className="text-center fw-bold mb-2" style={{ letterSpacing: 1 }}>SecureChat</h2>
        <div className="auth-logo">
          {/* Logo SVG: candado + chat */}
          <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="25" width="40" height="25" rx="8" fill="#1A237E"/>
            <rect x="18" y="33" width="24" height="9" rx="4.5" fill="#fff"/>
            <path d="M20 25v-6a10 10 0 0120 0v6" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="30" cy="43" r="3" fill="#fff" stroke="#111" strokeWidth="2"/>
          </svg>
        </div>
        <form onSubmit={handleSubmit} className="mb-2">
          <div className="mb-3 position-relative">
            <span className="auth-icon"><FiUser size={22} /></span>
            <input
              type="text"
              className="form-control auth-input ps-5"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="mb-3 position-relative">
            <span className="auth-icon"><FiLock size={22} /></span>
            <input
              type="password"
              className="form-control auth-input ps-5"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className={`alert ${error.includes('exitoso') ? 'alert-success' : 'alert-danger'} py-2`}>{error}</div>}
          <button type="submit" className="btn btn-auth w-100 fw-bold mb-2" disabled={loading}>
            {loading ? (isLogin ? 'Iniciando...' : 'Registrando...') : (isLogin ? 'LOGIN' : 'REGISTRAR')}
          </button>
        </form>
        <div className="text-center">
          <button className="btn btn-link p-0" type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth; 
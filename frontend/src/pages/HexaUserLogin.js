import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/HexaUserAuth.css';

const API = process.env.REACT_APP_API_URL;

const HexaUserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API}/api/hexauser/login`, { email, password });
      localStorage.setItem('hexaUserToken', res.data.token);
      localStorage.setItem('hexaUserName', res.data.user.name);
      navigate('/hexauser/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="hu-auth-container">
      <div className="hu-auth-box">
        <div className="hu-auth-header">
          <img src="/hexa-logo.png" alt="Hexa Logo" className="hu-logo" />
          <h1>Hexamatics Login</h1>
          <p className="hu-subtitle">Sign in to access the Hexa IQ Test Platform</p>
        </div>
        <form onSubmit={handleLogin} className="hu-auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@hexamatics.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-hu-primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="hu-auth-footer">
          <Link to="/" className="hu-link">Admin login</Link>
        </div>
      </div>
    </div>
  );
};

export default HexaUserLogin;

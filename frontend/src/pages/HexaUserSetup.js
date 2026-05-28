import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/HexaUserAuth.css';

const API = process.env.REACT_APP_API_URL;

const HexaUserSetup = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validating, setValidating] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (!token || !emailParam) { setInvalid(true); setValidating(false); return; }
    axios.get(`${API}/api/hexauser/verify-setup?token=${token}&email=${encodeURIComponent(emailParam)}`)
      .then(res => { setName(res.data.name); setEmail(res.data.email); setValidating(false); })
      .catch(() => { setInvalid(true); setValidating(false); });
  }, []); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    try {
      await axios.post(`${API}/api/hexauser/setup-password`, { token, email, password });
      setSuccess('Password set! Redirecting to login...');
      setTimeout(() => navigate('/hexauser/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Setup failed');
    }
  };

  if (validating) return <div className="hu-auth-container"><div className="hu-auth-box"><p>Verifying your invitation...</p></div></div>;

  if (invalid) return (
    <div className="hu-auth-container">
      <div className="hu-auth-box">
        <div className="hu-auth-header">
          <img src="/hexa-logo.png" alt="Hexa Logo" className="hu-logo" />
        </div>
        <div className="error-message" style={{ textAlign: 'center', padding: '20px' }}>
          This setup link is invalid or has expired. Please ask admin to resend the invitation.
        </div>
      </div>
    </div>
  );

  return (
    <div className="hu-auth-container">
      <div className="hu-auth-box">
        <div className="hu-auth-header">
          <img src="/hexa-logo.png" alt="Hexa Logo" className="hu-logo" />
          <h1>Activate Your Account</h1>
          <p className="hu-subtitle">Welcome, {name}! Set a password to access the Hexa IQ Platform.</p>
        </div>
        <form onSubmit={handleSubmit} className="hu-auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} disabled />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button type="submit" className="btn-hu-primary">Activate Account</button>
        </form>
      </div>
    </div>
  );
};

export default HexaUserSetup;

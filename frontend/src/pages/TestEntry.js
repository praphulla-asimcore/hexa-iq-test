import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/TestEntry.css';

const TestEntry = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (token && emailParam) {
      setEmail(emailParam);
      verifyInvitation(token, emailParam);
    }
  }, [searchParams]);

  const verifyInvitation = async (token, invitationEmail) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/candidate/verify-invitation`,
        { token, email: invitationEmail }
      );
      localStorage.setItem('testToken', response.data.testToken);
      localStorage.setItem('candidateEmail', response.data.candidate.email);
      localStorage.setItem('candidateName', response.data.candidate.name);
      navigate('/test-interface');
    } catch (err) {
      setError(err.response?.data?.error || 'Invitation verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/candidate/start-test`,
        { email }
      );
      localStorage.setItem('testToken', response.data.testToken);
      localStorage.setItem('candidateEmail', email);
      navigate('/test-interface');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-entry-container">
      <div className="entry-box">
        <div className="entry-header">
          <img src="/hexa-logo.png" alt="Hexa Logo" className="logo" />
          <h1>Hexa IQ Test</h1>
        </div>

        <div className="instructions">
          <h2>Test Instructions</h2>
          <ul>
            <li>Total Questions: 60</li>
            <li>Full Marks: 60</li>
            <li>Time Limit: 45 minutes</li>
            <li>You cannot restart the test once started</li>
            <li>Window switching will be monitored</li>
          </ul>
        </div>

        <form onSubmit={handleStartTest} className="entry-form">
          <div className="form-group">
            <label>Enter Your Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-start" disabled={loading}>
            {loading ? 'Loading...' : 'Start Test'}
          </button>
        </form>

        <div className="warning">
          <strong>⚠️ Warning:</strong> This test monitors for suspicious activities including:
          <ul>
            <li>Switching between windows/tabs</li>
            <li>Opening developer tools</li>
            <li>Screen recording attempts</li>
            <li>Browser fingerprint changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestEntry;

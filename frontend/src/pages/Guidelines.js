import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Guidelines.css';

const page1Sections = [
  {
    title: 'Before You Start',
    icon: '📋',
    items: [
      'Ensure you are in a quiet, distraction-free environment',
      'Use a stable and reliable internet connection',
      'Do not use any reference materials, notes, or external tools',
      'Ensure your device is fully charged or connected to power',
      'Close all unnecessary browser tabs and applications before beginning',
    ],
  },
  {
    title: 'During the Test',
    icon: '⏱',
    items: [
      'Answer all questions to the best of your ability',
      'Navigate between questions using the Previous and Next buttons',
      'Track your progress using the Question Map on the right side panel',
      'The countdown timer is always visible in the top header',
      'All answers are auto-saved as you select them — no need to save manually',
    ],
  },
];

const page2Sections = [
  {
    title: 'Integrity & Anti-Cheating',
    icon: '🔒',
    items: [
      'This test is actively monitored for suspicious activities',
      'Do not switch browser tabs or application windows during the test',
      'Do not open developer tools (F12 or Ctrl+Shift+I / Cmd+Option+I)',
      'All suspicious behaviour is logged and reported to the administrator',
      'Violations may result in immediate disqualification from the assessment',
    ],
  },
  {
    title: 'Submission',
    icon: '✅',
    items: [
      'Click "Submit Test" when you have answered all questions',
      'The test will auto-submit when the timer reaches zero',
      'A confirmation prompt will appear before your final submission',
      'Once submitted, the test cannot be retaken',
      'You will see a confirmation page upon successful submission',
    ],
  },
  {
    title: 'Technical Requirements',
    icon: '💻',
    items: [
      'Use a modern browser: Chrome, Firefox, Safari, or Edge',
      'Disable browser extensions that may block or interfere with the test',
      'Ensure JavaScript is enabled in your browser settings',
      'Minimum recommended screen resolution: 1024 × 768',
      'Do not use mobile devices or tablets for this assessment',
    ],
  },
];

const Guidelines = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('testToken');

  useEffect(() => {
    if (!token) navigate('/test');
  }, [token, navigate]);

  const handleStartTest = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/candidate/begin-test`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem('testToken', response.data.testToken);
      navigate('/test-interface');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="guide-container">
      <div className="guide-box">
        <div className="guide-header">
          <img src="/hexa-logo.png" alt="Hexa Logo" className="logo" />
          <h1>Test Guidelines</h1>
          <div className="guide-steps">
            <span className={`guide-step-dot ${step === 1 ? 'active' : 'done'}`} />
            <span className="guide-step-line" />
            <span className={`guide-step-dot ${step === 2 ? 'active' : ''}`} />
          </div>
          <p className="guide-page-label">Page {step} of 2</p>
        </div>

        <div className="guide-sections">
          {(step === 1 ? page1Sections : page2Sections).map((section) => (
            <div key={section.title} className="guide-section">
              <div className="guide-section-title">
                <span className="guide-icon">{section.icon}</span>
                {section.title}
              </div>
              <ul className="guide-list">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {error && <div className="guide-error">{error}</div>}

        <div className="guide-footer">
          {step === 1 ? (
            <button className="btn-guide-next" onClick={() => setStep(2)}>
              Next →
            </button>
          ) : (
            <div className="guide-footer-row">
              <button className="btn-guide-back" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className="btn-guide-start"
                onClick={handleStartTest}
                disabled={loading}
              >
                {loading ? 'Starting…' : 'Start Test'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Guidelines;

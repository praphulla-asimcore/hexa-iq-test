import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TestResult.css';

const TestResult = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const submitted = localStorage.getItem('testSubmitted');
    if (!submitted) {
      navigate('/test');
      return;
    }
    setName(localStorage.getItem('candidateName') || '');
  }, [navigate]);

  const handleClose = () => {
    localStorage.clear();
    navigate('/test');
  };

  return (
    <div className="result-container">
      <div className="result-box">
        <div className="result-header">
          <img src="/hexa-logo.png" alt="Hexa Logo" className="logo" />
        </div>

        <div className="thankyou-content">
          <div className="checkmark">✓</div>
          <h1>Test Submitted!</h1>
          {name && <span className="candidate-name">Well done, {name}!</span>}
          <p className="thankyou-msg">
            Thank you for completing the Hexa IQ Test. Your responses have been recorded and will be reviewed by our team.
          </p>
          <p className="followup-msg">
            We appreciate your time and effort. All the best — we will be in touch with you soon!
          </p>
          <div className="result-footer-note">
            <span>🔒 Your submission has been securely saved.</span>
          </div>
        </div>

        <button onClick={handleClose} className="btn-close">Done</button>
      </div>
    </div>
  );
};

export default TestResult;

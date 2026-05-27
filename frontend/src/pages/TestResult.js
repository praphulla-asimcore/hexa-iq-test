import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TestResult.css';

const TestResult = () => {
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const resultData = localStorage.getItem('testResult');
    if (resultData) {
      setResult(JSON.parse(resultData));
    } else {
      navigate('/test');
    }
  }, [navigate]);

  const handleClose = () => {
    localStorage.clear();
    navigate('/test');
  };

  if (!result) {
    return <div className="loading">Loading result...</div>;
  }

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const grade = getGrade(result.percentage);

  return (
    <div className="result-container">
      <div className="result-box">
        <div className="result-header">
          <img src="/hexa-logo.png" alt="Hexa Logo" className="logo" />
          <h1>Test Submitted Successfully</h1>
        </div>

        <div className="result-content">
          <div className="result-summary">
            <div className="result-item">
              <span className="label">Total Marks:</span>
              <span className="value">{result.totalMarks}/60</span>
            </div>
            <div className="result-item">
              <span className="label">Percentage:</span>
              <span className="value">{result.percentage.toFixed(2)}%</span>
            </div>
            <div className="result-item">
              <span className="label">Grade:</span>
              <span className={`value grade grade-${grade}`}>{grade}</span>
            </div>
            <div className="result-item">
              <span className="label">Time Taken:</span>
              <span className="value">{Math.floor(result.timeTaken / 60)} minutes {result.timeTaken % 60} seconds</span>
            </div>
          </div>

          <div className="result-message">
            {grade === 'A' && <p>🎉 Excellent performance! You've done exceptionally well.</p>}
            {grade === 'B' && <p>✅ Good job! Your performance is above average.</p>}
            {grade === 'C' && <p>✅ You've passed. Keep practicing to improve further.</p>}
            {grade === 'D' && <p>You've passed. We encourage you to review and practice.</p>}
            {grade === 'F' && <p>Please try again. Focus on improving your skills.</p>}
          </div>

          <div className="fingerprint-section">
            <h3>Test Verification</h3>
            <div className="fingerprint-info">
              <strong>Test Submitted At:</strong> {new Date(result.submittedAt).toLocaleString()}
            </div>
            {result.suspiciousActivities && result.suspiciousActivities.length > 0 && (
              <div className="suspicious-activities">
                <h4>⚠️ Activities Detected:</h4>
                <ul>
                  {result.suspiciousActivities.map((activity, idx) => (
                    <li key={idx}>
                      {activity.activity} - {activity.details}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button onClick={handleClose} className="btn-close">
              Close
            </button>
          </div>
        </div>

        <div className="result-footer">
          <p>Thank you for taking the Hexa IQ Test</p>
          <p>Your results have been securely recorded</p>
        </div>
      </div>
    </div>
  );
};

export default TestResult;

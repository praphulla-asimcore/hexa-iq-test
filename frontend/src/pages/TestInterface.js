import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/TestInterface.css';

const TestInterface = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes in seconds
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [browserFingerprint, setBrowserFingerprint] = useState('');
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const windowFocusRef = useRef(true);

  const token = localStorage.getItem('testToken');

  // Generate browser fingerprint
  useEffect(() => {
    generateFingerprint();
  }, []);

  const generateFingerprint = () => {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date().getTime()
    };
    const fingerprintString = JSON.stringify(fingerprint);
    setBrowserFingerprint(fingerprintString);
  };

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!token) {
        navigate('/test');
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/test/questions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQuestions(response.data);
        setTestStarted(true);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching questions:', err);
        navigate('/test');
      }
    };

    fetchQuestions();
  }, [token, navigate]);

  // Anti-cheating monitoring
  useEffect(() => {
    const handleWindowBlur = () => {
      windowFocusRef.current = false;
      const activity = {
        timestamp: new Date(),
        activity: 'Window lost focus',
        details: 'User switched to another window/tab'
      };
      setSuspiciousActivities(prev => [...prev, activity]);
      logActivityToServer(activity);
    };

    const handleWindowFocus = () => {
      windowFocusRef.current = true;
    };

    const handleKeyDown = (e) => {
      // Detect developer tools
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        const activity = {
          timestamp: new Date(),
          activity: 'Developer tools detected',
          details: 'Attempt to open developer tools'
        };
        setSuspiciousActivities(prev => [...prev, activity]);
        logActivityToServer(activity);
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const logActivityToServer = async (activity) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/test/log-activity`,
        {
          activity: activity.activity,
          details: activity.details,
          timestamp: activity.timestamp
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  // Timer
  useEffect(() => {
    if (!testStarted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [testStarted]);

  const handleSelectAnswer = (questionId, option) => {
    setAnswers({
      ...answers,
      [questionId]: option
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  const handleSubmitTest = async () => {
    if (window.confirm('Are you sure you want to submit the test?')) {
      setLoading(true);
      try {
        const testAnswers = questions.map(q => ({
          questionId: q.id,
          selectedAnswer: answers[q.id] || ''
        }));

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/results/submit`,
          {
            answers: testAnswers,
            timeTaken: 45 * 60 - timeLeft,
            browserFingerprint,
            suspiciousActivities
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        localStorage.setItem('testResult', JSON.stringify(response.data));
        navigate('/result');
      } catch (err) {
        alert('Error submitting test: ' + (err.response?.data?.error || err.message));
        setLoading(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading">Loading test questions...</div>;
  }

  if (questions.length === 0) {
    return <div className="loading">No questions available</div>;
  }

  const question = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="test-interface">
      <div className="test-header">
        <div className="header-info">
          <h2>IQ Test</h2>
          <div className="timer" style={{ color: timeLeft < 300 ? 'red' : 'green' }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>
        <div className="progress-info">
          Question {currentQuestion + 1} of {questions.length}
          <br />
          Answered: {answeredCount}/{questions.length}
        </div>
      </div>

      <div className="test-container">
        <div className="test-content">
          <div className="question-section">
            <h3>{question.question}</h3>
            <div className="options">
              {question.options.map((option, idx) => (
                <label key={idx} className="option-label">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() => handleSelectAnswer(question.id, option)}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="question-navigation">
            <button 
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              className="btn-nav"
            >
              ← Previous
            </button>
            <button 
              onClick={handleNextQuestion}
              disabled={currentQuestion === questions.length - 1}
              className="btn-nav"
            >
              Next →
            </button>
          </div>

          <div className="submit-section">
            <button onClick={handleSubmitTest} className="btn-submit">
              Submit Test
            </button>
          </div>
        </div>

        <div className="question-map">
          <h4>Question Map</h4>
          <div className="question-grid">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                className={`question-btn ${answers[q.id] ? 'answered' : ''} ${idx === currentQuestion ? 'current' : ''}`}
                onClick={() => handleJumpToQuestion(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {suspiciousActivities.length > 0 && (
        <div className="warning-box">
          ⚠️ {suspiciousActivities.length} suspicious activity/activities detected
        </div>
      )}
    </div>
  );
};

export default TestInterface;

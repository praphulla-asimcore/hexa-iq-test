import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import WebcamProctor from '../components/WebcamProctor';
import '../styles/TestInterface.css';

const TestInterface = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceOk, setFaceOk] = useState(false);
  const [browserFingerprint, setBrowserFingerprint] = useState('');
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const windowFocusRef = useRef(true);

  const token = localStorage.getItem('testToken');

  useEffect(() => {
    generateFingerprint();
  }, []);

  const generateFingerprint = () => {
    const fp = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date().getTime(),
    };
    setBrowserFingerprint(JSON.stringify(fp));
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!token) { navigate('/test'); return; }
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/test/questions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setQuestions(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching questions:', err);
        navigate('/test');
      }
    };
    fetchQuestions();
  }, [token, navigate]);

  // Window / devtools anti-cheat (only active once test is started)
  useEffect(() => {
    if (!testStarted) return;

    const handleWindowBlur = () => {
      windowFocusRef.current = false;
      const activity = {
        timestamp: new Date(),
        activity: 'Window lost focus',
        details: 'Candidate switched to another window or tab',
      };
      setSuspiciousActivities(prev => [...prev, activity]);
      logActivityToServer(activity);
    };

    const handleWindowFocus = () => { windowFocusRef.current = true; };

    const handleKeyDown = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key))) {
        e.preventDefault();
        const activity = {
          timestamp: new Date(),
          activity: 'Developer tools detected',
          details: 'Attempt to open browser developer tools',
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
  }, [testStarted]);

  const logActivityToServer = async (activity) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/test/log-activity`,
        { activity: activity.activity, details: activity.details, timestamp: activity.timestamp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  // Called by WebcamProctor whenever a suspicious camera event fires
  const handleCameraFlag = useCallback((event) => {
    setSuspiciousActivities(prev => [...prev, event]);
    logActivityToServer(event);
  }, [token]);

  // Timer — starts only when testStarted is true
  useEffect(() => {
    if (!testStarted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [testStarted]);

  const handleSelectAnswer = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const handleJumpToQuestion = (index) => setCurrentQuestion(index);

  const submitTest = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm('Are you sure you want to submit the test?')) return;
    setLoading(true);
    try {
      const testAnswers = questions.map(q => ({
        questionId: q.id,
        questionText: q.question,
        selectedAnswer: answers[q.id] || '',
      }));
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/results/submit`,
        { answers: testAnswers, timeTaken: 45 * 60 - timeLeft, browserFingerprint, suspiciousActivities },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem('testSubmitted', 'true');
      navigate('/result');
    } catch (err) {
      alert('Error submitting test: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) return <div className="loading">Loading test questions…</div>;
  if (questions.length === 0) return <div className="loading">No questions available</div>;

  // ─── Camera setup gate ────────────────────────────────────────────────────

  if (!testStarted) {
    return (
      <div>
        <WebcamProctor
          onFlag={handleCameraFlag}
          onReady={() => setCameraReady(true)}
          onStatusChange={(status) => setFaceOk(status === 'ok')}
          compact={false}
        />

        {cameraReady && (
          <div className="wcp-start-overlay">
            <div className="wcp-start-hint">
              {faceOk
                ? 'Camera is ready. You may start the test.'
                : 'Position your face clearly in the camera before starting.'}
            </div>
            <button
              className="btn-start-test"
              disabled={!faceOk}
              onClick={() => setTestStarted(true)}
              style={{ opacity: faceOk ? 1 : 0.45, cursor: faceOk ? 'pointer' : 'not-allowed' }}
            >
              Start Test →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Active test ──────────────────────────────────────────────────────────

  const question = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="test-interface">
      {/* Compact webcam widget — stays active through entire test */}
      <WebcamProctor onFlag={handleCameraFlag} compact={true} />

      <div className="test-header">
        <div className="header-info">
          <img src="/hexa-logo.png" alt="Hexa" className="header-logo" />
          <h2>Hexa IQ Test</h2>
          <div className={`timer${timeLeft < 300 ? ' danger' : ''}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
        <div className="progress-info">
          <strong>Question {currentQuestion + 1} / {questions.length}</strong>
          <br />
          Answered: {answeredCount} of {questions.length}
        </div>
      </div>

      <div className="test-container">
        <div className="test-content">
          <div className="question-section">
            <div className="question-number">Question {currentQuestion + 1}</div>
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
              className="btn-nav btn-nav-prev"
            >
              ← Previous
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestion === questions.length - 1}
              className="btn-nav btn-nav-next"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="question-map">
          <h4>Question Map</h4>
          <div className="map-legend">
            <span className="legend-answered">Done</span>
            <span className="legend-current">Current</span>
            <span className="legend-blank">Blank</span>
          </div>
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
          <div className="map-submit">
            <button onClick={() => submitTest()} className="btn-submit">
              Submit Test
            </button>
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

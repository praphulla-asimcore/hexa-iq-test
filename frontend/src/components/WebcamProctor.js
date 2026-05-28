import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import './WebcamProctor.css';

const MODEL_URL      = 'https://justadudewhohacks.github.io/face-api.js/models';
const DETECT_INTERVAL = 1000;
const STREAK_NEEDED   = 3;
const EVENT_COOLDOWN  = 5000;
const SCAN_NEEDED     = 2;

const SCAN_STEPS = ['front', 'right', 'left'];
const SCAN_GAZE  = { front: 'ok', right: 'right', left: 'left' };
const SCAN_INSTRUCTIONS = {
  front: 'Look straight at the camera',
  right: 'Slowly turn your head to the right',
  left:  'Slowly turn your head to the left',
};
const SCAN_ICONS  = { front: '😐', right: '→', left: '←' };
const SCAN_LABELS = { front: 'Front', right: 'Right', left: 'Left' };

const STATUS_LABELS = {
  ok:       'Face detected',
  none:     'No face visible',
  left:     'Looking left',
  right:    'Looking right',
  down:     'Looking down',
  multiple: 'Multiple faces',
  loading:  'Initializing…',
};

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

const WebcamProctor = ({ onFlag, onReady, onStatusChange, compact = false }) => {
  const videoRef      = useRef(null);
  const streamRef     = useRef(null);
  const loopRef       = useRef(null);
  const cooldownRef   = useRef({});
  const streakRef     = useRef({ noFace: 0, away: 0 });
  // scan state tracked in a ref so the setInterval closure always reads fresh values
  const scanRef       = useRef({ stepIdx: 0, count: 0, done: compact });
  const onReadyFired  = useRef(false);
  // always-fresh callback refs — avoids adding unstable props to useCallback deps
  const onReadyRef    = useRef(onReady);
  const onFlagRef     = useRef(onFlag);
  const onStatusRef   = useRef(onStatusChange);
  onReadyRef.current  = onReady;
  onFlagRef.current   = onFlag;
  onStatusRef.current = onStatusChange;

  const [phase,       setPhase]       = useState('loading');
  const [error,       setError]       = useState(null);
  const [faceStatus,  setFaceStatus]  = useState('loading');
  const [modelsOk,    setModelsOk]    = useState(false);
  const [scanStepIdx, setScanStepIdx] = useState(0);
  const [scanCount,   setScanCount]   = useState(0);
  const [stepDone,    setStepDone]    = useState([false, false, false]);
  const [scanDone,    setScanDone]    = useState(compact);

  const fire = useCallback((activity, details) => {
    const now = Date.now();
    if (now - (cooldownRef.current[activity] || 0) < EVENT_COOLDOWN) return;
    cooldownRef.current[activity] = now;
    onFlagRef.current?.({ timestamp: new Date(), activity, details });
  }, []);

  const estimateGaze = useCallback((detection) => {
    const pts     = detection.landmarks.positions;
    const lEye    = pts.slice(36, 42);
    const rEye    = pts.slice(42, 48);
    const lecX    = mean(lEye.map(p => p.x));
    const lecY    = mean(lEye.map(p => p.y));
    const recX    = mean(rEye.map(p => p.x));
    const recY    = mean(rEye.map(p => p.y));
    const eyeMidX = (lecX + recX) / 2;
    const eyeMidY = (lecY + recY) / 2;
    const iod     = Math.hypot(recX - lecX, recY - lecY);

    if (iod < 12) return 'ok';

    const nose       = pts[30];
    const yaw        = (nose.x - eyeMidX) / iod;
    const pitchRatio = (nose.y - eyeMidY) / iod;

    if (yaw > 0.60)        return 'right';
    if (yaw < -0.60)       return 'left';
    if (pitchRatio < 0.45) return 'down';
    return 'ok';
  }, []);

  const startLoop = useCallback(() => {
    loopRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.paused) return;

      try {
        const dets = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.35 }))
          .withFaceLandmarks(true);

        // ── Guided scan phase (setup screen only) ─────────────────────────
        if (!scanRef.current.done) {
          if (dets.length === 0) {
            scanRef.current.count = 0;
            setScanCount(0);
            setFaceStatus('none');
            return;
          }
          if (dets.length > 1) {
            setFaceStatus('multiple');
            return;
          }

          const gaze     = estimateGaze(dets[0]);
          const required = SCAN_GAZE[SCAN_STEPS[scanRef.current.stepIdx]];
          setFaceStatus(gaze);

          if (gaze === required) {
            const next = scanRef.current.count + 1;
            scanRef.current.count = next;
            setScanCount(next);

            if (next >= SCAN_NEEDED) {
              const finishedIdx = scanRef.current.stepIdx;
              setStepDone(prev => {
                const copy = [...prev];
                copy[finishedIdx] = true;
                return copy;
              });

              const nextStep = finishedIdx + 1;
              if (nextStep >= SCAN_STEPS.length) {
                scanRef.current.done = true;
                setScanDone(true);
                if (!onReadyFired.current) {
                  onReadyFired.current = true;
                  onReadyRef.current?.();
                }
              } else {
                scanRef.current.stepIdx = nextStep;
                scanRef.current.count   = 0;
                setScanStepIdx(nextStep);
                setScanCount(0);
              }
            }
          } else {
            scanRef.current.count = 0;
            setScanCount(0);
          }
          return;
        }

        // ── Normal proctoring ─────────────────────────────────────────────
        if (dets.length === 0) {
          streakRef.current.noFace++;
          streakRef.current.away = 0;
          setFaceStatus('none');
          onStatusRef.current?.('none');
          if (streakRef.current.noFace >= STREAK_NEEDED) {
            fire('No face detected', 'Candidate not visible in camera frame during the test');
          }
          return;
        }

        streakRef.current.noFace = 0;

        if (dets.length > 1) {
          setFaceStatus('multiple');
          fire('Multiple faces detected', 'More than one person is visible in the camera');
          return;
        }

        const gaze = estimateGaze(dets[0]);
        setFaceStatus(gaze);
        onStatusRef.current?.(gaze);

        if (gaze !== 'ok') {
          streakRef.current.away++;
          if (streakRef.current.away >= STREAK_NEEDED) {
            const evts = {
              left:  ['Face turned left',  'Candidate is looking to the left — possible second screen or assistance'],
              right: ['Face turned right', 'Candidate is looking to the right — possible second screen or assistance'],
              down:  ['Face looking down', 'Candidate is looking down — possible phone or notes use'],
            };
            if (evts[gaze]) fire(evts[gaze][0], evts[gaze][1]);
          }
        } else {
          streakRef.current.away = 0;
        }
      } catch {
        // skip frame silently
      }
    }, DETECT_INTERVAL);
  }, [fire, estimateGaze]);

  useEffect(() => {
    let alive = true;

    const init = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);
        if (!alive) return;
        setModelsOk(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setPhase('ready');
        setFaceStatus('none');

        // Compact mode skips scan — fire onReady immediately
        if (compact && !onReadyFired.current) {
          onReadyFired.current = true;
          onReadyRef.current?.();
        }

        startLoop();
      } catch (err) {
        if (!alive) return;
        setPhase('error');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera access was denied. Please allow camera permission in your browser and refresh the page.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a webcam and refresh the page.');
        } else {
          setError('Camera setup failed: ' + err.message);
        }
      }
    };

    init();

    return () => {
      alive = false;
      clearInterval(loopRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startLoop, compact]);

  // ── Compact widget (during test) ─────────────────────────────────────────
  if (compact) {
    return (
      <div className={`wcp-widget wcp-status-${faceStatus}`}>
        <video ref={videoRef} playsInline muted className="wcp-widget-video" />
        <div className="wcp-widget-overlay">
          <span className="wcp-widget-dot" />
          <span className="wcp-widget-label">CAM</span>
        </div>
        {faceStatus !== 'ok' && faceStatus !== 'loading' && (
          <div className="wcp-widget-warning">
            {STATUS_LABELS[faceStatus] ?? faceStatus}
          </div>
        )}
      </div>
    );
  }

  // ── Setup screen ─────────────────────────────────────────────────────────
  return (
    <div className="wcp-setup">
      <div className="wcp-card">
        <div className="wcp-card-header">
          <div className="wcp-camera-icon">📷</div>
          <h2 className="wcp-title">Camera Verification Required</h2>
          <p className="wcp-subtitle">
            Complete the face scan below to verify your identity before starting.
            Your webcam will remain active throughout the entire test.
          </p>
        </div>

        <div className="wcp-preview-container">
          {phase === 'loading' && (
            <div className="wcp-preview-placeholder">
              <div className="wcp-spinner" />
              <p>Loading face detection models…</p>
            </div>
          )}
          {phase === 'error' && (
            <div className="wcp-preview-placeholder wcp-preview-error">
              <div className="wcp-error-icon">⚠️</div>
              <p>{error}</p>
              <button className="wcp-retry-btn" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`wcp-preview-video${phase === 'ready' ? ' visible' : ''}`}
          />
          {phase === 'ready' && (
            <div className={`wcp-face-badge wcp-face-${faceStatus}`}>
              {STATUS_LABELS[faceStatus] ?? 'Checking…'}
            </div>
          )}
        </div>

        {/* Guided scan progress */}
        {phase === 'ready' && !scanDone && (
          <div className="wcp-scan">
            <div className="wcp-scan-steps">
              {SCAN_STEPS.map((step, idx) => (
                <React.Fragment key={step}>
                  <div className={`wcp-scan-step${stepDone[idx] ? ' done' : ''}${idx === scanStepIdx && !stepDone[idx] ? ' active' : ''}`}>
                    <div className="wcp-scan-step-circle">
                      {stepDone[idx] ? '✓' : SCAN_ICONS[step]}
                    </div>
                    <div className="wcp-scan-step-label">{SCAN_LABELS[step]}</div>
                  </div>
                  {idx < SCAN_STEPS.length - 1 && (
                    <div className={`wcp-scan-connector${stepDone[idx] ? ' done' : ''}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="wcp-scan-instruction">
              {SCAN_INSTRUCTIONS[SCAN_STEPS[scanStepIdx]]}
            </div>
            <div className="wcp-scan-bar">
              <div
                className="wcp-scan-bar-fill"
                style={{ width: `${Math.min((scanCount / SCAN_NEEDED) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Post-scan checklist */}
        {phase === 'ready' && scanDone && (
          <div className="wcp-checklist">
            <div className="wcp-check-item done">
              <span className="wcp-check-icon">✓</span>
              Face detection active
            </div>
            <div className="wcp-check-item done">
              <span className="wcp-check-icon">✓</span>
              Liveness scan complete — you may start the test
            </div>
          </div>
        )}

        <div className="wcp-rules">
          <p className="wcp-rules-title">During the test, the following will be flagged:</p>
          <ul>
            <li>Face not visible in camera</li>
            <li>Looking left or right (away from screen)</li>
            <li>Looking down (possible phone use)</li>
            <li>More than one face in frame</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WebcamProctor;

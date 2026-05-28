import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import './WebcamProctor.css';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const DETECT_INTERVAL = 1500;
const STREAK_NEEDED = 3;      // consecutive bad detections before firing event (~4.5s)
const EVENT_COOLDOWN = 30000; // ms before same event type can fire again

const STATUS_LABELS = {
  ok: 'Face detected',
  none: 'No face visible',
  left: 'Looking left',
  right: 'Looking right',
  down: 'Looking down',
  multiple: 'Multiple faces',
  loading: 'Initializing…',
};

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

const WebcamProctor = ({ onFlag, onReady, onStatusChange, compact = false }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const cooldownRef = useRef({});
  const streakRef = useRef({ noFace: 0, away: 0 });

  const [phase, setPhase] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [faceStatus, setFaceStatus] = useState('loading');
  const [modelsOk, setModelsOk] = useState(false);

  const fire = useCallback((activity, details) => {
    const now = Date.now();
    if (now - (cooldownRef.current[activity] || 0) < EVENT_COOLDOWN) return;
    cooldownRef.current[activity] = now;
    onFlag?.({ timestamp: new Date(), activity, details });
  }, [onFlag]);

  const estimateGaze = useCallback((detection) => {
    const pts = detection.landmarks.positions;
    const lEye = pts.slice(36, 42);
    const rEye = pts.slice(42, 48);
    const lecX = mean(lEye.map(p => p.x));
    const lecY = mean(lEye.map(p => p.y));
    const recX = mean(rEye.map(p => p.x));
    const recY = mean(rEye.map(p => p.y));
    const eyeMidX = (lecX + recX) / 2;
    const eyeMidY = (lecY + recY) / 2;
    const iod = Math.hypot(recX - lecX, recY - lecY);

    if (iod < 12) return 'ok'; // too small / noisy

    const nose = pts[30]; // nose tip (68-point model)

    // YAW: nose horizontal displacement from eye midpoint, normalized by IOD
    // positive = nose right of eye midpoint = head turned right
    const yaw = (nose.x - eyeMidX) / iod;

    // PITCH DOWN: when head tilts down, nose rises toward eye level
    // so (nose.y - eyeMid.y) / iod decreases below normal ~1.0–1.4
    const pitchRatio = (nose.y - eyeMidY) / iod;

    if (yaw > 0.60) return 'right';
    if (yaw < -0.60) return 'left';
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

        if (dets.length === 0) {
          streakRef.current.noFace++;
          streakRef.current.away = 0;
          setFaceStatus('none');
          onStatusChange?.('none');
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
        onStatusChange?.(gaze);

        if (gaze !== 'ok') {
          streakRef.current.away++;
          if (streakRef.current.away >= STREAK_NEEDED) {
            const evts = {
              left: ['Face turned left', 'Candidate is looking to the left — possible second screen or assistance'],
              right: ['Face turned right', 'Candidate is looking to the right — possible second screen or assistance'],
              down: ['Face looking down', 'Candidate is looking down — possible phone or notes use'],
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
        onReady?.();
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
  }, [startLoop]);

  // ─── Compact widget (during test) ────────────────────────────────────────

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

  // ─── Setup screen (before test) ──────────────────────────────────────────

  return (
    <div className="wcp-setup">
      <div className="wcp-card">
        <div className="wcp-card-header">
          <div className="wcp-camera-icon">📷</div>
          <h2 className="wcp-title">Camera Verification Required</h2>
          <p className="wcp-subtitle">
            Your webcam must remain active throughout the entire test. Face tracking
            is enabled to ensure test integrity. Ensure you are clearly visible and well-lit.
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

        {phase === 'ready' && (
          <div className="wcp-checklist">
            <div className={`wcp-check-item${modelsOk ? ' done' : ''}`}>
              <span className="wcp-check-icon">{modelsOk ? '✓' : '○'}</span>
              Face detection active
            </div>
            <div className={`wcp-check-item${faceStatus === 'ok' ? ' done' : ''}`}>
              <span className="wcp-check-icon">{faceStatus === 'ok' ? '✓' : '○'}</span>
              Face clearly visible
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

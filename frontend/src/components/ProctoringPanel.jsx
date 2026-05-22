import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { AlertTriangle, Eye, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { computeCameraSensorSummary } from '../utils/cognitiveSensors';
import { proctoringAPI } from '../services/api';

export function ProctoringPanel({ sessionId, onFrameAnalyzed, isActive }) {
  const { theme } = useTheme();
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const [stats, setStats] = useState({
    facesDetected: 0,
    lookingDirection: 'forward',
    eyesVisible: true,
    suspiciousEvents: 0,
    integrity: 100,
  });
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    // Capture frame and analyze using camera sensors + backend
    intervalRef.current = setInterval(async () => {
      if (!webcamRef.current) return;
      try {
        const videoEl = webcamRef.current.video;

        const cameraMetrics = await computeCameraSensorSummary({ video: videoEl, hasFaceDetector: 'FaceDetector' in window });

        const payload = {
          face_detected: !!cameraMetrics.faceDetected,
          face_count: cameraMetrics.faceDetected ? 1 : 0,
          face_confidence: cameraMetrics.focusScore || 0,
          looking_direction: cameraMetrics.lookAwayRatio > 0.6 ? 'away' : 'forward',
          eyes_visible: cameraMetrics.faceDetected && (cameraMetrics.confusionScore < 0.6),
          head_pose: null,
        };

        // Send to backend proctoring analyzer
        let analysis = null;
        try {
          const resp = await proctoringAPI.analyzeFrame(sessionId, payload);
          analysis = resp.data || resp;
        } catch (err) {
          // If backend call fails, fallback to cameraMetrics-derived quick analysis
          analysis = {
            faces_detected: payload.face_count,
            face_confidence: payload.face_confidence,
            looking_direction: payload.looking_direction,
            eyes_visible: payload.eyes_visible,
            suspicious_activity: false,
            cheating_probability: 0,
          };
        }

        if (analysis && onFrameAnalyzed) onFrameAnalyzed(analysis);

        setStats(prev => ({
          ...prev,
          facesDetected: analysis.faces_detected || 0,
          lookingDirection: analysis.looking_direction || payload.looking_direction,
          eyesVisible: !!analysis.eyes_visible,
          suspiciousEvents: (analysis.suspicious_events_count || analysis.suspicious_activity ? prev.suspiciousEvents + 1 : prev.suspiciousEvents),
          integrity: Math.max(0, Math.min(100, (analysis.integrity_score || 100 - (analysis.suspicious_events_count || 0) * 10) )),
        }));

        // Update warnings
        const newWarnings = [];
        if ((analysis.faces_detected || 0) === 0) newWarnings.push('No face detected');
        if ((analysis.faces_detected || 0) > 1) newWarnings.push('Multiple faces detected');
        if ((analysis.looking_direction || payload.looking_direction) !== 'forward') newWarnings.push('Looking away');
        if (!analysis.eyes_visible) newWarnings.push('Eyes not visible');
        setWarnings(newWarnings);

      } catch (err) {
        console.error('Frame capture error:', err);
      }
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, onFrameAnalyzed]);

  const getIntegrityColor = (integrity) => {
    if (integrity >= 80) return theme.colors.success;
    if (integrity >= 60) return theme.colors.warning;
    return theme.colors.danger;
  };

  return (
    <div
      style={{
        backgroundColor: theme.colors.surfaceSecondary,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: '0.75rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>Proctoring Monitor</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: getIntegrityColor(stats.integrity) + '20',
            border: `1px solid ${getIntegrityColor(stats.integrity)}`,
            borderRadius: '0.5rem',
            color: getIntegrityColor(stats.integrity),
            fontSize: theme.fonts.size.sm,
            fontWeight: '600',
          }}
        >
          <Eye size={16} />
          Integrity: {stats.integrity.toFixed(0)}%
        </div>
      </div>

      {/* Webcam Feed */}
      <div
        style={{
          position: 'relative',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          backgroundColor: '#000',
          aspectRatio: '16 / 9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isActive ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: 'user',
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Recording indicator */}
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${theme.colors.danger}`,
                borderRadius: '0.5rem',
                color: theme.colors.danger,
                fontSize: theme.fonts.size.xs,
                fontWeight: '600',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.danger,
                  animation: 'pulse 1.5s infinite',
                }}
              />
              Recording
            </div>
          </>
        ) : (
          <div style={{ color: theme.colors.textTertiary, textAlign: 'center' }}>
            <p>Webcam not active</p>
          </div>
        )}
      </div>

      {/* Real-time Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <StatusBox label="Face Detection" value={stats.facesDetected > 0 ? 'Yes' : 'No'} status={stats.facesDetected > 0} />
        <StatusBox label="Eyes Visible" value={stats.eyesVisible ? 'Yes' : 'No'} status={stats.eyesVisible} />
        <StatusBox label="Looking Direction" value={stats.lookingDirection} />
        <StatusBox label="Suspicious Events" value={stats.suspiciousEvents.toString()} status={stats.suspiciousEvents === 0} />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${theme.colors.danger}`,
            borderRadius: '0.5rem',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertTriangle size={18} style={{ color: theme.colors.danger, marginTop: '0.2rem' }} />
            <div>
              <p style={{ color: theme.colors.danger, fontSize: theme.fonts.size.sm, fontWeight: '600', marginBottom: '0.25rem' }}>
                Warnings Detected
              </p>
              <ul style={{ color: theme.colors.danger, fontSize: theme.fonts.size.xs, marginLeft: '1.25rem' }}>
                {warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <p style={{ fontSize: theme.fonts.size.xs, color: theme.colors.textTertiary }}>
        Your session is being monitored to ensure test integrity. Be aware of suspicious activity detection.
      </p>
    </div>
  );
}

function StatusBox({ label, value, status }) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        backgroundColor: theme.colors.bgTertiary,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: '0.5rem',
        padding: '0.75rem',
      }}
    >
      <p style={{ color: theme.colors.textTertiary, fontSize: theme.fonts.size.xs, marginBottom: '0.25rem' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {typeof status === 'boolean' && (
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: status ? theme.colors.success : theme.colors.danger,
            }}
          />
        )}
        <span style={{ color: theme.colors.textPrimary, fontSize: theme.fonts.size.sm, fontWeight: '600' }}>
          {value}
        </span>
      </div>
    </div>
  );
}

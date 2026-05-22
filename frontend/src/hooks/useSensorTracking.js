import { useState, useEffect, useRef, useCallback } from 'react';
import { computeCameraSensorSummary, computeVoiceSensorSummary } from '../utils/cognitiveSensors';

export const useSensorTracking = (isActive = true) => {
  const [metrics, setMetrics] = useState({ cameraMetrics: {}, voiceMetrics: {} });
  const [isTracking, setIsTracking] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [movementData, setMovementData] = useState({
    totalMovement: 0,
    averageFocus: 0,
    distractionEvents: 0,
    lookAwayTime: 0,
    hesitationEvents: 0,
    totalSessionTime: 0
  });

  const videoRef = useRef(null);
  const createdHiddenVideoRef = useRef(false);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const recognitionRef = useRef(null);
  const trackingRef = useRef({
    lastFacePosition: null,
    movementAccumulator: 0,
    focusHistory: [],
    distractionCount: 0,
    lookAwayStart: null,
    lookAwayTotal: 0,
    hesitationCount: 0,
    sessionStartTime: null,
    lastMetricsUpdate: Date.now()
  });

  const startTracking = useCallback(async () => {
    if (!isActive || isTracking) return;

    try {
      // Request permissions and start streams
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 15 },
        audio: true
      });

      streamRef.current = stream;
      trackingRef.current.sessionStartTime = Date.now();

      // Setup video
      // If there is no visible video element supplied, create a hidden one
      if (!videoRef.current) {
        const hiddenVideo = document.createElement('video');
        hiddenVideo.style.position = 'fixed';
        hiddenVideo.style.left = '-10000px';
        hiddenVideo.style.width = '1px';
        hiddenVideo.style.height = '1px';
        hiddenVideo.muted = true;
        hiddenVideo.playsInline = true;
        hiddenVideo.autoplay = true;
        document.body.appendChild(hiddenVideo);
        videoRef.current = hiddenVideo;
        createdHiddenVideoRef.current = true;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {}
      }

      // Setup audio analysis
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      // Setup speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const tracking = trackingRef.current;
          let wordCount = 0;
          let fillerCount = 0;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase();
            wordCount += transcript.split(' ').length;

            // Count filler words
            const fillers = ['um', 'uh', 'like', 'you know', 'so', 'well'];
            fillers.forEach(filler => {
              fillerCount += (transcript.match(new RegExp(`\\b${filler}\\b`, 'g')) || []).length;
            });
          }

          tracking.wordCount = wordCount;
          tracking.fillerCount = fillerCount;
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsTracking(true);

      // Start metric updates (async to support async camera computations)
      trackingRef.current.trackingActive = true;

      const updateMetrics = async () => {
        if (!trackingRef.current.trackingActive) return;

        const now = Date.now();
        const tracking = trackingRef.current;

        // Update camera metrics (async)
        const cameraMetrics = await computeCameraSensorSummary({
          video: videoRef.current,
          hasFaceDetector: 'FaceDetector' in window
        });

        // Update voice metrics
        const analyser = analyserRef.current;
        if (analyser) {
          const voiceMetrics = computeVoiceSensorSummary({
            analyser,
            tracking
          });

          // Track movement and focus
          if (cameraMetrics.faceDetected && tracking.lastFacePosition) {
            const dx = Math.abs((cameraMetrics.faceX || 0) - tracking.lastFacePosition.x);
            const dy = Math.abs((cameraMetrics.faceY || 0) - tracking.lastFacePosition.y);
            const movement = Math.sqrt(dx * dx + dy * dy);

            tracking.movementAccumulator += movement;

            // Track look away
            if (cameraMetrics.lookAwayRatio > 0.7) {
              if (!tracking.lookAwayStart) {
                tracking.lookAwayStart = now;
              }
            } else {
              if (tracking.lookAwayStart) {
                tracking.lookAwayTotal += (now - tracking.lookAwayStart) / 1000;
                tracking.lookAwayStart = null;
              }
            }

            // Track distractions
            if (cameraMetrics.distractionScore > 0.8) {
              tracking.distractionCount++;
            }

            // Track hesitations
            if (voiceMetrics.hesitationScore > 0.6) {
              tracking.hesitationCount++;
            }
          }

          if (cameraMetrics.faceDetected) {
            tracking.lastFacePosition = { x: cameraMetrics.faceX || 0, y: cameraMetrics.faceY || 0 };
          }

          tracking.focusHistory.push(cameraMetrics.focusScore);
          if (tracking.focusHistory.length > 100) {
            tracking.focusHistory.shift();
          }

          // Update metrics state
          const newMetrics = { cameraMetrics, voiceMetrics };
          setMetrics(newMetrics);

          // Update movement data
          const sessionTime = (now - tracking.sessionStartTime) / 1000;
          const avgFocus = tracking.focusHistory.reduce((a, b) => a + b, 0) / tracking.focusHistory.length;

          setMovementData({
            totalMovement: tracking.movementAccumulator,
            averageFocus: avgFocus || 0,
            distractionEvents: tracking.distractionCount,
            lookAwayTime: tracking.lookAwayTotal,
            hesitationEvents: tracking.hesitationCount,
            totalSessionTime: sessionTime
          });

          // Store in history for summary
          setTrackingHistory(prev => [...prev.slice(-50), {
            timestamp: now,
            ...newMetrics,
            movement: tracking.movementAccumulator,
            sessionTime
          }]);
        }

        tracking.lastMetricsUpdate = now;
        requestAnimationFrame(updateMetrics);
      };

      updateMetrics();

    } catch (error) {
      console.warn('Sensor tracking failed:', error);
      // Continue without sensors - app still works
    }
  }, [isActive, isTracking]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);

    // mark tracking inactive
    trackingRef.current.trackingActive = false;

    // Stop all streams and recognition
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Remove hidden video element if we created one
    if (createdHiddenVideoRef.current && videoRef.current && videoRef.current.parentNode) {
      try {
        videoRef.current.parentNode.removeChild(videoRef.current);
      } catch {}
      createdHiddenVideoRef.current = false;
      videoRef.current = null;
    }
  }, []);

  // Auto-start/stop based on isActive
  useEffect(() => {
    if (isActive && !isTracking) {
      startTracking();
    } else if (!isActive && isTracking) {
      stopTracking();
    }

    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [isActive, isTracking, startTracking, stopTracking]);

  return {
    metrics,
    isTracking,
    trackingHistory,
    movementData,
    videoRef,
    startTracking,
    stopTracking
  };
};
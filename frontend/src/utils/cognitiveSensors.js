export const normalizeScore = (value) => Math.max(0, Math.min(1, value));

export const computeCameraSensorSummary = async ({ video, hasFaceDetector }) => {
  const metrics = {
    faceDetected: false,
    focusScore: 0.5,
    distractionScore: 0.5,
    confusionScore: 0.2,
    lookAwayRatio: 0,
    faceX: null,
    faceY: null,
    cameraReady: true
  };

  if (!video || video.readyState < 2) {
    return metrics;
  }

  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  if (hasFaceDetector) {
    try {
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(video);
      const face = faces[0];
      if (face) {
        metrics.faceDetected = true;
        const { x, y, width: boxWidth, height: boxHeight } = face.boundingBox;
        const centerX = x + boxWidth / 2;
        const centerY = y + boxHeight / 2;
        metrics.faceX = centerX;
        metrics.faceY = centerY;
        const horizontalDrift = Math.abs(centerX - width / 2) / (width / 2);
        const verticalDrift = Math.abs(centerY - height / 2) / (height / 2);
        const faceSizeRatio = boxWidth / width;

        metrics.focusScore = normalizeScore(1 - Math.max(horizontalDrift * 1.2, verticalDrift * 1.4));
        metrics.distractionScore = normalizeScore(Math.min(1, horizontalDrift * 1.3 + verticalDrift * 0.9));
        metrics.lookAwayRatio = normalizeScore(Math.min(1, horizontalDrift * 1.4 + verticalDrift * 1.2));
        metrics.confusionScore = normalizeScore((1 - metrics.focusScore) * 0.8 + (0.45 - faceSizeRatio) * 0.3);
      }
    } catch {
      metrics.faceDetected = false;
    }
  }

  if (!metrics.faceDetected) {
    metrics.focusScore = 0.2;
    metrics.distractionScore = 0.9;
    metrics.lookAwayRatio = 0.9;
    metrics.confusionScore = 0.45;
  }

  metrics.focusScore = normalizeScore(metrics.focusScore);
  metrics.distractionScore = normalizeScore(metrics.distractionScore);
  metrics.confusionScore = normalizeScore(metrics.confusionScore);

  return metrics;
};

export const computeVoiceSensorSummary = ({ analyser, tracking }) => {
  const metrics = {
    speechRateWpm: 0,
    pauseRatio: 0,
    hesitationScore: 0.15,
    fillerRate: 0,
    energyLevel: 0.1,
    microphoneReady: true
  };

  if (!analyser) {
    return metrics;
  }

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  const energy = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length / 255;
  metrics.energyLevel = normalizeScore(energy * 1.15);

  const now = performance.now();
  const isSilent = metrics.energyLevel < 0.08;
  if (isSilent) {
    const silenceDuration = now - (tracking.lastSilenceAt || now);
    if (silenceDuration > 600) {
      tracking.silentFrames = (tracking.silentFrames || 0) + 1;
      tracking.lastSilenceAt = now;
    }
  } else {
    tracking.lastSilenceAt = now;
  }

  const elapsedMinutes = Math.max(0.1, (now - (tracking.startTime || now)) / 60000);
  const words = Math.max(1, tracking.speechWords || 1);

  metrics.speechRateWpm = normalizeScore(Math.min(1, words / elapsedMinutes / 180));
  metrics.pauseRatio = normalizeScore(Math.min(1, (tracking.silentFrames || 0) / (words + 1)));
  metrics.hesitationScore = normalizeScore(metrics.pauseRatio * 0.7 + (1 - metrics.energyLevel) * 0.3);
  metrics.fillerRate = normalizeScore(Math.min(1, (tracking.fillerWords || 0) / (words + 1)));

  return metrics;
};

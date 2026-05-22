export const calculateFeatureSet = (typingData = [], quizScore = 0) => {
  if (!typingData.length) {
    return {
      typingSpeedWpm: 0,
      averagePauseMs: 0,
      backspaceRate: 0,
      rewriteFrequency: 0,
      focusScore: 0.5,
      hesitationIndex: 0,
      confidenceScore: 0.5,
      struggleScore: 0,
      quizScore
    };
  }

  const totalChars = typingData.reduce((acc, row) => acc + (row.charsAdded || 0), 0);
  const backspaces = typingData.reduce((acc, row) => acc + (row.backspaces || 0), 0);
  const pauses = typingData.map((row) => row.pauseMs || 0);
  const rewrites = typingData.reduce((acc, row) => acc + (row.rewriteEvents || 0), 0);
  const focusEvents = typingData.reduce((acc, row) => acc + (row.focusLossEvents || 0), 0);
  const totalSeconds = (typingData[typingData.length - 1]?.elapsedMs || 1) / 1000;
  const words = totalChars / 5;
  const typingSpeedWpm = Number(((words / Math.max(totalSeconds, 1)) * 60).toFixed(2));
  const averagePauseMs = Number((pauses.reduce((a, b) => a + b, 0) / pauses.length).toFixed(2));
  const backspaceRate = Number((backspaces / Math.max(totalChars, 1)).toFixed(3));
  const rewriteFrequency = Number((rewrites / Math.max(typingData.length, 1)).toFixed(3));
  const focusScore = Number(Math.max(0, 1 - focusEvents / Math.max(typingData.length / 4, 1)).toFixed(3));

  const hesitationIndex = Number(((averagePauseMs / 1000) * 0.6 + backspaceRate * 10 * 0.4).toFixed(3));
  const confidenceScore = Number(Math.max(0, Math.min(1, 1 - hesitationIndex * 0.25 + focusScore * 0.2)).toFixed(3));
  const struggleScore = Number(Math.max(0, Math.min(1, rewriteFrequency * 0.4 + backspaceRate * 0.3 + (1 - focusScore) * 0.3)).toFixed(3));

  return {
    typingSpeedWpm,
    averagePauseMs,
    backspaceRate,
    rewriteFrequency,
    focusScore,
    hesitationIndex,
    confidenceScore,
    struggleScore,
    quizScore
  };
};

export const classifyCognitiveState = (features) => {
  const { confidenceScore, struggleScore, focusScore, averagePauseMs, typingSpeedWpm } = features;

  if (focusScore < 0.4 && averagePauseMs > 1400) return "Fatigued";
  if (confidenceScore < 0.45 && struggleScore > 0.5) return "Confused";
  if (confidenceScore > 0.7 && struggleScore < 0.2 && typingSpeedWpm > 28) return "Clear";
  if (confidenceScore > 0.75 && struggleScore > 0.4) return "Overconfident";
  return "Guessing";
};

export const evaluatePrediction = (predictedState, quizScore) => {
  const actualState = quizScore >= 80 ? "Clear" : quizScore >= 55 ? "Confused" : "Fatigued";
  const match = predictedState === actualState;
  const confidenceGap = Math.abs((quizScore / 100) - (predictedState === "Clear" ? 0.9 : 0.5));

  return {
    actualState,
    match,
    confidenceGap: Number(confidenceGap.toFixed(3)),
    understandingAnomaly: predictedState === "Clear" && quizScore < 60
  };
};

export const adaptiveRecommendation = (state) => {
  switch (state) {
    case "Confused":
      return "Show simpler explanation with step-by-step hints.";
    case "Clear":
      return "Increase difficulty with advanced follow-up questions.";
    case "Fatigued":
      return "Suggest a short break and a lighter recap activity.";
    case "Overconfident":
      return "Inject challenge questions to validate true understanding.";
    default:
      return "Provide one more guided example before progressing.";
  }
};

import { resolveTopicKey } from "./quizEngine";

const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));
const avg = (items, fallback = 0) => (items.length ? items.reduce((sum, item) => sum + item, 0) / items.length : fallback);
const blend = (oldValue, newValue, weight = 0.25) => round(oldValue ? oldValue * (1 - weight) + newValue * weight : newValue);

export const createDefaultProfile = () => ({
  studentId: "student-demo",
  sessions: 0,
  averageTypingSpeed: 32,
  hesitationBaseline: 0.45,
  focusLevel: 0.72,
  confidenceTrend: 62,
  strongSubjects: [],
  weakSubjects: [],
  learningSpeed: 0.62,
  attentionSpan: 18,
  quizPerformanceHistory: [],
  topicMastery: {},
  growthTimeline: [],
  persona: "Analytical Learner",
  coachInsights: ["Complete a study session to build your personal cognitive baseline."]
});

export const loadStudentProfile = () => {
  try {
    return { ...createDefaultProfile(), ...JSON.parse(localStorage.getItem("aptisense.studentProfile") || "{}") };
  } catch {
    return createDefaultProfile();
  }
};

export const saveStudentProfile = (profile) => {
  localStorage.setItem("aptisense.studentProfile", JSON.stringify(profile));
};

export const predictPersonalizedState = (features = {}, profile = createDefaultProfile()) => {
  const typingRatio = features.typingSpeedWpm / Math.max(profile.averageTypingSpeed, 1);
  const hesitationRatio = features.hesitationIndex / Math.max(profile.hesitationBaseline, 0.05);
  const focusDrop = profile.focusLevel - features.focusScore;
  const confidenceGap = (features.confidenceScore * 100) - profile.confidenceTrend;

  if (focusDrop > 0.28 && hesitationRatio > 1.2) return "Fatigued";
  if (hesitationRatio > 1.35 && features.struggleScore > 0.38) return "Confused";
  if (confidenceGap > 18 && features.struggleScore > 0.35) return "Overconfident";
  if (typingRatio > 0.92 && hesitationRatio < 0.9 && features.focusScore >= profile.focusLevel - 0.08) return "Clear";
  return "Guessing";
};

export const generateLearnerPersona = (profile) => {
  const recent = profile.quizPerformanceHistory.slice(-5);
  const avgScore = avg(recent.map((item) => item.score), 70);
  const avgConfidence = avg(recent.map((item) => item.avgConfidence), profile.confidenceTrend);

  if (profile.averageTypingSpeed >= 42 && avgScore < 70) return "Fast but Careless";
  if (avgConfidence - avgScore > 16) return "High Confidence / Low Accuracy";
  if (profile.hesitationBaseline > 0.75 && avgScore >= 70) return "Hesitant Thinker";
  if (profile.averageTypingSpeed < 26 && avgScore >= 76) return "Slow but Accurate";
  return "Analytical Learner";
};

export const generateCoachInsights = (profile) => {
  const insights = [];
  const recent = profile.quizPerformanceHistory.slice(-5);
  const dbms = recent.filter((item) => item.topicKey === "dbms");
  const theoryWeakness = profile.weakSubjects.find((subject) => ["dbms", "os"].includes(subject.key));

  if (profile.attentionSpan <= 20) insights.push(`Your focus decreases after ${profile.attentionSpan} minutes.`);
  if (theoryWeakness) insights.push("You struggle more with theoretical concepts.");
  if (dbms.length && avg(dbms.map((item) => item.avgConfidence), 0) - avg(dbms.map((item) => item.score), 0) > 15) {
    insights.push("Your confidence exceeds actual performance in DBMS.");
  }
  if (profile.growthTimeline.length >= 2) {
    const first = profile.growthTimeline[0];
    const latest = profile.growthTimeline[profile.growthTimeline.length - 1];
    if (latest.hesitation < first.hesitation) insights.push("Your hesitation is reducing over time.");
    if (latest.focus > first.focus) insights.push("Your focus baseline is improving.");
  }

  return insights.length ? insights.slice(0, 4) : ["Your cognitive baseline is forming. Complete more sessions for sharper coaching."];
};

export const updateStudentProfile = ({ profile, topic, features, quizAnalytics }) => {
  const topicKey = resolveTopicKey(topic);
  const nextSessions = profile.sessions + 1;
  const score = quizAnalytics?.score ?? features.quizScore ?? 0;
  const avgConfidence = quizAnalytics?.avgConfidence ?? round(features.confidenceScore * 100, 0);
  const responseSeconds = Math.round((quizAnalytics?.avgResponseTime || 0) / 1000);
  const attentionSpan = Math.max(8, Math.min(45, Math.round((features.focusScore * 24) + (responseSeconds > 20 ? -3 : 4))));

  const topicMastery = {
    ...profile.topicMastery,
    [topicKey]: round(blend(profile.topicMastery?.[topicKey] || 50, score, 0.35), 0)
  };
  const subjectRows = Object.entries(topicMastery).map(([key, mastery]) => ({ key, mastery }));
  const strongSubjects = subjectRows.filter((item) => item.mastery >= 76).sort((a, b) => b.mastery - a.mastery);
  const weakSubjects = subjectRows.filter((item) => item.mastery < 62).sort((a, b) => a.mastery - b.mastery);

  const quizPerformanceHistory = [
    ...profile.quizPerformanceHistory,
    {
      topic,
      topicKey,
      score,
      avgConfidence,
      weakSubtopics: quizAnalytics?.weakSubtopics || [],
      fakeUnderstandingCount: quizAnalytics?.fakeUnderstandingCount || 0,
      hesitationCount: quizAnalytics?.hesitationCount || 0,
      createdAt: new Date().toISOString()
    }
  ].slice(-25);

  const growthTimeline = [
    ...profile.growthTimeline,
    {
      label: `S${nextSessions}`,
      confidence: avgConfidence,
      hesitation: round(features.hesitationIndex, 2),
      focus: round(features.focusScore * 100, 0),
      mastery: topicMastery[topicKey]
    }
  ].slice(-10);

  const nextProfile = {
    ...profile,
    sessions: nextSessions,
    averageTypingSpeed: blend(profile.averageTypingSpeed, features.typingSpeedWpm || profile.averageTypingSpeed, 0.22),
    hesitationBaseline: blend(profile.hesitationBaseline, features.hesitationIndex || profile.hesitationBaseline, 0.22),
    focusLevel: blend(profile.focusLevel, features.focusScore || profile.focusLevel, 0.22),
    confidenceTrend: blend(profile.confidenceTrend, avgConfidence, 0.28),
    strongSubjects,
    weakSubjects,
    learningSpeed: blend(profile.learningSpeed, score / 100, 0.22),
    attentionSpan: Math.round(blend(profile.attentionSpan, attentionSpan, 0.25)),
    quizPerformanceHistory,
    topicMastery,
    growthTimeline
  };

  nextProfile.persona = generateLearnerPersona(nextProfile);
  nextProfile.coachInsights = generateCoachInsights(nextProfile);
  return nextProfile;
};

export const buildPersonalizedRecommendation = (profile, state) => {
  const weak = profile.weakSubjects[0]?.key?.toUpperCase();
  if (state === "Fatigued") return `Take a short reset, then resume with a lighter ${weak || "core"} recap.`;
  if (state === "Confused") return `Review ${weak || "the weakest concept"} with one example and one recall question.`;
  if (state === "Overconfident") return "Use challenge questions to calibrate confidence against accuracy.";
  if (state === "Clear") return "Increase difficulty and add scenario-based transfer questions.";
  return "Use guided examples until your personal baseline stabilizes.";
};

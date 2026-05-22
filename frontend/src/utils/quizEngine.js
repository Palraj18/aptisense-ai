import { questionBank } from "../data/questionBank";

const topicAliases = [
  { key: "dbms", terms: ["dbms", "database", "normalization", "sql", "transaction"] },
  { key: "os", terms: ["operating", "os", "process", "memory", "deadlock", "scheduling"] },
  { key: "ds", terms: ["data structure", "array", "arrays", "stack", "queue", "tree", "graph", "algorithm"] },
  { key: "cn", terms: ["network", "computer network", "tcp", "osi", "dns", "ip"] },
  { key: "aiml", terms: ["machine learning", "ai", "ml", "model", "supervised", "overfitting"] }
];

const difficultyByState = {
  Clear: ["medium", "advanced"],
  Overconfident: ["advanced", "medium"],
  Confused: ["basic", "medium"],
  Fatigued: ["basic"],
  Guessing: ["basic", "medium"]
};

export const resolveTopicKey = (topic = "") => {
  const normalized = topic.toLowerCase();
  return topicAliases.find((entry) => entry.terms.some((term) => normalized.includes(term)))?.key || "general";
};

export const detectWeakSubtopics = ({ topic = "", explanation = "", history = [], features = {} }) => {
  const topicKey = resolveTopicKey(topic);
  const text = `${topic} ${explanation}`.toLowerCase();
  const candidates = questionBank[topicKey] || questionBank.general;
  const weakFromText = candidates
    .filter((question) => text.includes(question.subtopic.toLowerCase()) || text.includes(question.subtopic.split(" ")[0].toLowerCase()))
    .map((question) => question.subtopic);
  const weakFromHistory = history
    .filter((item) => item.topicKey === topicKey && item.correct === false)
    .map((item) => item.subtopic);
  const behaviorWeakness =
    features.hesitationIndex > 0.55 || features.struggleScore > 0.45
      ? candidates.slice(0, 2).map((question) => question.subtopic)
      : [];

  return [...new Set([...weakFromHistory, ...weakFromText, ...behaviorWeakness])].slice(0, 3);
};

export const generateAdaptiveQuiz = ({ topic, explanation, cognitiveState, history = [], features = {}, profile = null }) => {
  const topicKey = resolveTopicKey(topic);
  const pool = [...(questionBank[topicKey] || []), ...questionBank.general];
  const profileWeak = profile?.weakSubjects?.some((subject) => subject.key === topicKey);
  const profileStrong = profile?.strongSubjects?.some((subject) => subject.key === topicKey);
  const difficulties = profileWeak
    ? ["basic", "medium"]
    : profileStrong && cognitiveState === "Clear"
      ? ["advanced", "medium"]
      : difficultyByState[cognitiveState] || difficultyByState.Guessing;
  const weakSubtopics = detectWeakSubtopics({ topic, explanation, history, features });

  const ranked = pool
    .map((question) => {
      const difficultyScore = difficulties.includes(question.difficulty) ? 4 : 0;
      const weaknessScore = weakSubtopics.includes(question.subtopic) ? 5 : 0;
      const mistakeScore = history.some((item) => item.questionId === question.id && item.correct === false) ? 3 : 0;
      const profileScore = profileWeak && question.difficulty === "basic" ? 2 : profileStrong && question.difficulty === "advanced" ? 2 : 0;
      return { ...question, topicKey, priority: difficultyScore + weaknessScore + mistakeScore + profileScore };
    })
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  const selected = ranked.slice(0, cognitiveState === "Fatigued" ? 3 : 5);
  return {
    topicKey,
    cognitiveState,
    difficultyMode: `${difficulties.join(" + ")}${profileWeak ? " (personal weak area)" : profileStrong ? " (personal strength)" : ""}`,
    weakSubtopics,
    questions: selected
  };
};

export const evaluateQuizAttempt = ({ questions, answers, confidence, timings, retries }) => {
  const details = questions.map((question) => {
    const selected = answers[question.id];
    const correct = selected === question.answer;
    const confidenceScore = confidence[question.id] ?? 50;
    const responseTime = timings[question.id] ?? 0;
    return {
      questionId: question.id,
      subtopic: question.subtopic,
      type: question.type,
      difficulty: question.difficulty,
      selected,
      correct,
      confidence: confidenceScore,
      responseTime,
      retries: retries[question.id] ?? 0,
      hesitationPattern: responseTime > 25000 || (retries[question.id] ?? 0) > 1,
      fakeUnderstanding: confidenceScore >= 75 && !correct,
      confidenceMismatch: Math.abs(confidenceScore - (correct ? 90 : 35))
    };
  });

  const correctCount = details.filter((item) => item.correct).length;
  const score = Math.round((correctCount / Math.max(questions.length, 1)) * 100);
  const avgConfidence = Math.round(details.reduce((sum, item) => sum + item.confidence, 0) / Math.max(details.length, 1));
  const avgResponseTime = Math.round(details.reduce((sum, item) => sum + item.responseTime, 0) / Math.max(details.length, 1));
  const fakeUnderstandingCount = details.filter((item) => item.fakeUnderstanding).length;
  const hesitationCount = details.filter((item) => item.hesitationPattern).length;
  const weakSubtopics = [...new Set(details.filter((item) => !item.correct).map((item) => item.subtopic))];

  return {
    score,
    avgConfidence,
    avgResponseTime,
    fakeUnderstandingCount,
    hesitationCount,
    weakSubtopics,
    details
  };
};

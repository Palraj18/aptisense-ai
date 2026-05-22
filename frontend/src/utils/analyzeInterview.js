export const analyzeAnswer = (
  question,
  answer
) => {

  const lowerAnswer =
    answer.toLowerCase().trim();

  const lowerQuestion =
    question.toLowerCase();

  let confidence = 0;
  let communication = 0;
  let technical = 0;

  const hrKeywords = [
    "leadership",
    "teamwork",
    "communication",
    "problem solving",
    "pressure",
    "adapt",
    "growth",
    "learn",
    "experience",
    "skills",
    "confident",
    "organized",
    "responsible",
    "creative",
    "collaboration",
    "management"
  ];

  const technicalKeywords = [
    "react",
    "javascript",
    "api",
    "frontend",
    "backend",
    "database",
    "sql",
    "mongodb",
    "python",
    "machine learning",
    "ai",
    "hooks",
    "component"
  ];

  const words =
    lowerAnswer.split(/\s+/);

  const wordCount = words.length;

  // VERY SHORT ANSWERS

  if (wordCount <= 2) {

    return {
      confidence: 5,
      communication: 5,
      technical: 0
    };

  }

  // BASIC LENGTH

  if (wordCount > 5) {
    communication += 20;
    confidence += 20;
  }

  if (wordCount > 12) {
    communication += 15;
    confidence += 15;
  }

  // HR KEYWORDS

  hrKeywords.forEach((word) => {

    if (
      lowerAnswer.includes(word)
    ) {

      confidence += 5;
      communication += 5;

    }

  });

  // TECHNICAL KEYWORDS

  technicalKeywords.forEach((word) => {

    if (
      lowerAnswer.includes(word)
    ) {

      technical += 8;

    }

  });

  // QUESTION RELEVANCE

  if (
    lowerQuestion.includes("strength") &&
    lowerAnswer.includes("weakness")
  ) {

    confidence += 10;

  }

  if (
    lowerQuestion.includes("yourself") &&
    (
      lowerAnswer.includes("graduate") ||
      lowerAnswer.includes("student") ||
      lowerAnswer.includes("experience")
    )
  ) {

    confidence += 10;

  }

  if (
    lowerQuestion.includes("hire") &&
    (
      lowerAnswer.includes("skills") ||
      lowerAnswer.includes("fit") ||
      lowerAnswer.includes("contribution")
    )
  ) {

    confidence += 10;

  }

  // LIMITS

  confidence =
    Math.min(confidence, 100);

  communication =
    Math.min(communication, 100);

  technical =
    Math.min(technical, 100);

  return {
    confidence,
    communication,
    technical
  };

};
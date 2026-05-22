import React, { useMemo, useState } from "react";

const QUIZ_BANK = [
  {
    id: 1,
    question: "What is the key objective of AptiSense AI behavior tracking?",
    options: [
      "Analyze grammar quality in essays",
      "Capture behavioral learning signals",
      "Detect plagiarism in answers",
      "Translate notes automatically"
    ],
    answer: 1
  },
  {
    id: 2,
    question: "Which signal indicates hesitation during typing?",
    options: ["Long pauses", "High screen brightness", "Mouse color", "Audio level"],
    answer: 0
  },
  {
    id: 3,
    question: "Adaptive learning should do what for confused learners?",
    options: [
      "Increase difficulty immediately",
      "Lock the next section",
      "Provide simpler explanation and hints",
      "End the session"
    ],
    answer: 2
  }
];

const QuizEngine = ({ onSubmit }) => {
  const [answers, setAnswers] = useState({});

  const score = useMemo(() => {
    const correct = QUIZ_BANK.filter((q) => answers[q.id] === q.answer).length;
    return Math.round((correct / QUIZ_BANK.length) * 100);
  }, [answers]);

  return (
    <section className="card">
      <h3>Understanding Quiz</h3>
      {QUIZ_BANK.map((q) => (
        <div className="quiz-block" key={q.id}>
          <p>{q.id}. {q.question}</p>
          <div className="option-grid">
            {q.options.map((option, idx) => (
              <button
                key={option}
                className={answers[q.id] === idx ? "option active" : "option"}
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="row">
        <span className="pill">Current Score: {score}%</span>
        <button className="primary-btn" onClick={() => onSubmit(score, answers)}>Submit Quiz</button>
      </div>
    </section>
  );
};

export default QuizEngine;

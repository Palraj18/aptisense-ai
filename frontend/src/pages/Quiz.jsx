import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Clock, Gauge, Target } from "lucide-react";
import { Button } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";
import { evaluateQuizAttempt, generateAdaptiveQuiz } from "../utils/quizEngine";

const typeStyles = {
  MCQ: "border-neuro-cyan/30 bg-neuro-cyan/10 text-neuro-cyan",
  "True/False": "border-neuro-success/30 bg-neuro-success/10 text-neuro-success",
  Scenario: "border-neuro-warning/30 bg-neuro-warning/10 text-neuro-warning",
  Conceptual: "border-neuro-violet/30 bg-neuro-violet/10 text-neuro-violet"
};

const Quiz = ({ topic, explanation, cognitiveState, features, learningHistory, studentProfile, onQuizSubmit }) => {
  const quiz = useMemo(
    () => generateAdaptiveQuiz({ topic, explanation, cognitiveState, history: learningHistory, features, profile: studentProfile }),
    [topic, explanation, cognitiveState, learningHistory, features, studentProfile]
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confidence, setConfidence] = useState({});
  const [timings, setTimings] = useState({});
  const [retries, setRetries] = useState({});
  const questionStartRef = useRef(Date.now());
  const current = quiz.questions[index];
  const progress = Math.round(((index + 1) / quiz.questions.length) * 100);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [current?.id]);

  const recordTiming = () => {
    if (!current) return;
    const elapsed = Date.now() - questionStartRef.current;
    setTimings((prev) => ({ ...prev, [current.id]: Math.max(prev[current.id] || 0, elapsed) }));
  };

  const selectAnswer = (optionIndex) => {
    recordTiming();
    setRetries((prev) => ({
      ...prev,
      [current.id]: answers[current.id] === undefined ? prev[current.id] || 0 : (prev[current.id] || 0) + 1
    }));
    setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }));
  };

  const move = (direction) => {
    recordTiming();
    setIndex((value) => Math.min(quiz.questions.length - 1, Math.max(0, value + direction)));
  };

  const analytics = useMemo(
    () => evaluateQuizAttempt({ questions: quiz.questions, answers, confidence, timings, retries }),
    [quiz.questions, answers, confidence, timings, retries]
  );

  const finish = () => {
    const finalTimings = {
      ...timings,
      [current.id]: Math.max(timings[current.id] || 0, Date.now() - questionStartRef.current)
    };
    setTimings(finalTimings);
    const finalAnalytics = evaluateQuizAttempt({ questions: quiz.questions, answers, confidence, timings: finalTimings, retries });
    onQuizSubmit(finalAnalytics.score, {
      answers,
      confidence,
      timings: finalTimings,
      retries,
      quizProfile: quiz,
      analytics: finalAnalytics
    });
  };

  if (!current) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <GlassCard>
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm text-neuro-cyan">Dynamic Quiz Intelligence System</p>
              <h1 className="mt-1 text-3xl font-bold text-white">{topic} adaptive assessment</h1>
              <p className="mt-2 text-sm text-slate-400">
                Generated from topic, explanation, cognitive state, previous mistakes, and learning history.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300">
              <Clock className="h-4 w-4 text-neuro-warning" /> Response-aware
            </div>
          </div>

          <div className="mb-8 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-neuro-violet to-neuro-cyan" animate={{ width: `${progress}%` }} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs ${typeStyles[current.type] || typeStyles.MCQ}`}>{current.type}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">{current.difficulty}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">{current.subtopic}</span>
              </div>
              <p className="mb-3 text-sm text-slate-400">Question {index + 1} of {quiz.questions.length}</p>
              <h2 className="mb-6 text-2xl font-bold leading-snug text-white">{current.question}</h2>
              <div className="grid gap-3">
                {current.options.map((option, optionIndex) => (
                  <button
                    key={option}
                    onClick={() => selectAnswer(optionIndex)}
                    className={`rounded-lg border p-4 text-left text-sm transition ${answers[current.id] === optionIndex ? "border-neuro-cyan bg-neuro-cyan/10 text-white shadow-cyan" : "border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/25"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-8 rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex justify-between text-sm">
                  <span className="font-medium text-white">How confident are you in this answer?</span>
                  <span className="text-neuro-cyan">{confidence[current.id] || 50}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidence[current.id] || 50}
                  onChange={(event) => {
                    recordTiming();
                    setConfidence((prev) => ({ ...prev, [current.id]: Number(event.target.value) }));
                  }}
                  className="w-full accent-[#06B6D4]"
                />
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-between">
            <Button variant="secondary" disabled={index === 0} onClick={() => move(-1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {index === quiz.questions.length - 1 ? (
              <Button onClick={finish}><CheckCircle2 className="h-4 w-4" /> Analyze Results</Button>
            ) : (
              <Button onClick={() => move(1)}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </GlassCard>

        <div className="grid gap-6">
          <GlassCard>
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white"><BrainCircuit className="h-5 w-5 text-neuro-cyan" /> Quiz profile</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between rounded-lg bg-white/[0.06] p-3"><span className="text-slate-400">Detected state</span><strong>{quiz.cognitiveState}</strong></div>
              <div className="flex justify-between rounded-lg bg-white/[0.06] p-3"><span className="text-slate-400">Difficulty</span><strong>{quiz.difficultyMode}</strong></div>
              <div className="rounded-lg bg-white/[0.06] p-3">
                <span className="text-slate-400">Weak focus</span>
                <p className="mt-1 font-semibold text-white">{quiz.weakSubtopics.join(", ") || "General calibration"}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white"><Gauge className="h-5 w-5 text-neuro-warning" /> Live analytics</h3>
            <div className="grid gap-3 text-sm">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-slate-300">Correctness: <strong className="float-right text-white">{analytics.score}%</strong></div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-slate-300">Avg confidence: <strong className="float-right text-white">{analytics.avgConfidence}%</strong></div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-slate-300">Retries: <strong className="float-right text-white">{Object.values(retries).reduce((a, b) => a + b, 0)}</strong></div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-slate-300">Hesitation flags: <strong className="float-right text-white">{analytics.hesitationCount}</strong></div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-3 flex items-center gap-2 font-bold text-white"><Target className="h-5 w-5 text-neuro-violet" /> Personalization logic</h3>
            <p className="text-sm leading-6 text-slate-400">
              Clear learners receive harder prompts, confused learners get conceptual checks, and fatigued learners see fewer lower-load questions.
            </p>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};

export default Quiz;

import React, {
  useEffect,
  useState
} from "react";

import {
  getInterviewSession
} from "../store/interviewStore";

import {
  evaluateAnswer
} from "../services/api";

const InterviewResults = () => {

  const session =
    getInterviewSession();

  const [evaluations,
    setEvaluations] =
    useState([]);

  const [loading,
    setLoading] =
    useState(true);

  useEffect(() => {

    const runEvaluation =
      async () => {

      const results = [];

      for (
        const item
        of session.answers
      ) {

        const response =
          await evaluateAnswer(

            item.question,

            item.answer,

            item.metrics

          );

        results.push({

          ...item,

          evaluation:
            response

        });

      }

      setEvaluations(
        results
      );

      setLoading(false);

    };

    runEvaluation();

  }, []);

  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-5xl font-black text-cyan-400">

        AI is analyzing your interview...

      </div>

    );

  }

  let totalConfidence = 0;
  let totalCommunication = 0;
  let totalTechnical = 0;

  evaluations.forEach(
    (item) => {

    totalConfidence +=
      item.evaluation
        .confidence;

    totalCommunication +=
      item.evaluation
        .communication;

    totalTechnical +=
      item.evaluation
        .technical;

  });

  const total =
    evaluations.length || 1;

  const confidenceScore =
    Math.floor(
      totalConfidence / total
    );

  const communicationScore =
    Math.floor(
      totalCommunication /
      total
    );

  const technicalScore =
    Math.floor(
      totalTechnical / total
    );

  return (

    <div className="min-h-screen bg-[#050816] px-8 py-10 text-white">

      <div className="mx-auto max-w-6xl">

        <div className="mb-12">

          <h1 className="mb-4 text-6xl font-black">
            AI Interview Analysis
          </h1>

          <p className="text-xl text-slate-400">
            NLP + Behavioral Intelligence Report
          </p>

        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

            <p className="mb-3 text-lg text-slate-400">
              Confidence
            </p>

            <h2 className="text-6xl font-black text-cyan-400">
              {confidenceScore}%
            </h2>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

            <p className="mb-3 text-lg text-slate-400">
              Communication
            </p>

            <h2 className="text-6xl font-black text-green-400">
              {communicationScore}%
            </h2>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

            <p className="mb-3 text-lg text-slate-400">
              Technical
            </p>

            <h2 className="text-6xl font-black text-violet-400">
              {technicalScore}%
            </h2>

          </div>

        </div>

        <div className="space-y-8">

          {evaluations.map(
            (item, index) => (

            <div
              key={index}
              className="rounded-3xl border border-white/10 bg-white/5 p-8"
            >

              <p className="mb-4 text-cyan-400">
                Question {index + 1}
              </p>

              <h2 className="mb-6 text-3xl font-black">
                {item.question}
              </h2>

              <p className="mb-8 text-lg leading-8 text-slate-300">
                {item.answer}
              </p>

              <div className="mb-8 grid gap-4 md:grid-cols-3">

                <div className="rounded-2xl bg-cyan-500/10 p-4">

                  <p className="text-slate-400">
                    Confidence
                  </p>

                  <h3 className="text-4xl font-black text-cyan-400">
                    {
                      item.evaluation
                        .confidence
                    }%
                  </h3>

                </div>

                <div className="rounded-2xl bg-green-500/10 p-4">

                  <p className="text-slate-400">
                    Communication
                  </p>

                  <h3 className="text-4xl font-black text-green-400">
                    {
                      item.evaluation
                        .communication
                    }%
                  </h3>

                </div>

                <div className="rounded-2xl bg-violet-500/10 p-4">

                  <p className="text-slate-400">
                    Technical
                  </p>

                  <h3 className="text-4xl font-black text-violet-400">
                    {
                      item.evaluation
                        .technical
                    }%
                  </h3>

                </div>

              </div>

              <div className="mb-8 grid gap-4 md:grid-cols-4">

                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">

                  <p className="mb-2 text-slate-400">
                    Typing Speed
                  </p>

                  <h3 className="text-4xl font-black text-cyan-400">

                    {
                      item.metrics
                        .typingSpeed
                    }

                  </h3>

                  <p className="mt-2 text-slate-400">
                    WPM
                  </p>

                </div>

                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">

                  <p className="mb-2 text-slate-400">
                    Hesitation
                  </p>

                  <h3 className="text-4xl font-black text-yellow-400">

                    {
                      item.metrics
                        .hesitationTime
                    }

                  </h3>

                  <p className="mt-2 text-slate-400">
                    Pauses
                  </p>

                </div>

                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5">

                  <p className="mb-2 text-slate-400">
                    Response Time
                  </p>

                  <h3 className="text-4xl font-black text-green-400">

                    {
                      item.metrics
                        .totalTime
                    }

                  </h3>

                  <p className="mt-2 text-slate-400">
                    Seconds
                  </p>

                </div>

                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">

                  <p className="mb-2 text-slate-400">
                    Backspaces
                  </p>

                  <h3 className="text-4xl font-black text-red-400">

                    {
                      item.metrics
                        .backspaces
                    }

                  </h3>

                  <p className="mt-2 text-slate-400">
                    Corrections
                  </p>

                </div>

              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6">

                <p className="mb-2 text-cyan-400">
                  AI Feedback
                </p>

                <p className="text-lg leading-8 text-slate-300">

                  {
                    item.evaluation
                      .feedback
                  }

                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

};

export default InterviewResults;
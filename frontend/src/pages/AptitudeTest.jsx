import React, {
  useEffect,
  useRef,
  useState
} from "react";

import Webcam from "react-webcam";

import {
  FaceMesh
} from "@mediapipe/face_mesh";

import {
  Camera
} from "@mediapipe/camera_utils";

import {
  getAptitudeQuestions,
  submitAptitudeAttempt
} from "../services/api";

const AptitudeTest = ({ onNavigate }) => {

  const webcamRef =
    useRef(null);

  const [category,
    setCategory] =
    useState(null);

  const [questions,
    setQuestions] =
    useState([]);

  const [currentQuestion,
    setCurrentQuestion] =
    useState(0);

  const [selectedOption,
    setSelectedOption] =
    useState("");

  const [score,
    setScore] =
    useState(0);

  const [completed,
    setCompleted] =
    useState(false);

  const [timeLeft,
    setTimeLeft] =
    useState(300);

  const [tabSwitches,
    setTabSwitches] =
    useState(0);

  const [attentionScore,
    setAttentionScore] =
    useState(100);

  const [faceDetected,
    setFaceDetected] =
    useState(true);

  const [eyeDirection,
    setEyeDirection] =
    useState("Center");

  const [suspiciousCount,
    setSuspiciousCount] =
    useState(0);

  const categories = [

  {
    key: "numerical",
    title:
      "Numerical Ability"
  },

  {
    key: "verbal",
    title:
      "Verbal Ability"
  },

  {
    key: "reasoning",
    title:
      "Reasoning Ability"
  },

  {
    key:
      "advanced_quant",

    title:
      "Advanced Quantitative"
  },

  {
    key:
      "advanced_coding",

    title:
      "Advanced Coding"
  }

];

  useEffect(() => {

    const handleVisibility =
      () => {

      if (
        document.hidden
      ) {

        setTabSwitches(
          (prev) =>
            prev + 1
        );

        setSuspiciousCount(
          (prev) =>
            prev + 1
        );

        setAttentionScore(
          (prev) =>
            Math.max(
              prev - 10,
              0
            )
        );

      }

    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

    };

  }, []);

  useEffect(() => {

    if (
      !category
    ) return;

    const faceMesh =
      new FaceMesh({

      locateFile:
        (file) => {

        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;

      }

    });

    faceMesh.setOptions({

      maxNumFaces: 1,

      refineLandmarks: true,

      minDetectionConfidence: 0.5,

      minTrackingConfidence: 0.5

    });

    faceMesh.onResults(
      (results) => {

      if (
        results.multiFaceLandmarks &&
        results.multiFaceLandmarks.length > 0
      ) {

        setFaceDetected(
          true
        );

        const landmarks =
          results
          .multiFaceLandmarks[0];

        const nose =
          landmarks[1];

        if (
          nose.x < 0.35
        ) {

          setEyeDirection(
            "Looking Left"
          );

          setSuspiciousCount(
            (prev) =>
              prev + 1
          );

          setAttentionScore(
            (prev) =>
              Math.max(
                prev - 2,
                0
              )
          );

        }

        else if (
          nose.x > 0.65
        ) {

          setEyeDirection(
            "Looking Right"
          );

          setSuspiciousCount(
            (prev) =>
              prev + 1
          );

          setAttentionScore(
            (prev) =>
              Math.max(
                prev - 2,
                0
              )
          );

        }

        else if (
          nose.y > 0.55
        ) {

          setEyeDirection(
            "Looking Down"
          );

          setSuspiciousCount(
            (prev) =>
              prev + 1
          );

          setAttentionScore(
            (prev) =>
              Math.max(
                prev - 3,
                0
              )
          );

        }

        else {

          setEyeDirection(
            "Center"
          );

        }

      }

      else {

        setFaceDetected(
          false
        );

        setEyeDirection(
          "No Face"
        );

        setSuspiciousCount(
          (prev) =>
            prev + 1
        );

        setAttentionScore(
          (prev) =>
            Math.max(
              prev - 5,
              0
            )
        );

      }

    });

    if (
      webcamRef.current?.video
    ) {

      const camera =
        new Camera(
          webcamRef.current.video,
          {

          onFrame:
            async () => {

            await faceMesh.send({

              image:
                webcamRef.current.video

            });

          },

          width: 640,

          height: 480

        });

      camera.start();

    }

  }, [category]);

  useEffect(() => {

    if (
      completed
    ) return;

    if (
      timeLeft <= 0
    ) {
      submitTest(score);
      setCompleted(true);

      return;

    }

    const timer =
      setInterval(() => {

      setTimeLeft(
        (prev) =>
          prev - 1
      );

    }, 1000);

    return () =>
      clearInterval(timer);

  }, [
    timeLeft,
    completed
  ]);

  const submitTest = async (finalScore) => {
    try {
      await submitAptitudeAttempt({
        category,
        score: finalScore,
        total_questions: questions.length,
        attention_score: attentionScore,
        suspicious_count: suspiciousCount,
        tab_switches: tabSwitches,
      });
    } catch (err) {
      console.error("Failed to submit aptitude attempt:", err);
    }
  };

  const startCategory =
    async (key) => {

    const data =
      await getAptitudeQuestions(
        key
      );

    setQuestions(
      data.questions
    );

    setCategory(key);

  };

  const handleNext =
    () => {

    const current =
      questions[
        currentQuestion
      ];

    let finalScore = score;
    if (
      selectedOption ===
      current.answer
    ) {
      finalScore = score + 1;
      setScore(
        (prev) =>
          prev + 1
      );

    }

    setSelectedOption("");

    if (
      currentQuestion <
      questions.length - 1
    ) {

      setCurrentQuestion(
        currentQuestion + 1
      );

    }

    else {
      submitTest(finalScore);
      setCompleted(true);

    }

  };

  const minutes =
    Math.floor(
      timeLeft / 60
    );

  const seconds =
    timeLeft % 60;

  if (!category) {

    return (

      <div className="min-h-screen bg-transparent text-white px-6 py-10 relative">
        <button
          type="button"
          onClick={() => onNavigate?.("home")}
          className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
        >
          Back to dashboard
        </button>

        <div className="mx-auto max-w-6xl">

          <h1 className="mt-12 text-2xl font-black mb-3">
            Aptitude Assessment
          </h1>

          <p className="text-slate-400 mb-10">
            AI monitored placement testing system
          </p>

          <div className="grid md:grid-cols-3 gap-6">

            {categories.map(
              (item) => (
              <button
                key={item.key}
                onClick={() =>
                  startCategory(
                    item.key
                  )
                }
                className="rounded-2xl glass-panel glass-panel-hover p-8 text-left hover:border-cyan-400 transition"
              >
                <h2 className="text-2xl font-bold mb-3">
                  {item.title}
                </h2>
                <p className="text-slate-400 text-sm">
                  Start monitored assessment
                </p>
              </button>
            ))}

          </div>

        </div>

      </div>

    );

  }

  if (completed) {

    const percentage =
      Math.floor(
        (score /
          questions.length) *
          100
      );

    return (

      <div className="min-h-screen bg-transparent text-white px-6 py-10 relative">
        <button
          type="button"
          onClick={() => onNavigate?.("home")}
          className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
        >
          Back to dashboard
        </button>

        <div className="mx-auto max-w-5xl">

          <h1 className="mt-12 text-2xl font-black mb-10">
            AI Proctoring Report
          </h1>

          <div className="grid md:grid-cols-4 gap-5">
            <div className="glass-panel rounded-2xl p-6">
              <p className="text-slate-400 mb-2">
                Aptitude Score
              </p>
              <h2 className="text-5xl font-black text-cyan-400">
                {percentage}%
              </h2>
            </div>
            <div className="glass-panel rounded-2xl p-6">
              <p className="text-slate-400 mb-2">
                Attention
              </p>
              <h2 className="text-5xl font-black text-green-400">
                {attentionScore}%
              </h2>
            </div>
            <div className="glass-panel rounded-2xl p-6">
              <p className="text-slate-400 mb-2">
                Suspicious Activity
              </p>
              <h2 className="text-5xl font-black text-red-400">
                {suspiciousCount}
              </h2>
            </div>
            <div className="glass-panel rounded-2xl p-6">
              <p className="text-slate-400 mb-2">
                Eye Direction
              </p>
              <h2 className="text-2xl font-black text-yellow-400">
                {eyeDirection}
              </h2>
            </div>
          </div>

        </div>

      </div>

    );

  }

  const current =
    questions[
      currentQuestion
    ];

  return (

    <div className="min-h-screen bg-transparent text-white px-6 py-8 relative">
      <button
        type="button"
        onClick={() => onNavigate?.("home")}
        className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
      >
        Back to dashboard
      </button>

      <div className="mx-auto mt-12 max-w-7xl grid lg:grid-cols-[320px_1fr] gap-6">

        <div className="space-y-5">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored={true}
              screenshotFormat="image/jpeg"
            />
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-slate-400 text-sm mb-2">
              Face Status
            </p>
            <h2 className={`text-3xl font-black ${
              faceDetected
                ? "text-green-400"
                : "text-red-400"
            }`}>
              {
                faceDetected
                  ? "Face Detected"
                  : "Face Missing"
              }
            </h2>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-slate-400 text-sm mb-2">
              Eye Direction
            </p>
            <h2 className="text-2xl font-black text-yellow-400">
              {eyeDirection}
            </h2>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-slate-400 text-sm mb-2">
              Suspicious Activity
            </p>
            <h2 className="text-4xl font-black text-red-400">
              {suspiciousCount}
            </h2>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-slate-400 text-sm mb-2">
              Attention Score
            </p>
            <h2 className="text-4xl font-black text-green-400">
              {attentionScore}%
            </h2>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-slate-400 text-sm mb-2">
              Tab Switches
            </p>
            <h2 className="text-4xl font-black text-cyan-400">
              {tabSwitches}
            </h2>
          </div>
        </div>
        <div className="glass-panel rounded-3xl p-8">

          <div className="flex justify-between items-center mb-8">

            <div>

              <p className="text-cyan-400 mb-2">
                Question {
                  currentQuestion + 1
                }
              </p>

              <h1 className="text-2xl font-black">

                {current.question}

              </h1>

            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl px-6 py-4">

              <p className="text-slate-400 text-sm">
                Remaining
              </p>

              <h2 className="text-3xl font-black text-cyan-400">

                {minutes}:
                {seconds
                  .toString()
                  .padStart(2, "0")}

              </h2>

            </div>

          </div>

          <div className="space-y-4">

            {current.options.map(
              (option,
              index) => (

              <button
                key={index}
                onClick={() =>
                  setSelectedOption(
                    option
                  )
                }
                className={`w-full rounded-2xl p-5 text-left border transition ${
                  selectedOption ===
                  option
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-white/5 bg-white/5 hover:border-cyan-500/30 hover:bg-white/10"
                }`}
              >
                {option}
              </button>

            ))}

          </div>

          <button
            onClick={
              handleNext
            }

            disabled={
              !selectedOption
            }

            className="mt-8 bg-cyan-500 hover:bg-cyan-400 transition rounded-2xl px-8 py-4 text-xl font-black disabled:opacity-40"
          >

            {
              currentQuestion ===
              questions.length - 1
                ? "Submit Test"
                : "Next Question"
            }

          </button>

        </div>

      </div>

    </div>

  );

};

export default AptitudeTest;
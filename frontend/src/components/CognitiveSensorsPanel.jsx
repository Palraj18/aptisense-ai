import React, { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Eye, Mic2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "./ui/Button";
import { GlassCard } from "./ui/GlassCard";
import { computeCameraSensorSummary, computeVoiceSensorSummary } from "../utils/cognitiveSensors";

const DEFAULT_CAMERA_METRICS = {
  faceDetected: false,
  focusScore: 0.5,
  distractionScore: 0.5,
  confusionScore: 0.2,
  lookAwayRatio: 0,
  cameraReady: false
};

const DEFAULT_VOICE_METRICS = {
  speechRateWpm: 0,
  pauseRatio: 0,
  hesitationScore: 0.1,
  fillerRate: 0,
  energyLevel: 0,
  microphoneReady: false
};

export const CognitiveSensorsPanel = ({ sessionId, onMetricsUpdate }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const trackingRef = useRef({ lastSilenceMs: 0, silentFrames: 0, speechWords: 0, lastTranscript: "" });
  const [cameraState, setCameraState] = useState("idle");
  const [micState, setMicState] = useState("idle");
  const [cameraMetrics, setCameraMetrics] = useState(DEFAULT_CAMERA_METRICS);
  const [voiceMetrics, setVoiceMetrics] = useState(DEFAULT_VOICE_METRICS);
  const [error, setError] = useState(null);

  const hasFaceDetector = useMemo(() => typeof window !== "undefined" && "FaceDetector" in window, []);

  const stopSensors = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (audioRef.current) {
      try {
        audioRef.current.close();
      } catch {}
      audioRef.current = null;
    }

    const video = videoRef.current;
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      video.srcObject = null;
    }

    setCameraState("idle");
    setMicState("idle");
    setCameraMetrics(DEFAULT_CAMERA_METRICS);
    setVoiceMetrics(DEFAULT_VOICE_METRICS);
  };

  const requestPermissions = async () => {
    setError(null);
    setCameraState("requesting");
    setMicState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        await video.play();
        setCameraState("granted");
        setCameraMetrics((prev) => ({ ...prev, cameraReady: true }));
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      audioRef.current = audioContext;
      setMicState("granted");
      setVoiceMetrics((prev) => ({ ...prev, microphoneReady: true }));

      trackingRef.current.startTime = performance.now();
      trackingRef.current.fillerWords = 0;

      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join(" ");
          if (transcript !== trackingRef.current.lastTranscript) {
            trackingRef.current.lastTranscript = transcript;
            const words = transcript.trim().split(/\s+/).filter(Boolean);
            trackingRef.current.speechWords = words.length;
            trackingRef.current.fillerWords = words.reduce((acc, word) => {
              const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
              return acc + (["um", "uh", "like", "you know", "so", "actually"].includes(cleaned) ? 1 : 0);
            }, 0);
          }
        };
        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      }

      const sampleSensors = async () => {
        if (!videoRef.current || !analyserRef.current) {
          animationFrameRef.current = requestAnimationFrame(sampleSensors);
          return;
        }

        const cameraSummary = await computeCameraSensorSummary({
          video: videoRef.current,
          hasFaceDetector,
          tracking: trackingRef
        });
        const voiceSummary = computeVoiceSensorSummary({
          analyser: analyserRef.current,
          tracking: trackingRef.current
        });

        setCameraMetrics(cameraSummary);
        setVoiceMetrics(voiceSummary);
        onMetricsUpdate({ cameraMetrics: cameraSummary, voiceMetrics: voiceSummary });

        animationFrameRef.current = requestAnimationFrame(sampleSensors);
      };

      animationFrameRef.current = requestAnimationFrame(sampleSensors);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Permission denied");
      setCameraState("denied");
      setMicState("denied");
    }
  };

  useEffect(() => {
    return () => {
      stopSensors();
    };
  }, []);

  return (
    <GlassCard className="space-y-5 border-neuro-cyan/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neuro-cyan">Sensor fusion</p>
          <h3 className="text-xl font-bold text-white">Camera + microphone analytics</h3>
        </div>
        <div className="flex gap-2">
          <Button onClick={requestPermissions} className="whitespace-nowrap">Enable camera & mic</Button>
          <Button onClick={stopSensors} variant="secondary" className="whitespace-nowrap">Stop camera & mic</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Camera className="h-4 w-4 text-neuro-cyan" /> Camera access
          </div>
          <p className="mt-3 text-sm text-slate-400">{cameraState === "granted" ? "Ready" : cameraState === "requesting" ? "Requesting permissions..." : cameraState === "denied" ? "Permission denied" : "Click above to enable"}</p>
          <video ref={videoRef} className="mt-4 h-44 w-full rounded-2xl border border-white/10 bg-black/20 object-cover" playsInline />
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Mic2 className="h-4 w-4 text-neuro-cyan" /> Microphone access
          </div>
          <p className="mt-3 text-sm text-slate-400">{micState === "granted" ? "Ready" : micState === "requesting" ? "Requesting permissions..." : micState === "denied" ? "Permission denied" : "Click above to enable"}</p>
          <div className="mt-4 h-12 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <span>Energy</span>
              <strong>{Math.round(voiceMetrics.energyLevel * 100)}%</strong>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-neuro-cyan" style={{ width: `${Math.min(100, Math.max(0, voiceMetrics.energyLevel * 100))}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300"><Eye className="h-4 w-4 text-neuro-cyan" /> Focus score</div>
          <div className="mt-3 text-3xl font-bold text-white">{Math.round(cameraMetrics.focusScore * 100)}%</div>
          <p className="mt-2 text-sm text-slate-400">Higher means sustained attention and straight-ahead gaze.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300"><Sparkles className="h-4 w-4 text-neuro-violet" /> Distraction</div>
          <div className="mt-3 text-3xl font-bold text-white">{Math.round(cameraMetrics.distractionScore * 100)}%</div>
          <p className="mt-2 text-sm text-slate-400">Uses head position and eyes to infer looking away events.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="h-4 w-4 text-neuro-warning" /> Hesitation</div>
          <div className="mt-3 text-3xl font-bold text-white">{Math.round(voiceMetrics.hesitationScore * 100)}%</div>
          <p className="mt-2 text-sm text-slate-400">Combines silent pauses, filler words, and inconsistent energy.</p>
        </div>
      </div>

      {error && <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
    </GlassCard>
  );
};

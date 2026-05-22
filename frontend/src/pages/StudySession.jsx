import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Clock3, Lightbulb, Send, Timer, Waves } from "lucide-react";
import { feedbackStream, metricSeed } from "../data/neuroData";
import { Button } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";

const StudySession = ({ topic, behavior, onNext }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 2200);
    return () => window.clearInterval(timer);
  }, []);

  const words = behavior.text.trim() ? behavior.text.trim().split(/\s+/).length : 0;
  const metrics = useMemo(
    () =>
      metricSeed.map((metric, index) => ({
        ...metric,
        value: Math.max(12, Math.min(96, metric.value + ((tick + index * 11) % 19) - 9))
      })),
    [tick]
  );
  const feedback = feedbackStream[tick % feedbackStream.length];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <GlassCard className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-neuro-cyan">Study workspace</p>
            <h2 className="mt-1 text-3xl font-bold text-white">{topic || "DBMS Normalization"}</h2>
            <p className="mt-2 text-sm text-slate-400">Explain the topic naturally. AptiSense AI observes behavior, not raw ML values.</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-slate-400"><Timer className="h-4 w-4" /> Session</div>
              <div className="mt-1 text-xl font-bold text-white">18:42</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-slate-400"><Clock3 className="h-4 w-4" /> Words</div>
              <div className="mt-1 text-xl font-bold text-white">{words}</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="border-neuro-cyan/20">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-neuro-cyan/15 text-neuro-cyan">
              <Waves className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-slate-400">Current state</p>
              <h3 className="font-bold text-white">Focused but cognitively loaded</h3>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <GlassCard className="min-h-[560px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Explain in your own words</h3>
              <p className="text-sm text-slate-400">The interface detects hesitation, correction bursts, and confidence mismatch.</p>
            </div>
            <Button onClick={onNext}>
              Quiz <Send className="h-4 w-4" />
            </Button>
          </div>
          <textarea
            className="min-h-[430px] w-full resize-none rounded-lg border border-white/10 bg-black/25 p-5 text-base leading-8 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-neuro-cyan/60 focus:shadow-cyan"
            value={behavior.text}
            placeholder="Start explaining the selected concept..."
            onKeyDown={behavior.onKeyDown}
            onChange={(event) => behavior.onTextChange(event.target.value)}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-white/[0.06] p-3 text-sm text-slate-300">Backspaces <strong className="float-right text-white">{behavior.totals.backspaces}</strong></div>
            <div className="rounded-lg bg-white/[0.06] p-3 text-sm text-slate-300">Avg pause <strong className="float-right text-white">{behavior.totals.averagePauseMs}ms</strong></div>
            <div className="rounded-lg bg-white/[0.06] p-3 text-sm text-slate-300">Focus loss <strong className="float-right text-white">{behavior.totals.focusLossEvents}</strong></div>
          </div>
        </GlassCard>

        <div className="grid gap-6">
          <GlassCard>
            <h3 className="mb-5 flex items-center gap-2 font-bold text-white"><Lightbulb className="h-5 w-5 text-neuro-warning" /> Real-time metrics</h3>
            <div className="space-y-5">
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-300">{metric.label}</span>
                    <span className="font-semibold text-white">{metric.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: metric.color, boxShadow: `0 0 18px ${metric.color}` }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 0.7 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="relative overflow-hidden">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-neuro-violet/20 text-neuro-violet">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-white">Live AI feedback</h3>
                <p className="text-xs text-slate-400">Adaptive prompts from behavioral signals</p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={feedback}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="rounded-lg border border-white/10 bg-black/25 p-4 text-sm text-slate-200"
              >
                {feedback}
              </motion.div>
            </AnimatePresence>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};

export default StudySession;

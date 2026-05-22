import React from "react";
import { Activity, Edit3, Gauge, Keyboard, Zap } from "lucide-react";
import { timeline } from "../data/neuroData";
import { GlassCard } from "../components/ui/GlassCard";

const icons = {
  warning: Zap,
  cyan: Edit3,
  danger: Gauge,
  success: Keyboard,
  violet: Activity
};

const tones = {
  warning: "text-neuro-warning border-neuro-warning/30 bg-neuro-warning/10",
  cyan: "text-neuro-cyan border-neuro-cyan/30 bg-neuro-cyan/10",
  danger: "text-neuro-danger border-neuro-danger/30 bg-neuro-danger/10",
  success: "text-neuro-success border-neuro-success/30 bg-neuro-success/10",
  violet: "text-neuro-violet border-neuro-violet/30 bg-neuro-violet/10"
};

const MicroTimeline = () => (
  <section className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
    <GlassCard>
      <p className="text-sm text-neuro-cyan">Micro-Behavior Timeline</p>
      <h1 className="mt-1 text-3xl font-bold text-white">Behavior events during study</h1>
      <div className="mt-8 space-y-4">
        {timeline.map((event, index) => {
          const Icon = icons[event.tone];
          return (
            <div key={event.time} className="grid gap-4 md:grid-cols-[90px_1fr]">
              <div className="text-sm font-semibold text-slate-400">{event.time}</div>
              <div className="relative rounded-lg border border-white/10 bg-white/[0.05] p-4">
                {index !== timeline.length - 1 && <span className="absolute -bottom-4 left-5 h-4 w-px bg-white/15" />}
                <div className="flex gap-4">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${tones[event.tone]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-white">{event.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{event.detail}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  </section>
);

export default MicroTimeline;

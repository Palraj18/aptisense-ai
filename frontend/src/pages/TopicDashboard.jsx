import React, { useState } from "react";
import { BookOpen, Search, ShieldCheck } from "lucide-react";
import { topics } from "../data/neuroData";
import { Button } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";
import { ProgressRing } from "../components/ui/ProgressRing";

const colors = {
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  cyan: "#06B6D4",
  violet: "#7C3AED"
};

const TopicDashboard = ({ onStart }) => {
  const [query, setQuery] = useState("");

  const filtered = topics.filter((topic) =>
    `${topic.title} ${topic.domain}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr] lg:px-8">

      <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-neuro-violet/20 text-neuro-violet">
            <BookOpen className="h-5 w-5" />
          </span>

          <div>
            <h2 className="font-bold text-white">
              Interview Intelligence
            </h2>

            <p className="text-xs text-slate-400">
              AI candidate analysis
            </p>
          </div>
        </div>

        {[
          "Overview",
          "Behavior Tracking",
          "Eye Attention",
          "Confidence Analysis",
          "Placement Reports"
        ].map((item, index) => (
          <button
            key={item}
            className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-sm ${
              index === 0
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/[0.06]"
            }`}
          >
            {item}
          </button>
        ))}
      </aside>

      <main>

        <GlassCard className="mb-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>
              <p className="text-sm text-neuro-cyan">
                AI Interview Dashboard
              </p>

              <h1 className="mt-1 text-3xl font-bold text-white">
                Analyze candidate performance intelligently.
              </h1>
            </div>

            <label className="flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-4 py-3 md:w-80">
              <Search className="h-4 w-4 text-slate-500" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search interview modules"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>

          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {filtered.map((topic, index) => {

            const toneColor =
              colors?.[topic?.tone] || "#7C3AED";

            return (
              <GlassCard
                key={topic.title || index}
                delay={index * 0.05}
                className="group transition hover:-translate-y-1 hover:border-neuro-cyan/40"
              >

                <div className="mb-5 flex items-start justify-between gap-4">

                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {topic.title || "Interview Module"}
                    </h3>

                    <p className="text-sm text-slate-400">
                      {topic.domain || "AI Assessment"}
                    </p>
                  </div>

                  <ProgressRing
                    value={topic.progress || 0}
                    color={toneColor}
                  />

                </div>

                <div className="mb-5 flex items-center gap-2">

                  <span
                    className="rounded-full border px-3 py-1 text-xs"
                    style={{
                      borderColor: toneColor,
                      color: toneColor
                    }}
                  >
                    {(topic.title || "Assessment")} →
                    {" "}
                    {(topic.status || "Ready")}
                  </span>

                </div>

                <p className="mb-5 text-sm leading-6 text-slate-400">
                  AI analyzes confidence, eye attention,
                  hesitation patterns, facial emotion,
                  and communication behavior during mock interviews.
                </p>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    onStart?.(topic.title || "Interview")
                  }
                >
                  <ShieldCheck className="h-4 w-4" />
                  Start Interview Session
                </Button>

              </GlassCard>
            );
          })}
        </div>

      </main>
    </section>
  );
};

export default TopicDashboard;
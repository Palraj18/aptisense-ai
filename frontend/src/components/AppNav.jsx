import React from "react";

export const AppNav = ({ setView }) => {

  const navItems = [
    ["home", "Home"],
    ["interview", "Interview Types"],
    ["mock", "Mock Interview"],
    ["analysis", "AI Analysis"],
    ["placement", "Placement Report"],
    ["performance", "Performance Timeline"]
  ];

  return (

    <div className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

        <div>

          <h1 className="text-3xl font-bold text-white">
            AptiSense AI
          </h1>

          <p className="text-sm text-slate-400">
            AI Placement Intelligence System
          </p>

        </div>

        <div className="flex gap-3">

          {navItems.map(([id, label]) => (

            <button
              key={id}
              onClick={() => setView(id)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-cyan-500/20 hover:border-cyan-400"
            >
              {label}
            </button>

          ))}

        </div>

      </div>

    </div>
  );
};
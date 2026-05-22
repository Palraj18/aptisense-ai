import React from "react";
import { cn } from "../../lib/utils";

export const Button = ({ className, variant = "primary", ...props }) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-neuro-violet to-neuro-cyan text-white shadow-glow hover:scale-[1.02]",
    secondary:
      "border border-white/12 bg-white/8 text-neuro-text hover:border-white/25 hover:bg-white/12",
    ghost: "text-slate-300 hover:bg-white/10 hover:text-white"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

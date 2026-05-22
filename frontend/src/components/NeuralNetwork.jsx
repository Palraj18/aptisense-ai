import React from "react";
import { motion } from "framer-motion";

export const NeuralNetwork = () => (
  <div className="absolute inset-0 overflow-hidden">
    <svg className="h-full w-full opacity-70" viewBox="0 0 900 520" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="line" x1="0" x2="1">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {[
        [120, 120, 330, 210],
        [330, 210, 520, 120],
        [330, 210, 610, 330],
        [160, 360, 330, 210],
        [520, 120, 760, 210],
        [610, 330, 760, 210],
        [160, 360, 610, 330]
      ].map(([x1, y1, x2, y2], index) => (
        <line
          key={index}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="url(#line)"
          strokeWidth="1.5"
          className="neural-line"
          opacity="0.7"
        />
      ))}
      {[
        [120, 120],
        [330, 210],
        [520, 120],
        [610, 330],
        [760, 210],
        [160, 360]
      ].map(([cx, cy], index) => (
        <motion.circle
          key={index}
          cx={cx}
          cy={cy}
          r="8"
          fill={index % 2 ? "#06B6D4" : "#7C3AED"}
          animate={{ r: [6, 11, 6], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.6, delay: index * 0.2, repeat: Infinity }}
          style={{ filter: "drop-shadow(0 0 16px currentColor)" }}
        />
      ))}
    </svg>
  </div>
);

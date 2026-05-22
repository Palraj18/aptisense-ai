/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        neuro: {
          bg: "#0B1020",
          panel: "rgba(255,255,255,0.08)",
          violet: "#7C3AED",
          cyan: "#06B6D4",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          text: "#F3F4F6"
        }
      },
      boxShadow: {
        glow: "0 0 38px rgba(124,58,237,0.38)",
        cyan: "0 0 34px rgba(6,182,212,0.28)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"]
      },
      backgroundImage: {
        "neuro-grid":
          "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

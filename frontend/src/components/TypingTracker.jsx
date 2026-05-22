import React from "react";

const TypingTracker = ({ text, totals, onTyped, onKeyDown }) => {
  return (
    <section className="card">
      <h3>Type Your Explanation</h3>
      <p className="muted">
        Explain the selected topic in your own words. Behavior signals are tracked in real time.
      </p>
      <textarea
        className="textarea"
        value={text}
        placeholder="Start typing your explanation..."
        onKeyDown={onKeyDown}
        onChange={(event) => onTyped(event.target.value)}
      />
      <div className="stats-grid">
        <div className="stat"><span>Backspaces</span><strong>{totals.backspaces}</strong></div>
        <div className="stat"><span>Avg Pause</span><strong>{totals.averagePauseMs}ms</strong></div>
        <div className="stat"><span>Focus Loss</span><strong>{totals.focusLossEvents}</strong></div>
      </div>
    </section>
  );
};

export default TypingTracker;

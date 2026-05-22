const makeSnapshot = ({
  elapsedMs,
  pauseMs,
  charsAdded,
  backspaces,
  rewriteEvents,
  focusLossEvents
}) => ({
  elapsedMs,
  pauseMs,
  charsAdded,
  backspaces,
  rewriteEvents,
  focusLossEvents,
  timestamp: new Date().toISOString()
});

export const createTrackerSession = () => {
  const startedAt = Date.now();
  let lastKeyAt = startedAt;
  let buffer = "";
  let focusLossEvents = 0;
  let history = [];

  const registerFocusLoss = () => {
    focusLossEvents += 1;
  };

  const registerInput = (nextText, keyEventMeta) => {
    const now = Date.now();
    const pauseMs = now - lastKeyAt;
    lastKeyAt = now;

    const charsAdded = Math.max(nextText.length - buffer.length, 0);
    const backspaces = keyEventMeta?.key === "Backspace" ? 1 : 0;
    const rewriteEvents = nextText.length < buffer.length ? 1 : 0;

    buffer = nextText;

    const snapshot = makeSnapshot({
      elapsedMs: now - startedAt,
      pauseMs,
      charsAdded,
      backspaces,
      rewriteEvents,
      focusLossEvents
    });

    history = [...history, snapshot];
    return snapshot;
  };

  const getHistory = () => history;

  return {
    registerInput,
    registerFocusLoss,
    getHistory
  };
};

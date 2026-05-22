import { useEffect, useMemo, useRef, useState } from "react";
import { createTrackerSession } from "../services/trackingService";

export const useTypingBehavior = () => {
  const trackerRef = useRef(createTrackerSession());
  const [text, setText] = useState("");
  const [records, setRecords] = useState([]);
  const [activeKey, setActiveKey] = useState(null);

  const onTextChange = (nextText) => {
    const row = trackerRef.current.registerInput(nextText, { key: activeKey });
    setText(nextText);
    setRecords((prev) => [...prev, row]);
  };

  const onKeyDown = (event) => {
    setActiveKey(event.key);
  };

  useEffect(() => {
    const handleBlur = () => trackerRef.current.registerFocusLoss();
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  const totals = useMemo(() => {
    const backspaces = records.reduce((acc, r) => acc + r.backspaces, 0);
    const pauseMs = records.reduce((acc, r) => acc + r.pauseMs, 0);
    return {
      backspaces,
      averagePauseMs: records.length ? Math.round(pauseMs / records.length) : 0,
      focusLossEvents: records[records.length - 1]?.focusLossEvents || 0,
      activeKey
    };
  }, [records, activeKey]);

  return {
    text,
    records,
    totals,
    onKeyDown,
    onTextChange
  };
};

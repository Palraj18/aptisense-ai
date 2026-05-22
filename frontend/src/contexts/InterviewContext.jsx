import React, { createContext, useContext, useState, useCallback } from 'react';

const InterviewContext = createContext();

export function InterviewProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [interviewState, setInterviewState] = useState({
    status: 'idle', // idle, starting, in_progress, paused, completed
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 0,
    answers: [],
    startTime: null,
    endTime: null,
    report: null,
  });

  const startSession = useCallback((newSessionId) => {
    setSessionId(newSessionId);
    setInterviewState(prev => ({
      ...prev,
      status: 'in_progress',
      startTime: new Date(),
    }));
  }, []);

  const updateQuestion = useCallback((question, index, total) => {
    setInterviewState(prev => ({
      ...prev,
      currentQuestion: question,
      questionIndex: index,
      totalQuestions: total,
    }));
  }, []);

  const recordAnswer = useCallback((question, answer, analysis) => {
    setInterviewState(prev => ({
      ...prev,
      answers: [...prev.answers, { question, answer, analysis }],
    }));
  }, []);

  const endSession = useCallback((report) => {
    setInterviewState(prev => ({
      ...prev,
      status: 'completed',
      endTime: new Date(),
      report,
    }));
  }, []);

  const resetSession = useCallback(() => {
    setSessionId(null);
    setInterviewState({
      status: 'idle',
      currentQuestion: null,
      questionIndex: 0,
      totalQuestions: 0,
      answers: [],
      startTime: null,
      endTime: null,
      report: null,
    });
  }, []);

  const pauseSession = useCallback(() => {
    setInterviewState(prev => ({
      ...prev,
      status: 'paused',
    }));
  }, []);

  const resumeSession = useCallback(() => {
    setInterviewState(prev => ({
      ...prev,
      status: 'in_progress',
    }));
  }, []);

  const value = {
    sessionId,
    interviewState,
    startSession,
    updateQuestion,
    recordAnswer,
    endSession,
    resetSession,
    pauseSession,
    resumeSession,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within InterviewProvider');
  }
  return context;
}

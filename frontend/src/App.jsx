import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { InterviewProvider } from './contexts/InterviewContext';
import HomePage from './pages/Home';
import InterviewPage from './pages/Interview';
import InterviewTypesPage from './pages/InterviewTypes';
import MockInterviewPage from './pages/MockInterview';
import AptitudeTestPage from './pages/AptitudeTest';
import DashboardPage from './pages/Dashboard';
import ResultsPage from './pages/Results';

function AppShell() {
  const [currentView, setCurrentView] = useState('home');
  const [sessionId, setSessionId] = useState(null);

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const handleSessionCreated = (nextSessionId) => {
    setSessionId(nextSessionId);
  };

  const handleInterviewComplete = (nextSessionId) => {
    if (nextSessionId) {
      setSessionId(nextSessionId);
    }

    setCurrentView('results');
  };

  if (currentView === 'interview') {
    return <InterviewPage onNavigate={handleNavigate} onSessionCreated={handleSessionCreated} onComplete={handleInterviewComplete} />;
  }

  if (currentView === 'interview-types') {
    return <InterviewTypesPage onNavigate={handleNavigate} onComplete={handleInterviewComplete} />;
  }

  if (currentView === 'mock-interview') {
    return <MockInterviewPage onNavigate={handleNavigate} onComplete={handleInterviewComplete} />;
  }

  if (currentView === 'aptitude-test') {
    return <AptitudeTestPage onNavigate={handleNavigate} />;
  }

  if (currentView === 'analysis-dashboard') {
    return <DashboardPage onNavigate={handleNavigate} sessionId={sessionId} />;
  }

  if (currentView === 'results') {
    return <ResultsPage sessionId={sessionId} onNavigate={handleNavigate} />;
  }

  return <HomePage onNavigate={handleNavigate} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <InterviewProvider>
        <AppShell />
      </InterviewProvider>
    </ThemeProvider>
  );
}
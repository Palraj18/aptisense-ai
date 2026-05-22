import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { InterviewProvider } from './contexts/InterviewContext';
import { MainLayout } from './layouts/MainLayout';
import InterviewPage from './pages/Interview';
import ResultsPage from './pages/Results';
import DashboardPage from './pages/Dashboard';

function HomePage() {
  const { theme } = useTheme();

  const features = [
    {
      icon: '🤖',
      title: 'Adaptive AI Interview',
      description: 'Real-time AI interviewer that adapts to your responses with intelligent follow-up questions',
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Comprehensive scoring across 8+ dimensions including communication, technical depth, and more',
    },
    {
      icon: '🔍',
      title: 'Proctoring System',
      description: 'Real-time monitoring with face detection, eye tracking, and integrity scoring',
    },
    {
      icon: '💼',
      title: 'Recruiter Insights',
      description: 'Professional recommendations and detailed candidate assessments',
    },
  ];

  return (
    <MainLayout>
      <div style={{ backgroundColor: theme.colors.bgPrimary, minHeight: '100vh' }}>
        {/* Hero Section */}
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderBottom: `1px solid ${theme.colors.borderLight}`,
          }}
        >
          <h1
            style={{
              fontSize: theme.fonts.size['3xl'],
              fontWeight: '900',
              marginBottom: '1rem',
              background: `linear-gradient(135deg, ${theme.colors.primary}, #0099FF)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Professional AI Recruitment Platform
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: theme.fonts.size.lg, marginBottom: '2rem' }}>
            Experience the future of technical interviewing with adaptive AI and enterprise-grade analytics
          </p>
          <button
            onClick={() => {}}
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.bgPrimary,
              border: 'none',
              padding: '0.75rem 2rem',
              fontSize: theme.fonts.size.base,
              fontWeight: '700',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: `all ${theme.transitions.base}`,
            }}
            onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.target.style.opacity = '1')}
          >
            Start Interview →
          </button>
        </div>

        {/* Features Section */}
        <div style={{ padding: '3rem 2rem' }}>
          <h2
            style={{
              fontSize: theme.fonts.size['2xl'],
              fontWeight: '900',
              marginBottom: '3rem',
              textAlign: 'center',
            }}
          >
            Powerful Features
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: theme.colors.surfaceSecondary,
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  transition: `all ${theme.transitions.base}`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary;
                  e.currentTarget.style.boxShadow = theme.shadows.glow;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.borderLight;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: theme.fonts.size.lg, fontWeight: '700', marginBottom: '0.5rem' }}>
                  {feature.title}
                </h3>
                <p style={{ color: theme.colors.textTertiary }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div style={{ padding: '3rem 2rem', backgroundColor: theme.colors.surfaceSecondary, borderTop: `1px solid ${theme.colors.borderLight}` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: theme.fonts.size['3xl'], fontWeight: '900', color: theme.colors.primary, marginBottom: '0.5rem' }}>
                10K+
              </div>
              <p style={{ color: theme.colors.textTertiary }}>Interviews Conducted</p>
            </div>
            <div>
              <div style={{ fontSize: theme.fonts.size['3xl'], fontWeight: '900', color: theme.colors.primary, marginBottom: '0.5rem' }}>
                98%
              </div>
              <p style={{ color: theme.colors.textTertiary }}>Accuracy Rate</p>
            </div>
            <div>
              <div style={{ fontSize: theme.fonts.size['3xl'], fontWeight: '900', color: theme.colors.primary, marginBottom: '0.5rem' }}>
                500+
              </div>
              <p style={{ color: theme.colors.textTertiary }}>Companies Using</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [sessionId, setSessionId] = useState(null);

  // Simple routing based on page state
  const renderPage = () => {
    switch (currentPage) {
      case 'interview':
        return <InterviewPage onSessionCreated={(id) => setSessionId(id)} />;
      case 'results':
        return sessionId ? <ResultsPage sessionId={sessionId} /> : <HomePage />;
      case 'dashboard':
        return <DashboardPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <ThemeProvider>
      <InterviewProvider>
        {renderPage()}
      </InterviewProvider>
    </ThemeProvider>
  );
}

export default App;

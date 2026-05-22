import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { interviewAPI } from '../services/api';
import { MainLayout } from '../layouts/MainLayout';
import InterviewChatComponent from '../components/InterviewChatComponent';
import { ProctoringPanel } from '../components/ProctoringPanel';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function InterviewPage({ onSessionCreated, onComplete }) {
  const { theme } = useTheme();
  const [sessionId, setSessionId] = useState(null);
  const [sessionState, setSessionState] = useState('setup'); // setup, starting, in_progress, ended
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [interviewData, setInterviewData] = useState({
    position: 'Software Engineer',
    experience_level: 'mid',
    interview_type: 'technical',
    enableProctoring: true,
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Timer effect
  useEffect(() => {
    if (sessionState !== 'in_progress') return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await interviewAPI.start({
        interview_type: interviewData.interview_type,
        position: interviewData.position,
        experience_level: interviewData.experience_level,
        enable_proctoring: interviewData.enableProctoring,
      });

      const session = response.data;
      setSessionId(session.session_id);
      onSessionCreated?.(session.session_id);
      setCurrentQuestion(session.first_question);
      setCurrentQuestionId(session.first_question_id);
      setSessionState('in_progress');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error starting interview');
    } finally {
      setIsLoading(false);
    }
  }, [interviewData]);

  const handleAnswerSubmitted = useCallback(async (analysisResult) => {
    setAnswers(prev => [...prev, analysisResult]);

    // Get next question
    try {
      const response = await interviewAPI.getNextQuestion(sessionId);
      if (response.data.should_continue) {
        setCurrentQuestion(response.data.question);
        setCurrentQuestionId(response.data.question_id);
        setFollowUpCount(0);
      } else {
        // Interview should end
        endInterview();
      }
    } catch (err) {
      setError('Error loading next question');
    }
  }, [sessionId]);

  const handleFollowUpQuestion = useCallback((followUp) => {
    setCurrentQuestion(followUp);
    setFollowUpCount(prev => prev + 1);
  }, []);

  const endInterview = useCallback(async () => {
    try {
      await interviewAPI.endInterview(sessionId);
      setSessionState('ended');
      onComplete?.(sessionId);
    } catch (err) {
      setError('Error ending interview');
    }
  }, [onComplete, sessionId]);

  // Setup screen
  if (sessionState === 'setup') {
    return (
      <MainLayout>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'transparent',
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '500px',
              borderRadius: '1rem',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}
          >
            <h1 style={{ fontSize: theme.fonts.size['3xl'], fontWeight: '900', marginBottom: '1rem' }}>
              Start Interview
            </h1>
            <p style={{ color: theme.colors.textTertiary, marginBottom: '2rem' }}>
              Configure your interview preferences
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, marginBottom: '0.5rem', fontWeight: '600' }}>
                  Position
                </label>
                <input
                  type="text"
                  value={interviewData.position}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, position: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: theme.colors.bgTertiary,
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: '0.5rem',
                    color: theme.colors.textPrimary,
                    fontSize: theme.fonts.size.base,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, marginBottom: '0.5rem', fontWeight: '600' }}>
                  Interview Type
                </label>
                <select
                  value={interviewData.interview_type}
                  onChange={(e) => setInterviewData(prev => ({ ...prev, interview_type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: theme.colors.bgTertiary,
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: '0.5rem',
                    color: theme.colors.textPrimary,
                    fontSize: theme.fonts.size.base,
                  }}
                >
                  <option value="hr">HR Round</option>
                  <option value="technical">Technical Round</option>
                  <option value="behavioral">Behavioral Round</option>
                  <option value="communication">Communication Round</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={interviewData.enableProctoring}
                    onChange={(e) => setInterviewData(prev => ({ ...prev, enableProctoring: e.target.checked }))}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ color: theme.colors.textSecondary }}>Enable Proctoring</span>
                </label>
              </div>
            </div>

            {error && (
              <div style={{ color: theme.colors.danger, marginBottom: '1rem', fontSize: theme.fonts.size.sm }}>
                {error}
              </div>
            )}

            <button
              onClick={startInterview}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: theme.colors.primary,
                color: theme.colors.bgPrimary,
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: theme.fonts.size.base,
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Starting...' : 'Start Interview'}
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Main interview screen
  if (sessionState === 'in_progress' && sessionId) {
    return (
      <MainLayout showSidebar={false}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: interviewData.enableProctoring ? '1fr 350px' : '1fr',
            gap: '2rem',
            minHeight: '100vh',
            padding: '2rem',
            backgroundColor: 'transparent',
          }}
        >
          {/* Main interview area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: `1px solid ${theme.colors.borderLight}`,
              }}
            >
              <div>
                <h2 style={{ fontSize: theme.fonts.size['2xl'], fontWeight: '700', marginBottom: '0.25rem' }}>
                  {interviewData.position}
                </h2>
                <p style={{ color: theme.colors.textTertiary }}>
                  Question {answers.length + 1}
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                }}
              >
                <Clock size={18} style={{ color: theme.colors.primary }} />
                <span style={{ fontSize: theme.fonts.size.lg, fontWeight: '700' }}>{formatTime(elapsedTime)}</span>
              </div>
            </div>

            {/* Interview Chat */}
            <InterviewChatComponent
              sessionId={sessionId}
              currentQuestion={currentQuestion}
              questionId={currentQuestionId}
              onAnswerSubmitted={handleAnswerSubmitted}
              onFollowUpQuestion={handleFollowUpQuestion}
              isLoading={isLoading}
            />

            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1, height: '4px', backgroundColor: theme.colors.bgTertiary, borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${((answers.length) / 5) * 100}%`,
                    backgroundColor: theme.colors.primary,
                    transition: 'width 300ms',
                  }}
                />
              </div>
              <span style={{ color: theme.colors.textTertiary, fontSize: theme.fonts.size.sm }}>
                {answers.length} / 5 answered
              </span>
            </div>
          </div>

          {/* Proctoring Panel */}
          {interviewData.enableProctoring && (
            <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
              <ProctoringPanel sessionId={sessionId} isActive={true} />
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // Ended screen
  if (sessionState === 'ended') {
    return (
      <MainLayout>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'transparent',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            <CheckCircle size={64} style={{ color: theme.colors.success, marginBottom: '1rem', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: theme.fonts.size['2xl'], fontWeight: '700', marginBottom: '1rem' }}>
              Interview Completed
            </h2>
            <p style={{ color: theme.colors.textTertiary, marginBottom: '2rem' }}>
              Your interview has been completed successfully. Your results are being analyzed by our AI system.
            </p>
            <button
              type="button"
              onClick={() => onComplete?.(sessionId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: theme.colors.primary,
                color: theme.colors.bgPrimary,
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              View Results
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return null;
}

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MainLayout } from '../layouts/MainLayout';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { interviewAPI } from '../services/api';
import { Download, Share2, Loader2, AlertCircle } from 'lucide-react';

export default function ResultsPage({ sessionId, onNavigate }) {
  const { theme } = useTheme();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [sessionId]);

  const fetchReport = async () => {
    try {
      const response = await interviewAPI.getReport(sessionId);
      setReport(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error loading report');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ color: theme.colors.textSecondary }}>Analyzing your interview...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'transparent',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${theme.colors.danger}`,
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={48} style={{ color: theme.colors.danger, margin: '0 auto 1rem' }} />
            <h2 style={{ color: theme.colors.textPrimary, marginBottom: '0.5rem' }}>Error Loading Report</h2>
            <p style={{ color: theme.colors.textSecondary }}>{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!report) {
    return null;
  }

  const getRecommendationColor = (status) => {
    switch (status) {
      case 'RECOMMENDED':
        return theme.colors.success;
      case 'CONDITIONAL':
        return theme.colors.warning;
      case 'NOT_RECOMMENDED':
        return theme.colors.danger;
      default:
        return theme.colors.info;
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: '2rem', backgroundColor: 'transparent', minHeight: '100vh' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '3rem',
            paddingBottom: '2rem',
            borderBottom: `1px solid ${theme.colors.borderLight}`,
          }}
        >
          <div>
            <h1 style={{ fontSize: theme.fonts.size['3xl'], fontWeight: '900', marginBottom: '0.5rem' }}>
              Interview Results
            </h1>
            <p style={{ color: theme.colors.textTertiary }}>
              {report.position} • {report.experience_level} level • {report.duration_minutes} mins
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => onNavigate?.('home')}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                color: theme.colors.textPrimary,
                cursor: 'pointer',
              }}
            >
              Back to dashboard
            </button>
            <button
              type="button"
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                color: theme.colors.textPrimary,
                cursor: 'pointer',
              }}
            >
              <Download size={18} />
              Download PDF
            </button>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: theme.colors.primary,
                border: 'none',
                borderRadius: '0.5rem',
                color: theme.colors.bgPrimary,
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              <Share2 size={18} />
              Share Results
            </button>
          </div>
        </div>

        {/* Recommendation Box */}
        {report.recommendation && (
          <div
            style={{
              backgroundColor: getRecommendationColor(report.recommendation.candidate_status) + '08',
              border: `2px solid ${getRecommendationColor(report.recommendation.candidate_status)}`,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '3rem',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'start' }}>
              <div
                style={{
                  fontSize: '3rem',
                  color: getRecommendationColor(report.recommendation.candidate_status),
                }}
              >
                {report.recommendation.candidate_status === 'RECOMMENDED'
                  ? '✓'
                  : report.recommendation.candidate_status === 'CONDITIONAL'
                  ? '⚠'
                  : '✗'}
              </div>
              <div>
                <h2
                  style={{
                    fontSize: theme.fonts.size['2xl'],
                    fontWeight: '700',
                    color: getRecommendationColor(report.recommendation.candidate_status),
                    marginBottom: '0.5rem',
                  }}
                >
                  {report.recommendation.candidate_status === 'RECOMMENDED'
                    ? 'Recommended for Next Round'
                    : report.recommendation.candidate_status === 'CONDITIONAL'
                    ? 'Conditional Recommendation'
                    : 'Not Recommended'}
                </h2>
                <p style={{ color: theme.colors.textSecondary, marginBottom: '1rem' }}>
                  {report.recommendation.recommendation_text}
                </p>
                {report.recommendation.recommended_for_round && (
                  <p style={{ color: theme.colors.textTertiary }}>
                    Recommended for: <strong>{report.recommendation.recommended_for_round}</strong> round
                  </p>
                )}
              </div>
            </div>

            {/* Strengths and Concerns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem',
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: `1px solid ${getRecommendationColor(report.recommendation.candidate_status)}33`,
              }}
            >
              <div>
                <h4 style={{ color: theme.colors.success, marginBottom: '0.75rem', fontWeight: '600' }}>Key Strengths</h4>
                <ul style={{ color: theme.colors.textSecondary, fontSize: theme.fonts.size.sm, lineHeight: '1.8' }}>
                  {report.recommendation.strengths.map((strength, idx) => (
                    <li key={idx}>✓ {strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ color: theme.colors.warning, marginBottom: '0.75rem', fontWeight: '600' }}>Areas to Address</h4>
                <ul style={{ color: theme.colors.textSecondary, fontSize: theme.fonts.size.sm, lineHeight: '1.8' }}>
                  {report.recommendation.concerns.map((concern, idx) => (
                    <li key={idx}>• {concern}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: theme.fonts.size['2xl'], fontWeight: '700', marginBottom: '1.5rem' }}>
            Detailed Analytics
          </h2>
          <AnalyticsDashboard metrics={report.metrics} proctoring={report.proctoring} />
        </div>

        {/* Interview Transcript */}
        {report.interview_transcript && report.interview_transcript.length > 0 && (
          <div
            className="glass-panel"
            style={{
              borderRadius: '0.75rem',
              padding: '2rem',
            }}
          >
            <h2 style={{ fontSize: theme.fonts.size['2xl'], fontWeight: '700', marginBottom: '1.5rem' }}>
              Interview Transcript
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {report.interview_transcript.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1rem' }}>
                  <div
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: item.role === 'interviewer' ? 'rgba(255, 255, 255, 0.05)' : theme.colors.primary + '18',
                      border: `1px solid ${item.role === 'interviewer' ? 'rgba(255, 255, 255, 0.08)' : theme.colors.primary + '30'}`,
                      borderRadius: '0.5rem',
                      fontSize: theme.fonts.size.xs,
                      fontWeight: '600',
                      color: item.role === 'interviewer' ? theme.colors.textSecondary : theme.colors.primary,
                      whiteSpace: 'nowrap',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {item.role === 'interviewer' ? '🤖 AI' : '👤 You'}
                  </div>
                  <p style={{ color: theme.colors.textSecondary }}>{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

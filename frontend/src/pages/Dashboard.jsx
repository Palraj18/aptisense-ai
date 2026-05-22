import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MainLayout } from '../layouts/MainLayout';
import { interviewAPI, getAnalyticsSummary, getAnalyticsSessions, getAptitudeAttempt } from '../services/api';
import { Sparkles, Brain, Shield, FileText, BarChart3, Target, Award, Eye, AlertCircle } from 'lucide-react';

const RecruiterBadge = ({ status }) => {
  let bg = 'rgba(239, 68, 68, 0.1)';
  let border = 'rgba(239, 68, 68, 0.3)';
  let color = '#f87171';
  let text = 'No Sessions Yet';
  
  if (status === 'RECOMMENDED') {
    bg = 'rgba(16, 185, 129, 0.15)';
    border = 'rgba(16, 185, 129, 0.35)';
    color = '#34d399';
    text = 'Highly Recommended';
  } else if (status === 'CONDITIONAL') {
    bg = 'rgba(6, 182, 212, 0.15)';
    border = 'rgba(6, 182, 212, 0.35)';
    color = '#22d3ee';
    text = 'Conditional Pass';
  } else if (status === 'REQUIRES_REVIEW') {
    bg = 'rgba(245, 158, 11, 0.15)';
    border = 'rgba(245, 158, 11, 0.35)';
    color = '#fbbf24';
    text = 'Training Recommended';
  }

  return (
    <span style={{ display: 'inline-flex', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: bg, border: `1px solid ${border}`, color: color }}>
      {text}
    </span>
  );
};

export default function DashboardPage({ onNavigate, sessionId }) {
  const { theme } = useTheme();

  const [report, setReport] = useState(null);
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(sessionId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load session listing on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAnalyticsSessions();
        if (mounted) {
          setSessions(data);
        }
      } catch (err) {
        console.error("Failed to load completed sessions:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load either a single session report (interview or aptitude) or the global aggregated summary
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        if (selectedSessionId) {
          const matchedSession = sessions.find(s => s.session_id === selectedSessionId);
          const isAptitude = matchedSession?.type === 'aptitude' || selectedSessionId.startsWith('aptitude_');
          
          if (matchedSession?.type === 'aptitude') {
            const data = await getAptitudeAttempt(selectedSessionId);
            if (mounted) {
              setReport({
                session_id: data.attempt_id,
                interview_type: 'aptitude',
                position: `Aptitude: ${data.category.replace('_', ' ').toUpperCase()}`,
                experience_level: 'fresher',
                start_time: data.timestamp,
                duration_minutes: null,
                is_aptitude: true,
                metrics: {
                  overall_score: data.percentage,
                  technical_score: data.percentage,
                  communication_score: data.attention_score * 100,
                  confidence_score: 100 - (data.suspicious_count * 20),
                  problem_solving_score: data.percentage,
                  consistency_score: data.attention_score * 100,
                  employability_rating: data.percentage >= 80 ? 'EXCELLENT' : data.percentage >= 60 ? 'GOOD' : 'REQUIRES_PRACTICE'
                },
                proctoring: {
                  integrity_score: Math.max(0, 100 - (data.suspicious_count * 20) - (data.tab_switches * 5)),
                  suspicious_events_count: data.suspicious_count,
                  tab_switches: data.tab_switches,
                  attention_score: data.attention_score,
                  risk_level: data.suspicious_count > 3 ? 'high' : data.suspicious_count > 0 ? 'medium' : 'low'
                },
                recommendation: {
                  candidate_status: data.percentage >= 70 ? 'RECOMMENDED' : 'REQUIRES_REVIEW',
                  recommendation_text: `Completed Aptitude Evaluation for ${data.category.toUpperCase()}. Secured ${data.score} out of ${data.total_questions} questions correct with a proctoring attention level of ${Math.round(data.attention_score * 100)}%.`
                },
                answer_summaries: []
              });
              setSummary(null);
            }
          } else {
            const response = await interviewAPI.getReport(selectedSessionId);
            if (mounted) {
              setReport(response.data);
              setSummary(null);
            }
          }
        } else {
          const data = await getAnalyticsSummary();
          if (mounted) {
            setSummary(data);
            setReport(null);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.detail || 'Unable to fetch dashboard metrics.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedSessionId, sessions]);

  const hasData = summary && (summary.interviews_conducted > 0 || summary.aptitude_attempts > 0);

  if (!isLoading && !error && !selectedSessionId && !hasData) {
    return (
      <MainLayout activeView="analysis-dashboard" onNavigate={onNavigate}>
        <div style={{ padding: '2rem', backgroundColor: 'transparent', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <div
            className="glass-panel animate-fade-in"
            style={{
              borderRadius: '1.5rem',
              padding: '4rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(145deg, ${theme.colors.surfacePrimary}cc, ${theme.colors.surfaceSecondary}aa)`,
              border: `1px solid ${theme.colors.borderLight}`,
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(16px)',
              width: '100%',
            }}
          >
            <div style={{ display: 'grid', placeItems: 'center', width: 64, height: 64, borderRadius: '1.25rem', background: `linear-gradient(135deg, ${theme.colors.primary}40, ${theme.colors.info}20)`, color: theme.colors.primary, marginBottom: '1.5rem', marginLeft: 'auto', marginRight: 'auto' }}>
              <Sparkles size={32} />
            </div>
            
            <h2 style={{ fontSize: theme.fonts.size['2xl'], fontWeight: '900', margin: '0 0 0.75rem', letterSpacing: '-0.02em', color: theme.colors.textPrimary }}>
              No completed sessions yet
            </h2>
            
            <p style={{ color: theme.colors.textSecondary, lineHeight: 1.7, maxWidth: 540, margin: '0 auto 2rem', fontSize: theme.fonts.size.md }}>
              AI Placements Analysis will activate automatically once you complete an interview, mock interview, or aptitude test.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => onNavigate?.('interview-types')}
                style={{
                  padding: '0.85rem 1.5rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.info})`,
                  color: theme.colors.bgPrimary,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: theme.fonts.size.sm,
                  boxShadow: '0 10px 25px rgba(34, 211, 238, 0.2)',
                }}
              >
                Start AI Interview
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('aptitude-test')}
                style={{
                  padding: '0.85rem 1.5rem',
                  borderRadius: '999px',
                  border: `1px solid ${theme.colors.borderLight}`,
                  background: theme.colors.surfacePrimary,
                  color: theme.colors.textPrimary,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: theme.fonts.size.sm,
                }}
              >
                Take an Aptitude Test
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout activeView="analysis-dashboard" onNavigate={onNavigate}>
      <div style={{ padding: '2rem', backgroundColor: 'transparent', minHeight: '100vh', maxWidth: '1320px', margin: '0 auto' }}>
        
        {/* Header Block */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: '900', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {sessionId ? 'Interview Session Report' : 'AI Placements Dashboard'}
            </h1>
            <p style={{ color: theme.colors.textTertiary, marginTop: '0.45rem', fontSize: theme.fonts.size.md }}>
              {sessionId 
                ? 'Dynamic metrics and proctoring analytics captured for your latest attempt.' 
                : 'Aggregated recruitment benchmarks generated from your live evaluation sessions.'
              }
            </p>
          </div>
          {sessionId && (
            <button
              onClick={() => onNavigate?.('analysis-dashboard')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '999px',
                border: `1px solid ${theme.colors.borderLight}`,
                background: theme.colors.surfacePrimary,
                color: theme.colors.textPrimary,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: theme.fonts.size.sm,
              }}
            >
              Back to Overview
            </button>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: theme.colors.textSecondary, fontSize: theme.fonts.size.lg }}>
            <Sparkles size={24} style={{ display: 'block', margin: '0 auto 1rem', color: theme.colors.primary }} />
            Loading evaluation data...
          </div>
        )}

        {/* Error Container */}
        {error && !isLoading && (
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1rem', border: `1px solid ${theme.colors.danger}40`, background: `${theme.colors.danger}05`, color: theme.colors.danger, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertCircle size={24} />
            <div>
              <div style={{ fontWeight: 800, fontSize: theme.fonts.size.lg }}>Evaluation Service Error</div>
              <div style={{ color: theme.colors.textSecondary, marginTop: '0.25rem' }}>{error}</div>
            </div>
          </div>
        )}

        {/* Display Single Session Report */}
        {!isLoading && !error && report && (
          <>
            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {[
                { label: 'Overall performance', value: `${Math.round(report.metrics?.overall_score ?? 0)}%`, color: theme.colors.primary, icon: Target },
                { label: 'Technical depth', value: `${Math.round(report.metrics?.technical_score ?? 0)}%`, color: theme.colors.info, icon: Brain },
                { label: 'Verbal communication', value: `${Math.round(report.metrics?.communication_score ?? 0)}%`, color: theme.colors.success, icon: Award },
                { label: 'Proctoring integrity', value: `${Math.round(report.proctoring?.integrity_score ?? 0)}%`, color: theme.colors.warning, icon: Eye },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="glass-panel animate-fade-in"
                    style={{
                      borderRadius: '1.25rem',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 120,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: theme.colors.textTertiary, fontSize: theme.fonts.size.sm, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</span>
                      <Icon size={18} color={stat.color} />
                    </div>
                    <p style={{ fontSize: '2.5rem', fontWeight: '900', color: stat.color, margin: '0.75rem 0 0', lineHeight: 1 }}>{stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Recruiter Summary Card */}
            <div
              className="glass-panel animate-fade-in"
              style={{
                borderRadius: '1.25rem',
                padding: '2rem',
                marginBottom: '2.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: theme.colors.textPrimary, fontSize: theme.fonts.size.xl, fontWeight: '800' }}>AI Evaluator Assessment</h3>
                  <p style={{ color: theme.colors.textTertiary, margin: '0.25rem 0 0', fontSize: theme.fonts.size.sm }}>
                    {report.position} • {report.interview_type.replace('mock_', '').toUpperCase()} Round • {Math.round(report.duration_minutes || 0)} minutes
                  </p>
                </div>
                <RecruiterBadge status={report.recommendation?.candidate_status} />
              </div>
              <div style={{ padding: '1.25rem', borderRadius: '1rem', background: theme.colors.bgPrimary, border: `1px solid ${theme.colors.borderLight}` }}>
                <p style={{ color: theme.colors.textSecondary, margin: 0, lineHeight: 1.7, fontSize: theme.fonts.size.md }}>
                  {report.recommendation?.recommendation_text || 'No recommendation text available.'}
                </p>
              </div>
            </div>

            {/* Detailed Question History */}
            {report.answer_summaries?.length ? (
              <div
                className="glass-panel animate-fade-in"
                style={{
                  borderRadius: '1.25rem',
                  padding: '2rem',
                }}
              >
                <h3 style={{ marginBottom: '1.5rem', color: theme.colors.textPrimary, fontSize: theme.fonts.size.lg, fontWeight: '800' }}>Exchanges & Transcripts</h3>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {report.answer_summaries.map((item, index) => (
                    <div key={index} className="glass-panel" style={{ padding: '1.25rem', borderRadius: '1rem', background: `${theme.colors.surfacePrimary}80` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <span style={{ fontSize: theme.fonts.size.xs, color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Q{index + 1}</span>
                        <span style={{ display: 'inline-flex', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: theme.colors.textTertiary }}>
                          Diff: <span style={{ color: theme.colors.info }}>{item.difficulty || 'medium'}</span>
                        </span>
                      </div>
                      <p style={{ margin: '0.5rem 0 0.75rem', color: theme.colors.textPrimary, fontWeight: '700', fontSize: theme.fonts.size.md, lineHeight: 1.5 }}>
                        {item.question || `Question ${index + 1}`}
                      </p>
                      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: theme.colors.bgPrimary, border: `1px solid ${theme.colors.borderLight}`, fontSize: theme.fonts.size.sm, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
                        <div style={{ color: theme.colors.textTertiary, fontWeight: 700, fontSize: theme.fonts.size.xs, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Candidate Answer</div>
                        "{item.answer || 'No response recorded.'}"
                      </div>
                      {item.feedback && (
                        <p style={{ margin: '0.75rem 0 0', color: theme.colors.success, fontSize: theme.fonts.size.sm, display: 'flex', gap: '0.5rem' }}>
                          <Sparkles size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{item.feedback}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* Display Global Aggregated Summary Placements Dashboard */}
        {!isLoading && !error && summary && (
          <>
            {hasData ? (
              <>
                {/* Dynamic Aggregated Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  {[
                    { label: 'Interviews Completed', value: summary.interviews_conducted, color: theme.colors.primary, icon: Brain },
                    { label: 'Aptitude Attempts', value: summary.aptitude_attempts, color: theme.colors.info, icon: FileText },
                    { label: 'Average AI Score', value: summary.interview_performance?.overall_score ? `${Math.round(summary.interview_performance.overall_score)}%` : '—', color: theme.colors.success, icon: Target },
                    { label: 'Proctoring Integrity', value: summary.proctoring_integrity?.average_integrity ? `${Math.round(summary.proctoring_integrity.average_integrity)}%` : '—', color: theme.colors.warning, icon: Shield },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="glass-panel"
                        style={{
                          borderRadius: '1.25rem',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: 120,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: theme.colors.textTertiary, fontSize: theme.fonts.size.sm, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</span>
                          <Icon size={18} color={stat.color} />
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: '900', color: stat.color, margin: '0.75rem 0 0', lineHeight: 1 }}>{stat.value}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Main Content Layout Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                  
                  {/* Left Column: Skill Profiles */}
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    
                    {/* Interview Skill Profile Progress Bars */}
                    <div className="glass-panel" style={{ borderRadius: '1.25rem', padding: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', color: theme.colors.primary }}>
                        <Brain size={20} />
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: theme.fonts.size.lg }}>AI Interview Performance Profile</h3>
                      </div>
                      
                      <div style={{ display: 'grid', gap: '1.25rem' }}>
                        {[
                          { label: 'Technical Core Knowledge', val: summary.interview_performance?.technical_score },
                          { label: 'Verbal Articulation & Flow', val: summary.interview_performance?.communication_score },
                          { label: 'Presentation & Confidence', val: summary.interview_performance?.confidence_score },
                          { label: 'Concept Clarity & Focus', val: summary.interview_performance?.clarity_score },
                          { label: 'Vocabulary Diversity', val: summary.interview_performance?.vocabulary_score },
                        ].map((skill) => (
                          <div key={skill.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', fontSize: theme.fonts.size.sm }}>
                              <span style={{ color: theme.colors.textSecondary, fontWeight: 700 }}>{skill.label}</span>
                              <span style={{ fontWeight: 800, color: theme.colors.textPrimary }}>{skill.val ? `${Math.round(skill.val)}%` : '—'}</span>
                            </div>
                            <div style={{ height: 8, borderRadius: '999px', background: theme.colors.bgPrimary, overflow: 'hidden', border: `1px solid ${theme.colors.borderLight}` }}>
                              <div style={{ width: skill.val ? `${skill.val}%` : '0%', height: '100%', background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.info})`, borderRadius: '999px', transition: 'width 1s ease-in-out' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Aptitude Skill Metrics Profile */}
                    <div className="glass-panel" style={{ borderRadius: '1.25rem', padding: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', color: theme.colors.info }}>
                        <FileText size={20} />
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: theme.fonts.size.lg }}>Aptitude Assessment Performance</h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '1rem', background: theme.colors.bgPrimary, border: `1px solid ${theme.colors.borderLight}` }}>
                          <div style={{ fontSize: theme.fonts.size.xs, color: theme.colors.textTertiary, fontWeight: 700 }}>AVG TEST SCORE</div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: theme.colors.info, marginTop: '0.25rem' }}>
                            {summary.aptitude_performance?.average_score ? `${Math.round(summary.aptitude_performance.average_score)}%` : '—'}
                          </div>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '1rem', background: theme.colors.bgPrimary, border: `1px solid ${theme.colors.borderLight}` }}>
                          <div style={{ fontSize: theme.fonts.size.xs, color: theme.colors.textTertiary, fontWeight: 700 }}>AVG ATTENTION SCORE</div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: theme.colors.success, marginTop: '0.25rem' }}>
                            {summary.aptitude_performance?.average_attention ? `${Math.round(summary.aptitude_performance.average_attention)}%` : '—'}
                          </div>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '1rem', background: theme.colors.bgPrimary, border: `1px solid ${theme.colors.borderLight}` }}>
                          <div style={{ fontSize: theme.fonts.size.xs, color: theme.colors.textTertiary, fontWeight: 700 }}>TAB SWITCHES FLAGGED</div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: theme.colors.warning, marginTop: '0.25rem' }}>
                            {summary.aptitude_performance?.total_tab_switches ?? 0}
                          </div>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '1rem', background: theme.colors.bgPrimary, border: `1px solid ${theme.colors.borderLight}` }}>
                          <div style={{ fontSize: theme.fonts.size.xs, color: theme.colors.textTertiary, fontWeight: 700 }}>PROCTOR SUSPICIONS</div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: theme.colors.danger, marginTop: '0.25rem' }}>
                            {summary.aptitude_performance?.total_suspicious ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Placements Summary & Recruiter Insights */}
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    
                    {/* Placement recommendation summary card */}
                    <div className="glass-panel" style={{ borderRadius: '1.25rem', padding: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', color: theme.colors.warning }}>
                        <Shield size={20} />
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: theme.fonts.size.lg }}>Integrity & Recruiter Placement Assessment</h3>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${theme.colors.borderLight}`, marginBottom: '1.25rem' }}>
                        <div>
                          <div style={{ fontSize: theme.fonts.size.xs, color: theme.colors.textTertiary, fontWeight: 700 }}>PROCTORING RISK LEVEL</div>
                          <div style={{ fontWeight: 800, fontSize: theme.fonts.size.md, color: (summary.proctoring_integrity?.average_integrity ?? 100) > 75 ? theme.colors.success : theme.colors.warning, marginTop: '0.15rem' }}>
                            {(summary.proctoring_integrity?.average_integrity ?? 100) > 75 ? 'Low Risk (Passed)' : 'High Risk (Flagged)'}
                          </div>
                        </div>
                        <RecruiterBadge status={summary.recruiter_recommendation?.status} />
                      </div>

                      <div style={{ padding: '1.25rem', borderRadius: '1rem', background: theme.colors.bgPrimary, border: `1px solid ${theme.colors.borderLight}` }}>
                        <div style={{ color: theme.colors.textTertiary, fontSize: theme.fonts.size.xs, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Recruitment Intelligence Recommendation</div>
                        <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: theme.fonts.size.sm, lineHeight: 1.65 }}>
                          {summary.recruiter_recommendation?.recommendation}
                        </p>
                      </div>
                    </div>

                    {/* AI Feedback Profiles: Strengths and Improvement Areas */}
                    <div className="glass-panel" style={{ borderRadius: '1.25rem', padding: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', color: theme.colors.success }}>
                        <Sparkles size={20} />
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: theme.fonts.size.lg }}>AI Evaluator Profiler Feedback</h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        
                        {/* Strengths */}
                        <div>
                          <div style={{ color: theme.colors.success, fontWeight: 800, fontSize: theme.fonts.size.sm, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                            <Target size={16} />
                            Key Strengths Identified
                          </div>
                          {summary.top_strengths?.length ? (
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: theme.colors.textSecondary, fontSize: theme.fonts.size.sm, lineHeight: 1.7 }}>
                              {summary.top_strengths.map((str, i) => <li key={i} style={{ marginBottom: '0.35rem' }}>{str}</li>)}
                            </ul>
                          ) : (
                            <p style={{ margin: 0, color: theme.colors.textTertiary, fontSize: theme.fonts.size.sm }}>None recorded yet. Answers must be processed by the AI.</p>
                          )}
                        </div>

                        {/* Improvements */}
                        <div>
                          <div style={{ color: theme.colors.warning, fontWeight: 800, fontSize: theme.fonts.size.sm, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                            <AlertCircle size={16} />
                            Areas for Development
                          </div>
                          {summary.improvement_areas?.length ? (
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: theme.colors.textSecondary, fontSize: theme.fonts.size.sm, lineHeight: 1.7 }}>
                              {summary.improvement_areas.map((imp, i) => <li key={i} style={{ marginBottom: '0.35rem' }}>{imp}</li>)}
                            </ul>
                          ) : (
                            <p style={{ margin: 0, color: theme.colors.textTertiary, fontSize: theme.fonts.size.sm }}>None recorded yet. Answers must be processed by the AI.</p>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            ) : (
              /* Premium, High-Fidelity Modern Empty State */
              <div
                className="glass-panel animate-fade-in"
                style={{
                  borderRadius: '1.5rem',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(145deg, ${theme.colors.surfacePrimary}cc, ${theme.colors.surfaceSecondary}aa)`,
                  border: `1px solid ${theme.colors.borderLight}`,
                  boxShadow: '0 30px 80px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(16px)',
                  maxWidth: '800px',
                  margin: '3rem auto 0',
                }}
              >
                <div style={{ display: 'grid', placeItems: 'center', width: 64, height: 64, borderRadius: '1.25rem', background: `linear-gradient(135deg, ${theme.colors.primary}40, ${theme.colors.info}20)`, color: theme.colors.primary, marginBottom: '1.5rem' }}>
                  <Sparkles size={32} />
                </div>
                
                <h2 style={{ fontSize: theme.fonts.size['2xl'], fontWeight: '900', margin: '0 0 0.75rem', letterSpacing: '-0.02em', color: theme.colors.textPrimary }}>
                  Your Placements Analytics Profile is Empty
                </h2>
                
                <p style={{ color: theme.colors.textSecondary, lineHeight: 1.7, maxWidth: 540, margin: '0 0 2rem', fontSize: theme.fonts.size.md }}>
                  AptiSense AI requires genuine evaluation sessions to calculate your profile. Complete a voice practice mock round or run a timed aptitude assessment to populate your placements report.
                </p>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('mock-interview')}
                    style={{
                      padding: '0.85rem 1.5rem',
                      borderRadius: '999px',
                      border: 'none',
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.info})`,
                      color: theme.colors.bgPrimary,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: theme.fonts.size.sm,
                      boxShadow: '0 10px 25px rgba(34, 211, 238, 0.2)',
                    }}
                  >
                    Start AI Mock Interview
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('aptitude-test')}
                    style={{
                      padding: '0.85rem 1.5rem',
                      borderRadius: '999px',
                      border: `1px solid ${theme.colors.borderLight}`,
                      background: theme.colors.surfacePrimary,
                      color: theme.colors.textPrimary,
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: theme.fonts.size.sm,
                    }}
                  >
                    Take an Aptitude Test
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

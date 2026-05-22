import React, { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, Brain, FileText, Mic, Sparkles, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { MainLayout } from '../layouts/MainLayout';
import { NeuralNetwork } from '../components/NeuralNetwork';

const defaultPlatformStats = [
  { label: 'Interviews', value: 0, icon: Brain },
  { label: 'Aptitude Attempts', value: 0, icon: FileText },
  { label: 'Average AI Score', value: null, icon: Sparkles },
  { label: 'Proctoring Integrity', value: null, icon: BarChart3 },
];

const moduleCards = [
  {
    key: 'interview-types',
    eyebrow: 'Adaptive interview engine',
    title: 'Interview Types',
    description: 'Run HR, technical, behavioral, and communication rounds with Gemini-driven follow-ups and memory-aware scoring.',
    icon: Brain,
    gradient: 'linear-gradient(135deg, rgba(34, 211, 238, 0.95), rgba(59, 130, 246, 0.88))',
  },
  {
    key: 'mock-interview',
    eyebrow: 'Voice-enabled practice',
    title: 'Mock Interview',
    description: 'Practice live speaking sessions with sensor tracking, audio capture, and recruiter-style feedback loops.',
    icon: Mic,
    gradient: 'linear-gradient(135deg, rgba(232, 121, 249, 0.95), rgba(244, 63, 94, 0.88))',
  },
  {
    key: 'aptitude-test',
    eyebrow: 'Assessment workflow',
    title: 'Aptitude Test',
    description: 'Evaluate reasoning, quant, verbal, and coding aptitude with camera-aware proctoring and timed scoring.',
    icon: FileText,
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(20, 184, 166, 0.88))',
  },
  {
    key: 'analysis-dashboard',
    eyebrow: 'Recruiter intelligence',
    title: 'AI Analysis Dashboard',
    description: 'Review performance trends, interview analytics, and decision-ready recommendations in one place.',
    icon: BarChart3,
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(249, 115, 22, 0.88))',
  },
];

export default function HomePage({ onNavigate }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState(defaultPlatformStats);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch((import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api/v1/analytics/summary');
        if (!mounted) return;
        if (!resp.ok) return;
        const data = await resp.json();
        const mapped = [
          { label: 'Interviews', value: data.interviews_conducted ?? 0, icon: Brain },
          { label: 'Aptitude Attempts', value: data.aptitude_attempts ?? 0, icon: FileText },
          { label: 'Average AI Score', value: data.interview_performance?.overall_score ? `${Math.round(data.interview_performance.overall_score)}%` : '—', icon: Sparkles },
          { label: 'Proctoring Integrity', value: data.proctoring_integrity?.average_integrity ? `${Math.round(data.proctoring_integrity.average_integrity)}%` : '—', icon: BarChart3 },
        ];
        setStats(mapped);
      } catch (e) {
        setStats(defaultPlatformStats);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <MainLayout activeView="home" onNavigate={onNavigate}>
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
          <NeuralNetwork />
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '2rem', maxWidth: '1320px', margin: '0 auto' }}>
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.85fr)',
              gap: '1.5rem',
              alignItems: 'stretch',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                padding: '2.5rem',
                borderRadius: '1.5rem',
                background: `linear-gradient(145deg, ${theme.colors.surfacePrimary}e8, ${theme.colors.surfaceSecondary}f0)`,
                border: `1px solid ${theme.colors.borderLight}`,
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(14px)',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.85rem', borderRadius: '999px', background: `${theme.colors.primary}18`, color: theme.colors.primary, fontSize: theme.fonts.size.sm, fontWeight: 700, marginBottom: '1.25rem' }}>
                <Sparkles size={16} />
                AI Recruitment Intelligence Platform
              </div>
              <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', lineHeight: 1.08, margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Practice interviews, improve aptitude skills, and receive real-time AI-driven performance analysis in one intelligent platform.
              </h1>
              <p style={{ maxWidth: 720, marginTop: '1rem', color: theme.colors.textSecondary, fontSize: theme.fonts.size.lg, lineHeight: 1.7 }}>
                AptiSense AI restores the full workflow: adaptive AI interviewing, voice-enabled mock practice, aptitude evaluation, and recruiter-grade analytics without flattening the product into a landing page.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', marginTop: '1.5rem' }}>
                <ActionButton label="Start Interview" icon={Brain} onClick={() => onNavigate?.('interview-types')} primary />
                <ActionButton label="Practice Mock Round" icon={Mic} onClick={() => onNavigate?.('mock-interview')} />
                <ActionButton label="Open Analysis" icon={BarChart3} onClick={() => onNavigate?.('analysis-dashboard')} />
              </div>
            </div>

            {stats[0].value === 0 && stats[1].value === 0 ? (
              <div
                style={{
                  padding: '2.5rem',
                  borderRadius: '1.5rem',
                  background: `${theme.colors.surfacePrimary}d8`,
                  border: `1px solid ${theme.colors.borderLight}`,
                  boxShadow: '0 30px 80px rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(14px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'grid', placeItems: 'center', width: 50, height: 50, borderRadius: '0.95rem', background: `linear-gradient(135deg, ${theme.colors.primary}40, ${theme.colors.info}20)`, color: theme.colors.primary, marginBottom: '1.25rem' }}>
                  <Sparkles size={24} />
                </div>
                <h3 style={{ fontSize: theme.fonts.size.lg, fontWeight: 800, margin: '0 0 0.5rem', color: theme.colors.textPrimary }}>No Completed Sessions Yet</h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: theme.fonts.size.sm, lineHeight: 1.5, margin: 0, maxWidth: 300 }}>
                  Your recruitment performance analytics will activate automatically once you complete an interview or aptitude test.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '1rem',
                }}
              >
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      style={{
                        padding: '1.2rem',
                        borderRadius: '1.25rem',
                        background: `${theme.colors.surfacePrimary}d8`,
                        border: `1px solid ${theme.colors.borderLight}`,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Icon size={18} color={theme.colors.primary} />
                      <div style={{ marginTop: '1.4rem', fontSize: '2rem', fontWeight: 900 }}>{stat.value !== null ? stat.value : '—'}</div>
                      <div style={{ marginTop: '0.25rem', color: theme.colors.textTertiary, fontSize: theme.fonts.size.sm }}>{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
              gap: '1rem',
            }}
          >
            {moduleCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => onNavigate?.(card.key)}
                  style={{
                    gridColumn: 'span 6',
                    textAlign: 'left',
                    padding: '1.5rem',
                    borderRadius: '1.25rem',
                    border: `1px solid ${theme.colors.borderLight}`,
                    background: `linear-gradient(145deg, ${theme.colors.surfaceSecondary}, ${theme.colors.surfacePrimary})`,
                    color: theme.colors.textPrimary,
                    cursor: 'pointer',
                    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.18)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: '0.95rem', background: card.gradient, color: '#fff' }}>
                        <Icon size={20} />
                      </span>
                      <div>
                        <div style={{ fontSize: theme.fonts.size.xs, textTransform: 'uppercase', letterSpacing: '0.14em', color: theme.colors.textTertiary, fontWeight: 700 }}>{card.eyebrow}</div>
                        <div style={{ marginTop: '0.15rem', fontSize: theme.fonts.size.xl, fontWeight: 800 }}>{card.title}</div>
                      </div>
                    </div>
                    <ArrowRight size={18} color={theme.colors.textTertiary} />
                  </div>
                  <p style={{ margin: 0, color: theme.colors.textSecondary, lineHeight: 1.65 }}>{card.description}</p>
                </button>
              );
            })}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

function ActionButton({ label, icon: Icon, onClick, primary = false }) {
  const { theme } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.7rem',
        padding: '0.95rem 1.2rem',
        borderRadius: '999px',
        border: `1px solid ${primary ? 'transparent' : theme.colors.borderLight}`,
        background: primary
          ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.info})`
          : `${theme.colors.surfaceSecondary}`,
        color: primary ? theme.colors.bgPrimary : theme.colors.textPrimary,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
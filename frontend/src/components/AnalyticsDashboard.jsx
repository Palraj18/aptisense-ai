import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export function MetricsCard({ label, value, max = 100, color, icon }) {
  const { theme } = useTheme();
  const percentage = (value / max) * 100;

  return (
    <div
      style={{
        backgroundColor: theme.colors.surfaceSecondary,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: '0.75rem',
        padding: '1.5rem',
        flex: 1,
        minWidth: '200px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <label style={{ color: theme.colors.textTertiary, fontSize: theme.fonts.size.sm }}>{label}</label>
        {icon && <span style={{ fontSize: '1.5rem' }}>{icon}</span>}
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: theme.fonts.size['2xl'], fontWeight: '700', color: color }}>
            {value.toFixed(1)}
          </span>
          <span style={{ fontSize: theme.fonts.size.sm, color: theme.colors.textTertiary }}>
            {percentage.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: theme.colors.bgTertiary,
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              backgroundColor: color,
              transition: `width 300ms ${theme.transitions.base}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function AnalyticsDashboard({ metrics, proctoring }) {
  const { theme } = useTheme();

  if (!metrics) {
    return <div>Loading analytics...</div>;
  }

  const radarData = [
    { subject: 'Technical', value: metrics.technical_score || 0 },
    { subject: 'Communication', value: metrics.communication_score || 0 },
    { subject: 'Confidence', value: metrics.confidence_score || 0 },
    { subject: 'Problem Solving', value: metrics.problem_solving_score || 0 },
    { subject: 'Leadership', value: metrics.leadership_potential_score || 0 },
    { subject: 'Behavioral', value: metrics.behavioral_score || 0 },
  ];

  const scoreDistribution = [
    { name: 'Technical', value: metrics.technical_score || 0 },
    { name: 'Communication', value: metrics.communication_score || 0 },
    { name: 'Confidence', value: metrics.confidence_score || 0 },
    { name: 'Problem Solving', value: metrics.problem_solving_score || 0 },
  ];

  const getColorForScore = (score) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.danger;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <MetricsCard
          label="Overall Score"
          value={metrics.overall_score}
          color={getColorForScore(metrics.overall_score)}
          icon="🎯"
        />
        <MetricsCard
          label="Communication"
          value={metrics.communication_score}
          color={getColorForScore(metrics.communication_score)}
          icon="💬"
        />
        <MetricsCard
          label="Technical"
          value={metrics.technical_score}
          color={getColorForScore(metrics.technical_score)}
          icon="⚙️"
        />
        <MetricsCard
          label="Confidence"
          value={metrics.confidence_score}
          color={getColorForScore(metrics.confidence_score)}
          icon="💪"
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Radar Chart */}
        <div
          style={{
            backgroundColor: theme.colors.surfaceSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: '0.75rem',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: theme.colors.textPrimary }}>Skills Assessment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={theme.colors.borderLight} />
              <PolarAngleAxis dataKey="subject" stroke={theme.colors.textTertiary} />
              <PolarRadiusAxis stroke={theme.colors.borderLight} />
              <Radar
                name="Score"
                dataKey="value"
                stroke={theme.colors.primary}
                fill={theme.colors.primary}
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div
          style={{
            backgroundColor: theme.colors.surfaceSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: '0.75rem',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: theme.colors.textPrimary }}>Score Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid stroke={theme.colors.borderLight} />
              <XAxis stroke={theme.colors.textTertiary} />
              <YAxis stroke={theme.colors.textTertiary} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.colors.bgTertiary,
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: '0.5rem',
                  color: theme.colors.textPrimary,
                }}
              />
              <Bar dataKey="value" fill={theme.colors.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Proctoring Summary */}
      {proctoring && (
        <div
          style={{
            backgroundColor: theme.colors.surfaceSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: '0.75rem',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ marginBottom: '1rem', color: theme.colors.textPrimary }}>Proctoring Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <MetricsCard
              label="Integrity Score"
              value={proctoring.integrity_score}
              color={getColorForScore(proctoring.integrity_score)}
              icon="🔒"
            />
            <MetricsCard
              label="Face Presence"
              value={proctoring.face_presence_ratio * 100}
              color={theme.colors.info}
              icon="👤"
            />
            <MetricsCard
              label="Suspicious Events"
              value={proctoring.suspicious_events_count}
              max={10}
              color={proctoring.suspicious_events_count > 3 ? theme.colors.danger : theme.colors.success}
              icon="⚠️"
            />
            <MetricsCard
              label="Cheating Risk"
              value={proctoring.average_cheating_probability * 100}
              color={theme.colors.danger}
              icon="❌"
            />
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div
        style={{
          backgroundColor: theme.colors.surfaceSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: '0.75rem',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ marginBottom: '1rem', color: theme.colors.textPrimary }}>Recommendations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {metrics.overall_score >= 80 ? (
            <div style={{ color: theme.colors.success }}>✓ Strong performance across all metrics</div>
          ) : (
            <>
              {metrics.technical_score < 70 && (
                <div style={{ color: theme.colors.warning }}>• Enhance technical depth and knowledge</div>
              )}
              {metrics.communication_score < 70 && (
                <div style={{ color: theme.colors.warning }}>• Work on clearer communication skills</div>
              )}
              {metrics.confidence_score < 70 && (
                <div style={{ color: theme.colors.warning }}>• Build confidence through practice</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

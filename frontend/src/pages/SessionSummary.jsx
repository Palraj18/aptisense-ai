import React from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Eye, Mic, Target, TrendingUp, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const SessionSummary = ({
  topic,
  quizScore,
  movementData,
  trackingHistory,
  cameraMetrics,
  voiceMetrics,
  onContinue
}) => {
  // Calculate concept clarity based on quiz score + sensor data
  const calculateConceptClarity = () => {
    const quizComponent = quizScore / 100; // 0-1 scale
    const focusComponent = cameraMetrics?.focusScore || 0.5;
    const hesitationComponent = 1 - (voiceMetrics?.hesitationScore || 0.5);
    const distractionComponent = 1 - (cameraMetrics?.distractionScore || 0.5);

    // Weighted average: quiz 40%, focus 30%, hesitation 15%, distraction 15%
    const clarity = (
      quizComponent * 0.4 +
      focusComponent * 0.3 +
      hesitationComponent * 0.15 +
      distractionComponent * 0.15
    );

    return Math.max(0, Math.min(1, clarity));
  };

  const conceptClarity = calculateConceptClarity();
  const clarityPercentage = Math.round(conceptClarity * 100);

  // Movement analysis
  const movementIntensity = Math.min(1, movementData.totalMovement / 500); // Normalize
  const focusStability = movementData.averageFocus;
  const distractionRate = movementData.distractionEvents / Math.max(1, movementData.totalSessionTime / 60); // per minute

  // Voice analysis
  const hesitationRate = movementData.hesitationEvents / Math.max(1, movementData.totalSessionTime / 60);
  const speechConfidence = 1 - (voiceMetrics?.hesitationScore || 0.5);

  // Overall engagement score
  const engagementScore = (
    focusStability * 0.4 +
    speechConfidence * 0.3 +
    (1 - movementIntensity) * 0.2 +
    conceptClarity * 0.1
  );

  const getClarityLevel = (score) => {
    if (score >= 0.8) return { level: 'Excellent', color: 'text-green-400', icon: CheckCircle };
    if (score >= 0.6) return { level: 'Good', color: 'text-blue-400', icon: Target };
    if (score >= 0.4) return { level: 'Fair', color: 'text-yellow-400', icon: AlertTriangle };
    return { level: 'Needs Improvement', color: 'text-red-400', icon: XCircle };
  };

  const clarityInfo = getClarityLevel(conceptClarity);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-neuro-primary to-neuro-secondary bg-clip-text text-transparent">
          Session Complete! 🎉
        </h1>
        <p className="text-neuro-text-secondary">
          Here's how your learning session went for <strong>{topic}</strong>
        </p>
      </div>

      {/* Concept Clarity Overview */}
      <GlassCard className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <clarityInfo.icon className={`w-8 h-8 ${clarityInfo.color}`} />
          <div>
            <h2 className="text-2xl font-bold">Concept Clarity</h2>
            <p className={`text-lg font-semibold ${clarityInfo.color}`}>
              {clarityInfo.level} ({clarityPercentage}%)
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <ProgressRing
            progress={conceptClarity}
            size={120}
            strokeWidth={8}
            className="text-neuro-primary"
          />
        </div>

        <p className="text-sm text-neuro-text-secondary max-w-md mx-auto">
          Based on your quiz performance ({quizScore}%) and engagement during the session,
          you have {clarityPercentage}% clarity on this topic.
        </p>
      </GlassCard>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Camera Tracking */}
        <GlassCard className="space-y-3">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-neuro-primary" />
            <h3 className="font-semibold">Visual Focus</h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Focus Score:</span>
              <span className="font-mono">{Math.round((cameraMetrics?.focusScore || 0) * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Distraction Events:</span>
              <span className="font-mono">{movementData.distractionEvents}</span>
            </div>
            <div className="flex justify-between">
              <span>Look Away Time:</span>
              <span className="font-mono">{Math.round(movementData.lookAwayTime)}s</span>
            </div>
            <div className="flex justify-between">
              <span>Movement Level:</span>
              <span className="font-mono">{Math.round(movementIntensity * 100)}%</span>
            </div>
          </div>
        </GlassCard>

        {/* Voice Analysis */}
        <GlassCard className="space-y-3">
          <div className="flex items-center space-x-2">
            <Mic className="w-5 h-5 text-neuro-secondary" />
            <h3 className="font-semibold">Speech Analysis</h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Confidence:</span>
              <span className="font-mono">{Math.round(speechConfidence * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Hesitation Events:</span>
              <span className="font-mono">{movementData.hesitationEvents}</span>
            </div>
            <div className="flex justify-between">
              <span>Pause Ratio:</span>
              <span className="font-mono">{Math.round((voiceMetrics?.pauseRatio || 0) * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Filler Words:</span>
              <span className="font-mono">{voiceMetrics?.fillerRate ? Math.round(voiceMetrics.fillerRate * 100) : 0}%</span>
            </div>
          </div>
        </GlassCard>

        {/* Session Stats */}
        <GlassCard className="space-y-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Session Stats</h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Quiz Score:</span>
              <span className="font-mono">{quizScore}%</span>
            </div>
            <div className="flex justify-between">
              <span>Session Time:</span>
              <span className="font-mono">{Math.round(movementData.totalSessionTime)}s</span>
            </div>
            <div className="flex justify-between">
              <span>Engagement:</span>
              <span className="font-mono">{Math.round(engagementScore * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Tracking Points:</span>
              <span className="font-mono">{trackingHistory.length}</span>
            </div>
          </div>
        </GlassCard>

      </div>

      {/* Recommendations */}
      <GlassCard className="space-y-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-neuro-primary" />
          <h3 className="font-semibold">Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {conceptClarity < 0.6 && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-red-400 font-medium">📚 Review Topic</p>
              <p className="text-red-300/80">Consider revisiting the core concepts before moving on.</p>
            </div>
          )}

          {cameraMetrics?.focusScore < 0.5 && (
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-yellow-400 font-medium">🎯 Focus Practice</p>
              <p className="text-yellow-300/80">Try minimizing distractions during study sessions.</p>
            </div>
          )}

          {voiceMetrics?.hesitationScore > 0.7 && (
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-blue-400 font-medium">🗣️ Confidence Building</p>
              <p className="text-blue-300/80">Practice explaining concepts aloud to build confidence.</p>
            </div>
          )}

          {movementData.distractionEvents > 5 && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <p className="text-purple-400 font-medium">🏠 Study Environment</p>
              <p className="text-purple-300/80">Consider a quieter study space for better concentration.</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Continue Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onContinue}
          className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-neuro-primary to-neuro-secondary hover:from-neuro-primary/80 hover:to-neuro-secondary/80"
        >
          View Detailed Analytics →
        </Button>
      </div>
    </div>
  );
};

export default SessionSummary;
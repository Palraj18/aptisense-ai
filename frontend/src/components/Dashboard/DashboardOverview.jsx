import React from "react";
import StatePieChart from "../Charts/StatePieChart";
import LearningTrendChart from "../Charts/LearningTrendChart";

const DashboardOverview = ({ report }) => {
  const stateData = [
    { name: report.predictedState, value: 1 },
    { name: "Other", value: 4 }
  ];

  const trendData = [
    { session: "S1", quizScore: Math.max(report.quizScore - 20, 30), confidence: 45 },
    { session: "S2", quizScore: Math.max(report.quizScore - 10, 40), confidence: 58 },
    { session: "S3", quizScore: report.quizScore, confidence: Math.round(report.features.confidenceScore * 100) }
  ];

  return (
    <section className="page-grid">
      <div className="card">
        <h3>Session Insight</h3>
        <p><strong>Predicted State:</strong> {report.predictedState}</p>
        <p><strong>Actual Understanding:</strong> {report.actualState}</p>
        <p><strong>Quiz Score:</strong> {report.quizScore}%</p>
        {typeof report.timeToMaster === "number" && (
          <p><strong>Predicted Time To Master:</strong> {report.timeToMaster} min</p>
        )}
        {typeof report.burnoutRisk === "number" && (
          <p><strong>Burnout Risk:</strong> {report.burnoutRisk ? "High" : "Low"}</p>
        )}
        <p><strong>Adaptive Action:</strong> {report.recommendation}</p>
        <p><strong>Understanding Anomaly:</strong> {report.understandingAnomaly ? "Possible" : "No strong sign"}</p>
      </div>
      <StatePieChart data={stateData} />
      <LearningTrendChart data={trendData} />
    </section>
  );
};

export default DashboardOverview;

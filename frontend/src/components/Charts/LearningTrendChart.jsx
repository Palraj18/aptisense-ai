import React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const LearningTrendChart = ({ data }) => {
  return (
    <div className="card chart-card">
      <h4>Learning Trend Over Sessions</h4>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="session" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="quizScore" stroke="#2563eb" strokeWidth={2} />
          <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LearningTrendChart;

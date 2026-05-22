/**
 * API client for backend communication
 */
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_URL ||
  'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interview endpoints
export const interviewAPI = {
  start: (data) => apiClient.post('/interview/start', data),
  submitAnswer: (data) => apiClient.post('/interview/answer', data),
  getNextQuestion: (sessionId) => apiClient.get(`/interview/next-question/${sessionId}`),
  endInterview: (sessionId) => apiClient.post(`/interview/end/${sessionId}`),
  getReport: (sessionId) => apiClient.get(`/interview/report/${sessionId}`),
  getStatus: (sessionId) => apiClient.get(`/interview/status/${sessionId}`),
};

// Proctoring endpoints
export const proctoringAPI = {
  analyzeFrame: (sessionId, data) => apiClient.post(`/proctoring/analyze-frame/${sessionId}`, data),
  getIntegrityScore: (sessionId) => apiClient.get(`/proctoring/integrity-score/${sessionId}`),
  getBriefSummary: (sessionId) => apiClient.get(`/proctoring/brief-summary/${sessionId}`),
  flagSuspiciousActivity: (sessionId, data) => apiClient.post(`/proctoring/flag-suspicious/${sessionId}`, data),
};

export const aptitudeAPI = {
  // Aptitude routes are exposed at the application root in the backend
  // (not namespaced under /api/v1). Call them directly to avoid mismatched prefixes.
  getQuestions: (category) => apiClient.get(API_BASE_URL.replace('/api/v1', '') + `/aptitude/${category}`),
  submitAttempt: (data) => apiClient.post(API_BASE_URL.replace('/api/v1', '') + `/aptitude/submit`, data),
  getAttempt: (attemptId) => apiClient.get(API_BASE_URL.replace('/api/v1', '') + `/aptitude/attempt/${attemptId}`),
};

export async function submitAptitudeAttempt(data) {
  const response = await aptitudeAPI.submitAttempt(data);
  return response.data;
}

export async function getAptitudeAttempt(attemptId) {
  const response = await aptitudeAPI.getAttempt(attemptId);
  return response.data;
}

export const analyticsAPI = {
  getSummary: () => apiClient.get('/analytics/summary'),
  getSessions: () => apiClient.get('/analytics/sessions'),
};

export async function getAnalyticsSummary() {
  const response = await analyticsAPI.getSummary();
  return response.data;
}

export async function getAnalyticsSessions() {
  const response = await analyticsAPI.getSessions();
  return response.data;
}


export async function getQuestions(category) {
  const response = await apiClient.get(`/questions/${category}`);

  return response.data;
}

export async function evaluateAnswer(payload) {
  const response = await apiClient.post('/evaluate', payload);
  return response.data;
}

export async function getAptitudeQuestions(category) {
  const response = await aptitudeAPI.getQuestions(category);
  return response.data;
}

export default apiClient;
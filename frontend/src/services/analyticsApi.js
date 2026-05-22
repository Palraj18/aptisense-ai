import { api as baseApi } from "./api";

export const analyticsApi = {
  sendSensorSummary: async (payload) =>
    baseApi._safeFetch(`${baseApi.baseUrl}/analytics/sensor-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  sendSessionAnalytics: async (payload) =>
    baseApi._safeFetch(`${baseApi.baseUrl}/analytics/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
};

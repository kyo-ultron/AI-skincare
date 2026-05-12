/**
 * api.js — centralised frontend API layer.
 *
 * All calls go through Vite's proxy → http://localhost:8000
 * so we never have CORS issues.  Token is read from localStorage
 * on every call (stays fresh across page reloads).
 *
 * Pattern:
 *   export const myCall = () => apiFetch("/endpoint", { method, body })
 */
import axios from "axios";

const BASE = "/api";

// ─── axios instance ────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: BASE });

// Attach token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authLogin    = (email, password) => api.post("/auth/login",    { email, password }).then(r => r.data);
export const authRegister = (name, email, password) => api.post("/auth/register", { name, email, password }).then(r => r.data);
export const authMe       = () => api.get("/auth/me").then(r => r.data);
export const updatePreferences = (data) => api.put("/auth/preferences", data).then(r => r.data);

// ─── Skin Analysis (on-demand Gemini) ─────────────────────────────────────────
export const analyzeSkin = async (imageBase64) => {
  const res = await api.post("/skin/analyze", { image: imageBase64 });
  return res.data;
};

// Save the result to progress after Gemini analysis completes
export const saveProgressEntry = (imageBase64, analysis) =>
  api.post("/progress/entry", { imageBase64, analysis }).then(r => r.data);

// ─── Local ML Model ────────────────────────────────────────────────────────────
export const analyzeWithModel = async (imageBase64) => {
  const res = await api.post("/model/analyze", { image: imageBase64 });
  return res.data;
};

// ─── Daily Analysis ────────────────────────────────────────────────────────────
export const dailyAnalyze     = (image) => api.post("/daily/analyze",     { image }).then(r => r.data);
export const getDailyHistory  = (limit = 30) => api.get(`/daily/history?limit=${limit}`).then(r => r.data);
export const getDailyProgress = () => api.get("/daily/progress").then(r => r.data);
export const getAllAnalyses    = (params = {}) => api.get("/daily/all-analyses", { params }).then(r => r.data);

// ─── Dashboard / Progress ──────────────────────────────────────────────────────
export const getDashboard = () => api.get("/progress/dashboard").then(r => r.data);

// ─── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications    = () => api.get("/notifications").then(r => r.data);
export const createNotification  = (data) => api.post("/notifications", data).then(r => r.data);
export const markNotifRead       = (id) => api.put(`/notifications/${id}/read`).then(r => r.data);
export const markAllNotifsRead   = () => api.put("/notifications/read-all").then(r => r.data);
export const deleteNotification  = (id) => api.delete(`/notifications/${id}`).then(r => r.data);

// ─── Weather ───────────────────────────────────────────────────────────────────
export const getWeather        = (params) => api.get("/weather",         { params }).then(r => r.data);
export const getWeatherHistory = ()        => api.get("/weather/history").then(r => r.data);

// ─── Points ────────────────────────────────────────────────────────────────────
export const getPoints    = () => api.get("/points").then(r => r.data);
export const redeemPoints = (amount) => api.post("/points/redeem", { amount }).then(r => r.data);

// ─── History (aggregated) ──────────────────────────────────────────────────────
export const getHistory = (params = {}) => api.get("/history", { params }).then(r => r.data);

// ─── Coach ─────────────────────────────────────────────────────────────────────
export const coachChat     = (message, history) => api.post("/coach/chat",    { message, history }).then(r => r.data);
export const coachHistory  = () => api.get("/coach/history").then(r => r.data);
export const coachGreeting = () => api.get("/coach/greeting").then(r => r.data);
export const clearCoachHistory = () => api.delete("/coach/history").then(r => r.data);

// ─── Payment ───────────────────────────────────────────────────────────────────
export const createOrder  = (amount, items) => api.post("/payment/create-order", { amount, items }).then(r => r.data);
export const verifyPayment = (data) => api.post("/payment/verify", data).then(r => r.data);

export default api;
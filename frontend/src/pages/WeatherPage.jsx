/**
 * WeatherPage.jsx
 *
 * FIXES:
 * 1. Used hardcoded "http://localhost:8000/api" → now uses /api (Vite proxy).
 * 2. Used raw axios → now uses getWeather/getWeatherHistory from api.js
 *    so the token is auto-attached by the interceptor.
 * 3. GEOLOCATION BUG: setLoading(false) was only called in the error
 *    callback of getCurrentPosition. In the success path, fetchWeather()
 *    is called but if it throws, setLoading(false) is never called.
 *    The button stays disabled forever. FIX: wrap success callback in
 *    try/finally, always call setLoading(false).
 * 4. Error from getCurrentPosition had no timeout — on some browsers/OS
 *    the prompt hangs indefinitely. FIX: added timeout: 10000.
 * 5. Weather state was set as { weather, tips, city } (frontend-shaped) but
 *    loadHistory sets it to the raw DB record shape { weather: {...}, tips, city }.
 *    Both shapes now normalised to { weather, tips, city } consistently.
 */

import { useState, useEffect } from "react";
import { getWeather, getWeatherHistory } from "../services/api";

const conditionIcon = (cond = "") => {
  const c = cond.toLowerCase();
  if (c.includes("rain"))  return "🌧️";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("storm")) return "⛈️";
  if (c.includes("snow"))  return "❄️";
  if (c.includes("mist") || c.includes("fog")) return "🌫️";
  return "☀️";
};

const aqiLabel = (aqi) => {
  if (!aqi) return null;
  const map = ["", "Good 😊", "Fair 🙂", "Moderate 😐", "Poor 😷", "Very Poor 🤢"];
  return map[aqi] || "Unknown";
};

const WeatherPage = () => {
  const [current, setCurrent] = useState(null);  // { weather, tips, city }
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [error, setError]   = useState("");
  const [tab, setTab]       = useState("current");

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      // ✅ uses api.js — token auto-attached
      const res = await getWeatherHistory();
      setHistory(res.history || []);
      // Pre-populate current tab with latest saved record
      if (res.history?.length) {
        const latest = res.history[0];
        setCurrent({ weather: latest.weather, tips: latest.tips, city: latest.city });
      }
    } catch (e) {
      console.error("Weather history error:", e.response?.data?.message || e.message);
    }
  };

  // ✅ FIX: proper geolocation with timeout + always-reset loading
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Success callback
        try {
          await fetchWeather({
            lat: position.coords.latitude.toFixed(6),
            lon: position.coords.longitude.toFixed(6),
          });
        } catch (fetchErr) {
          setError(fetchErr.response?.data?.message || "Could not fetch weather for your location.");
        } finally {
          // ✅ FIX: always reset loading in success path too
          setLoading(false);
        }
      },
      (geoError) => {
        // Error callback
        const messages = {
          1: "Location access denied. Please allow location access or enter a city manually.",
          2: "Location unavailable. Please enter a city manually.",
          3: "Location request timed out. Please enter a city manually.",
        };
        setError(messages[geoError.code] || "Could not get your location.");
        setLoading(false); // ✅ already correct in error path
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,          // ✅ FIX: 10-second timeout so button doesn't hang forever
        maximumAge: 300000,      // cache coords for 5 min
      }
    );
  };

  const fetchByCity = async () => {
    if (!cityInput.trim()) { setError("Enter a city name"); return; }
    setLoading(true);
    await fetchWeather({ city: cityInput.trim() });
  };

  const fetchWeather = async (params) => {
    setError("");
    try {
      // ✅ uses api.js — token auto-attached, goes via /api proxy
      const res = await getWeather(params);
      setCurrent({ weather: res.weather, tips: res.tips, city: res.city });
      await loadHistory();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch weather. Check OPENWEATHER_API_KEY in .env");
      throw e; // re-throw so detectLocation's try/catch gets it
    } finally {
      setLoading(false);
    }
  };

  const w = current?.weather;

  return (
    <div style={{ background: "#f4f7f4", minHeight: "100vh", padding: "36px 32px" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1a2e1a", marginBottom: "6px" }}>🌦️ Weather-Based Skin Tips</h1>
      <p style={{ color: "#666", marginBottom: "28px", fontSize: "0.88rem" }}>
        Get real-time skincare advice based on your local weather conditions.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {["current", "history"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", borderRadius: "20px", border: "none", cursor: "pointer",
            background: tab === t ? "#2d4a2d" : "white",
            color: tab === t ? "white" : "#555",
            fontWeight: tab === t ? 600 : 400, fontSize: "0.85rem",
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          }}>{t === "current" ? "🌤️ Current" : "📜 History"}</button>
        ))}
      </div>

      {tab === "current" && (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px" }}>
          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 14px", color: "#2d4a2d" }}>📍 Your Location</h3>

              {/* ✅ FIX: button correctly disabled only when loading */}
              <button
                onClick={detectLocation}
                disabled={loading}
                style={{
                  width: "100%", padding: "12px", marginBottom: "12px",
                  background: loading ? "#aaa" : "linear-gradient(135deg,#2d4a2d,#4a7c59)",
                  color: "white", border: "none", borderRadius: "10px",
                  cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.88rem",
                }}
              >
                {loading ? "⏳ Fetching location..." : "📍 Use My Location"}
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchByCity()}
                  placeholder="Or enter city name…"
                  style={{ flex: 1, padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "0.85rem" }}
                />
                <button
                  onClick={fetchByCity}
                  disabled={loading}
                  style={{ padding: "10px 14px", background: "#4a7c59", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                >
                  →
                </button>
              </div>

              {error && (
                <div style={{ marginTop: "12px", color: "#b91c1c", fontSize: "0.82rem", background: "#fef2f2", padding: "10px 12px", borderRadius: "8px", lineHeight: 1.5 }}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Weather metrics card */}
            {w && (
              <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "2.8rem" }}>{conditionIcon(w.condition)}</span>
                  <div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#2d4a2d" }}>{w.temp}°C</div>
                    <div style={{ color: "#888", fontSize: "0.82rem", textTransform: "capitalize" }}>{w.description}</div>
                    <div style={{ color: "#666", fontSize: "0.78rem" }}>📍 {current.city}</div>
                  </div>
                </div>
                {[
                  { icon: "💧", label: "Humidity",    value: `${w.humidity}%`           },
                  { icon: "🔆", label: "UV Index",    value: w.uvIndex ?? "N/A"          },
                  { icon: "🌫️", label: "Air Quality", value: aqiLabel(w.aqi) || "N/A"   },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: "0.85rem" }}>
                    <span style={{ color: "#555" }}>{icon} {label}</span>
                    <span style={{ fontWeight: 600, color: "#2d4a2d" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips panel */}
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", color: "#2d4a2d" }}>🌿 Skincare Recommendations</h3>
            {!current ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#bbb" }}>
                <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🌡️</div>
                <p>Allow location access or enter a city to get personalised skincare tips</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {current.tips?.map((tip, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: "12px",
                    background: i === 0 ? "#e8f4fd" : "#f0fdf4",
                    borderLeft: `4px solid ${i === 0 ? "#2980b9" : "#4a7c59"}`,
                    fontSize: "0.85rem", color: "#333", lineHeight: 1.5,
                  }}>
                    {tip}
                  </div>
                ))}

                {w && (
                  <div style={{ marginTop: "8px", padding: "16px", background: "#fff8e1", borderRadius: "12px", border: "1px solid #ffe082" }}>
                    <h4 style={{ margin: "0 0 8px", color: "#e67e22", fontSize: "0.88rem" }}>⚠️ Watch Out For</h4>
                    <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: "0.8rem", color: "#555", lineHeight: 1.8 }}>
                      {w.temp >= 35     && <li>Excess sebum / oily skin — blot regularly</li>}
                      {w.humidity <= 40 && <li>Dryness & flakiness — reapply moisturiser</li>}
                      {w.uvIndex >= 6   && <li>UV damage — SPF is non-negotiable</li>}
                      {w.aqi >= 100     && <li>Pollution-triggered breakouts — double-cleanse tonight</li>}
                      {w.humidity >= 75 && <li>Fungal skin issues — keep skin dry and clean</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", color: "#2d4a2d" }}>📜 Weather Recommendation History</h3>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#bbb" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>📭</div>
              <p>No history yet. Fetch weather once to start saving records.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {history.map((h, i) => (
                <div key={h._id || i} style={{ padding: "14px 16px", borderRadius: "10px", background: "#fafafa", border: "1px solid #eee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ fontWeight: 600, color: "#2d4a2d", fontSize: "0.88rem" }}>
                      {conditionIcon(h.weather?.condition)} {h.city} — {h.weather?.temp}°C
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#aaa" }}>
                      {new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "6px" }}>
                    💧 {h.weather?.humidity}% humidity · 🔆 UV {h.weather?.uvIndex ?? "N/A"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#555", lineHeight: 1.5 }}>{h.tips?.[0]}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherPage;
const axios                 = require("axios");
const WeatherRecommendation = require("../models/WeatherRecommendation");
const Notification          = require("../models/Notification");

// ─── Rule-based tip generator ─────────────────────────────────────────────────
const generateTips = ({ temp, humidity, uvIndex, condition = "", aqi }) => {
  const tips = [];
  const c    = condition.toLowerCase();

  if (temp >= 40)       tips.push("🌡️ Temperature above 40 °C. Apply SPF 50+ and drink 3 L of water today.");
  else if (temp >= 35)  tips.push("☀️ Hot day ahead. Reapply sunscreen every 2 hours when outdoors.");
  else if (temp <= 10)  tips.push("🧣 Cold weather detected. Use a rich moisturiser to prevent dry, flaky skin.");

  if (uvIndex >= 8)     tips.push("🔆 High UV index! Wear SPF 50+ and protective clothing — avoid peak sun hours.");
  else if (uvIndex >= 5)tips.push("🌤️ Moderate UV. Don't skip sunscreen today.");

  if (humidity <= 30)   tips.push("💧 Low humidity. Layer a hydrating serum under your moisturiser.");
  else if (humidity >= 80) tips.push("🌧️ High humidity can trigger acne. Use oil-free products and cleanse well tonight.");

  if (c.includes("rain"))  tips.push("🌦️ Rainy weather increases surface bacteria. Keep hands away from your face.");
  if (c.includes("dust") || c.includes("sand")) tips.push("🏜️ Dust detected. Use a barrier cream and double-cleanse tonight.");

  if (aqi && aqi >= 150) tips.push(`🏭 Poor air quality (AQI ${aqi}). Cleanse thoroughly to remove pollution particles.`);
  else if (aqi && aqi >= 100) tips.push("😷 Moderate pollution. A Vitamin C serum will help fight free radical damage.");

  if (!tips.length) tips.push("✅ Conditions are great for your skin today! Keep up your regular routine.");
  return tips;
};

const conditionIcon = (cond = "") => {
  const c = cond.toLowerCase();
  if (c.includes("rain"))  return "🌧️";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("storm")) return "⛈️";
  if (c.includes("snow"))  return "❄️";
  return "☀️";
};

// ─── GET /api/weather  ────────────────────────────────────────────────────────
// Query params: lat & lon  OR  city
const getWeather = async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    // ── If no API key → return a sensible mock so the UI doesn't break ──
    if (!apiKey || apiKey === "your_openweather_api_key_here") {
      const mockWeather = { temp: 28, humidity: 60, uvIndex: 5, condition: "Clear", description: "clear sky", aqi: null };
      const mockTips    = generateTips(mockWeather);
      const cityName    = city || "Your location";

      const rec = await WeatherRecommendation.create({ userId: req.user._id, city: cityName, weather: mockWeather, tips: mockTips });

      for (const tip of mockTips) {
        await Notification.create({ userId: req.user._id, type: "weather", message: tip });
      }

      return res.json({ success: true, weather: mockWeather, tips: mockTips, city: cityName, mock: true, message: "Add OPENWEATHER_API_KEY to .env for live data" });
    }

    // ── Build OWM URLs ──
    let weatherUrl = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}&units=metric`;
    if (lat && lon) weatherUrl += `&lat=${lat}&lon=${lon}`;
    else if (city)  weatherUrl += `&q=${encodeURIComponent(city)}`;
    else return res.status(400).json({ success: false, message: "Provide lat+lon or city" });

    const weatherRes = await axios.get(weatherUrl, { timeout: 8000 });
    const w          = weatherRes.data;

    let uvIndex = 0;
    let aqi     = null;

    // UV index (OWM 2.5)
    if (lat && lon) {
      try {
        const uvRes  = await axios.get(`https://api.openweathermap.org/data/2.5/uvi?appid=${apiKey}&lat=${lat}&lon=${lon}`, { timeout: 5000 });
        uvIndex = uvRes.data.value ?? 0;
      } catch { /* optional endpoint */ }

      // Air quality
      try {
        const aqiRes = await axios.get(`https://api.openweathermap.org/data/2.5/air_pollution?appid=${apiKey}&lat=${lat}&lon=${lon}`, { timeout: 5000 });
        aqi = aqiRes.data?.list?.[0]?.main?.aqi ?? null;
      } catch { /* optional */ }
    }

    const weather = {
      temp:        Math.round(w.main.temp),
      humidity:    w.main.humidity,
      uvIndex:     Math.round(uvIndex),
      condition:   w.weather?.[0]?.main || "Clear",
      description: w.weather?.[0]?.description || "",
      aqi,
    };

    const tips     = generateTips(weather);
    const cityName = w.name || city || "Your location";

    // ── Persist to MongoDB ──
    const rec = await WeatherRecommendation.create({ userId: req.user._id, city: cityName, weather, tips });

    // ── Create in-app weather notifications ──
    for (const tip of tips) {
      await Notification.create({ userId: req.user._id, type: "weather", message: tip });
    }

    res.json({ success: true, weather, tips, city: cityName, icon: conditionIcon(weather.condition), recordId: rec._id });
  } catch (err) {
    console.error("Weather error:", err.response?.data || err.message);

    // Friendly error for bad API keys
    if (err.response?.status === 401)
      return res.status(400).json({ success: false, message: "Invalid OpenWeather API key. Check OPENWEATHER_API_KEY in .env" });
    if (err.response?.status === 404)
      return res.status(400).json({ success: false, message: "City not found. Try a different city name." });

    res.status(500).json({ success: false, message: `Weather fetch failed: ${err.message}` });
  }
};

// ─── GET /api/weather/history ─────────────────────────────────────────────────
const getWeatherHistory = async (req, res) => {
  try {
    const history = await WeatherRecommendation.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getWeather, getWeatherHistory };
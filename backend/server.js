require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");

// ─── Route imports ─────────────────────────────────────────────────────────────
const authRoutes         = require("./src/routes/authRoutes");
const skinRoutes         = require("./src/routes/skinRoutes");
const paymentRoutes      = require("./src/routes/paymentRoutes");
const progressRoutes     = require("./src/routes/progressRoutes");
const coachRoutes        = require("./src/routes/coachRoutes");
const modelRoutes        = require("./src/routes/modelRoutes");
const dailyRoutes        = require("./src/routes/dailyRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const weatherRoutes      = require("./src/routes/weatherRoutes");
const historyRoutes      = require("./src/routes/historyRoutes");
const pointsRoutes       = require("./src/routes/pointsRoutes");

const app  = express();
const PORT = process.env.PORT || 8000;

// ─── MongoDB ───────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => { console.error("❌ MongoDB:", err.message); process.exit(1); });

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}));
app.options("*", cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/skin",          skinRoutes);
app.use("/api/payment",       paymentRoutes);
app.use("/api/progress",      progressRoutes);
app.use("/api/coach",         coachRoutes);
app.use("/api/model",         modelRoutes);
app.use("/api/daily",         dailyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/weather",       weatherRoutes);
app.use("/api/history",       historyRoutes);
app.use("/api/points",        pointsRoutes);

// ─── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({
    status: "OK",
    db:     mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    email:  process.env.EMAIL_USER ? "configured" : "disabled (set EMAIL_USER + EMAIL_PASS in .env)",
  })
);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

// ─── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔥", err.stack);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🌿 DermisAI backend → http://localhost:${PORT}`);
  console.log(`📧  Email notifications: ${process.env.EMAIL_USER ? `enabled (${process.env.EMAIL_USER})` : "disabled — add EMAIL_USER + EMAIL_PASS to .env"}`);
});
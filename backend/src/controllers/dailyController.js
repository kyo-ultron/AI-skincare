const SkinAnalysis  = require("../models/SkinAnalysis");
const { User }      = require("../controllers/authController");
const { analyzeSkin }            = require("../services/skinAnalysisService");
const { getProductsByConditions } = require("../data/products");

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Derive 0-100 scores from a Gemini analysis object */
const deriveScores = (analysis = {}) => {
  const conditions = (analysis.conditions || []).map(c => c.toLowerCase());
  const healthMap  = { Excellent: 92, Good: 78, Fair: 58, Poor: 38 };
  const base       = healthMap[analysis.overallHealth] || 58;

  const has = (kw) => conditions.some(c => c.includes(kw));

  return {
    overall:   base,
    clarity:   Math.max(15, base - (has("acne") || has("breakout") ? 22 : 0)),
    hydration: Math.max(15, base - (has("dry") ? 25 : 0) + (has("oily") ? 5 : 0)),
    evenness:  Math.max(15, base - (has("pigment") || has("uneven") || has("dark spot") ? 20 : 0)),
  };
};

/** Pick an insight tag by comparing current vs previous scores */
const deriveInsight = (scores, prevScores) => {
  if (!prevScores) return "Stable";
  const delta = scores.overall - prevScores.overall;
  if (delta >= 5)  return "Skin improving";
  if (delta <= -4) return "Needs consistency";
  if (scores.hydration - prevScores.hydration >= 8) return "Hydration improved";
  if (scores.clarity   - prevScores.clarity   >= 8) return "Acne reduced";
  return "Stable";
};

/** Award points + badges, mutates the user document then saves it */
const rewardUser = async (user, totalDailyAnalyses) => {
  user.points = (user.points || 0) + 10;   // 10 pts per daily analysis

  // badges
  const add = (badge) => { if (!user.badges.includes(badge)) user.badges.push(badge); };
  if (totalDailyAnalyses >= 1)  add("first_analysis");
  if (totalDailyAnalyses >= 7)  add("week_warrior");
  if (totalDailyAnalyses >= 30) add("monthly_master");
  if ((user.streak || 0) >= 7)  add("streak_7");

  await user.save();
};

// ─── POST /api/daily/analyze ──────────────────────────────────────────────────
const dailyAnalyze = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: "No image provided" });

    // Strip data-URL prefix if present
    let base64Data    = image;
    let mediaType     = "image/jpeg";
    const dataMatch   = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (dataMatch) { mediaType = dataMatch[1]; base64Data = dataMatch[2]; }

    const allowed = ["image/jpeg","image/jpg","image/png","image/webp"];
    if (!allowed.includes(mediaType))
      return res.status(400).json({ success: false, message: "Unsupported image type" });

    // ── Run Gemini analysis ──
    const skinAnalysis = await analyzeSkin(base64Data, mediaType);
    const scores       = deriveScores(skinAnalysis);

    // ── Fetch previous entry to compute insight ──
    const prevEntry = await SkinAnalysis.findOne({ userId: req.user._id, isDaily: true })
      .sort({ createdAt: -1 })
      .select("scores");

    const insight = deriveInsight(scores, prevEntry?.scores);

    // ── Count existing daily entries for dayNumber ──
    const count = await SkinAnalysis.countDocuments({ userId: req.user._id, isDaily: true });

    // ── Save to MongoDB ──
    const entry = await SkinAnalysis.create({
      userId:      req.user._id,
      imageBase64: base64Data,
      analysis:    skinAnalysis,
      scores,
      isDaily:     true,
      dayNumber:   count + 1,
      insight,
      analysedAt:  new Date(),
    });

    // ── Update user streak ──
    const user      = req.user;              // Mongoose doc (set by authMiddleware)
    const todayStr  = new Date().toDateString();
    const lastStr   = user.lastLoginDate ? new Date(user.lastLoginDate).toDateString() : null;
    const yesterStr = new Date(Date.now() - 86_400_000).toDateString();

    if (lastStr !== todayStr) {
      user.streak        = (lastStr === yesterStr) ? (user.streak || 0) + 1 : 1;
      user.lastLoginDate = new Date();
    }

    await rewardUser(user, count + 1);

    // ── Product recommendations ──
    const products = getProductsByConditions(skinAnalysis.conditions || []);

    res.json({
      success:      true,
      entry: {
        _id:        entry._id,
        dayNumber:  entry.dayNumber,
        scores,
        analysis:   skinAnalysis,
        insight,
        analysedAt: entry.analysedAt,
        isDaily:    true,
      },
      products,
      pointsEarned: 10,
      streak:       user.streak,
      totalPoints:  user.points,
      badges:       user.badges,
      insight,
    });
  } catch (err) {
    console.error("Daily analyze error:", err);
    res.status(500).json({ success: false, message: `Analysis failed: ${err.message}` });
  }
};

// ─── GET /api/daily/history ───────────────────────────────────────────────────
const getDailyHistory = async (req, res) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit) || 30, 90);
    const entries = await SkinAnalysis.find({ userId: req.user._id, isDaily: true })
      .select("-imageBase64")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/daily/progress ──────────────────────────────────────────────────
/**
 * Returns structured data for the Dashboard chart + summary cards.
 * Also called by DashboardPage to check if user has any analyses.
 */
const getProgress = async (req, res) => {
  try {
    const entries = await SkinAnalysis.find({ userId: req.user._id, isDaily: true })
      .select("scores insight dayNumber analysedAt createdAt analysis")
      .sort({ createdAt: 1 })
      .limit(90);

    // Build chart data array
    const chartData = entries.map(e => ({
      day:       e.dayNumber,
      date:      e.analysedAt || e.createdAt,
      overall:   e.scores?.overall   || 0,
      clarity:   e.scores?.clarity   || 0,
      hydration: e.scores?.hydration || 0,
      evenness:  e.scores?.evenness  || 0,
      insight:   e.insight,
      conditions:e.analysis?.conditions || [],
      health:    e.analysis?.overallHealth,
    }));

    if (!entries.length) {
      return res.json({ success: true, hasData: false, chartData: [], summary: null });
    }

    // Summary
    const first = entries[0].scores?.overall || 50;
    const last  = entries[entries.length - 1].scores?.overall || 50;
    const improvementPct = Math.round(((last - first) / (first || 1)) * 100);

    const lastDate      = new Date(entries[entries.length - 1].analysedAt || entries[entries.length - 1].createdAt);
    const daysSinceLast = Math.floor((Date.now() - lastDate) / 86_400_000);

    // Most frequent insight
    const insightCount = {};
    entries.forEach(e => { insightCount[e.insight] = (insightCount[e.insight] || 0) + 1; });
    const topInsight = Object.entries(insightCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Stable";

    // Linear projection to score = 80
    let daysToGoal = null;
    if (entries.length >= 2) {
      const rate = (last - first) / (entries.length - 1);
      if (rate > 0 && last < 80) daysToGoal = Math.ceil((80 - last) / rate);
    }

    res.json({
      success: true,
      hasData: true,
      chartData,
      summary: {
        totalEntries:  entries.length,
        improvementPct,
        topInsight,
        skippedWarning: daysSinceLast >= 2,
        daysSinceLast,
        daysToGoal,
        latestScores:  entries[entries.length - 1].scores,
        latestAnalysis:entries[entries.length - 1].analysis,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/daily/all-analyses ─────────────────────────────────────────────
/** Used by History page — returns all analyses (daily + on-demand skin analyses) */
const getAllAnalyses = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end   = new Date(year, month, 1);
      query.createdAt = { $gte: start, $lt: end };
    }

    const entries = await SkinAnalysis.find(query)
      .select("-imageBase64")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await SkinAnalysis.countDocuments(query);

    res.json({ success: true, entries, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { dailyAnalyze, getDailyHistory, getProgress, getAllAnalyses };
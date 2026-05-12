const SkinAnalysis  = require("../models/SkinAnalysis");
const ProgressEntry = require("../models/ProgressEntry");
const UserProfile   = require("../models/UserProfile");
const { analyzeSkin }             = require("../services/skinAnalysisService");
const { getProductsByConditions } = require("../data/products");

// Helper: derive scores from analysis
const deriveScores = (analysis = {}) => {
  const conditions = (analysis.conditions || []).map(c => c.toLowerCase());
  const healthMap  = { Excellent: 92, Good: 78, Fair: 58, Poor: 38 };
  const base       = healthMap[analysis.overallHealth] || 58;
  const has        = (kw) => conditions.some(c => c.includes(kw));
  return {
    overall:   base,
    clarity:   Math.max(15, base - (has("acne") || has("breakout") ? 22 : 0)),
    hydration: Math.max(15, base - (has("dry") ? 25 : 0) + (has("oily") ? 5 : 0)),
    evenness:  Math.max(15, base - (has("pigment") || has("uneven") ? 20 : 0)),
  };
};

// POST /api/progress/entry  — saves an analysis to ProgressEntry (legacy) AND SkinAnalysis (new)
const saveEntry = async (req, res) => {
  try {
    const { imageBase64, analysis, isOnboarding, photoIndex } = req.body;
    const userId = req.user._id.toString();

    if (!imageBase64 || !analysis)
      return res.status(400).json({ success: false, message: "imageBase64 and analysis are required" });

    // ── Ensure UserProfile exists ──
    let profile = await UserProfile.findOne({ userId });
    if (!profile) profile = await UserProfile.create({ userId });

    const msPerDay  = 86_400_000;
    const dayNumber = Math.floor((Date.now() - profile.startDate) / msPerDay) + 1;
    const scores    = deriveScores(analysis);

    // ── Save to legacy ProgressEntry ──
    await ProgressEntry.create({ userId, dayNumber, isOnboarding: isOnboarding || false, photoIndex: photoIndex || 0, imageBase64, analysis, scores });

    // ── ALSO save to SkinAnalysis so dashboard/history work ──
    await SkinAnalysis.create({
      userId:      req.user._id,
      imageBase64,
      analysis,
      scores,
      isDaily:     !isOnboarding,
      dayNumber,
      insight:     "Stable",
      analysedAt:  new Date(),
    });

    // ── Update UserProfile ──
    const updates = { lastEntryDate: new Date() };
    if (isOnboarding) {
      updates.onboardingPhotos = (profile.onboardingPhotos || 0) + 1;
      if (updates.onboardingPhotos >= 1) {   // mark complete after first photo
        updates.onboardingComplete   = true;
        updates.baselineConditions   = analysis.conditions || [];
        updates.baselineHealth       = analysis.overallHealth;
      }
    } else {
      const yesterday      = new Date(Date.now() - msPerDay);
      const isConsecutive  = profile.lastEntryDate && new Date(profile.lastEntryDate).toDateString() === yesterday.toDateString();
      updates.streak       = isConsecutive ? (profile.streak || 0) + 1 : 1;
      updates.currentDay   = dayNumber;
      if (!profile.onboardingComplete) {
        updates.onboardingComplete = true;
        if (!profile.baselineConditions?.length) {
          updates.baselineConditions = analysis.conditions || [];
          updates.baselineHealth     = analysis.overallHealth;
        }
      }
    }
    await UserProfile.findOneAndUpdate({ userId }, updates);

    res.json({ success: true, scores, dayNumber });
  } catch (err) {
    console.error("saveEntry error:", err);
    res.status(500).json({ success: false, message: "Failed to save entry" });
  }
};

// GET /api/progress/dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Try SkinAnalysis first (more complete data)
    const skinEntries = await SkinAnalysis.find({ userId: req.user._id, isDaily: true })
      .select("-imageBase64")
      .sort({ createdAt: 1 })
      .limit(90);

    // Also check legacy ProgressEntry
    const legacyEntries = await ProgressEntry.find({ userId, isOnboarding: false })
      .select("-imageBase64")
      .sort({ createdAt: 1 })
      .limit(90);

    // Merge: prefer SkinAnalysis, fall back to legacy
    const hasNewData    = skinEntries.length > 0;
    const hasLegacyData = legacyEntries.length > 0;
    const hasAnyData    = hasNewData || hasLegacyData;

    if (!hasAnyData) {
      // Check if a UserProfile exists at all
      const profile = await UserProfile.findOne({ userId });
      return res.json({
        success: true,
        onboardingComplete: false,
        hasAnyEntries: false,
        chartData: [],
        profile: profile ? { startDate: profile.startDate, currentDay: profile.currentDay || 1, streak: profile.streak || 0, baselineConditions: profile.baselineConditions || [], baselineHealth: profile.baselineHealth } : null,
        improvement: 0,
        totalEntries: 0,
      });
    }

    // Build unified chart data
    const source = hasNewData ? skinEntries : legacyEntries;
    const chartData = source.map(e => ({
      day:       e.dayNumber,
      date:      e.analysedAt || e.date || e.createdAt,
      overall:   e.scores?.overall   || 0,
      clarity:   e.scores?.clarity   || 0,
      hydration: e.scores?.hydration || 0,
      evenness:  e.scores?.evenness  || 0,
      health:    e.analysis?.overallHealth,
      conditions:e.analysis?.conditions || [],
      insight:   e.insight,
    }));

    // Improvement delta
    const firstScore = source[0].scores?.overall || 50;
    const lastScore  = source[source.length - 1].scores?.overall || 50;
    const improvement = Math.round(lastScore - firstScore);

    // Profile
    let profile = await UserProfile.findOne({ userId });
    if (!profile) profile = { startDate: new Date(), currentDay: 1, streak: 0, baselineConditions: [], baselineHealth: "Fair" };

    res.json({
      success: true,
      onboardingComplete: true,    // we have data → onboarding is done
      hasAnyEntries: true,
      chartData,
      profile: {
        startDate:          profile.startDate,
        currentDay:         profile.currentDay || 1,
        streak:             profile.streak || 0,
        baselineConditions: profile.baselineConditions || (source[0].analysis?.conditions || []),
        baselineHealth:     profile.baselineHealth     || source[0].analysis?.overallHealth,
      },
      latestAnalysis: source[source.length - 1].analysis,
      improvement,
      totalEntries: source.length,
    });
  } catch (err) {
    console.error("getDashboard error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard" });
  }
};

// GET /api/progress/photo/:entryId
const getPhoto = async (req, res) => {
  try {
    const entry = await ProgressEntry.findOne({ _id: req.params.entryId, userId: req.user._id.toString() }).select("imageBase64");
    if (!entry) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, image: entry.imageBase64 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch photo" });
  }
};

module.exports = { saveEntry, getDashboard, getPhoto };
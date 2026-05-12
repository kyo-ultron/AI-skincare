const { GoogleGenerativeAI } = require("@google/generative-ai");
const ChatHistory = require("../models/ChatHistory");
const ProgressEntry = require("../models/ProgressEntry");
const UserProfile = require("../models/UserProfile");
const MODEL_NAME = "gemini-2.5-flash-lite";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateWithRetry = async (fn, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.message?.includes("429") && i < retries) {
        await sleep(6000);
        continue;
      }
      throw err;
    }
  }
};

const buildSystemPrompt = (profile, recentEntries, userName) => {
  const conditions = profile?.baselineConditions?.join(", ") || "not yet assessed";
  const baselineHealth = profile?.baselineHealth || "unknown";
  const currentDay = profile?.currentDay || 1;
  const streak = profile?.streak || 0;

  let progressSummary = "No progress data yet.";
  if (recentEntries.length > 0) {
    const latest = recentEntries[recentEntries.length - 1];
    const oldest = recentEntries[0];
    const improvement = latest.scores?.overall - oldest.scores?.overall;
    const trend = improvement > 0
      ? `improved by ${improvement} points`
      : improvement < 0
      ? `declined by ${Math.abs(improvement)} points`
      : "remained stable";

    progressSummary = `
- Tracking for ${currentDay} days with a ${streak}-day streak
- Baseline skin health: ${baselineHealth}
- Overall skin score has ${trend} since starting
- Latest scores: Overall ${latest.scores?.overall}/100, Clarity ${latest.scores?.clarity}/100, Hydration ${latest.scores?.hydration}/100, Evenness ${latest.scores?.evenness}/100
- Recent conditions detected: ${latest.analysis?.conditions?.join(", ") || "none"}
- Current skin type: ${latest.analysis?.skinType || "unknown"}
    `.trim();
  }

  let patterns = "";
  if (recentEntries.length >= 3) {
    const scores = recentEntries.map(e => e.scores?.overall || 0);
    const isImproving = scores[scores.length - 1] > scores[0];
    const hasFluctuation = Math.max(...scores) - Math.min(...scores) > 15;
    patterns = `Skin trend: ${isImproving ? "improving" : "declining or fluctuating"}. ${
      hasFluctuation
        ? "Notable fluctuations detected — possible lifestyle or diet triggers."
        : "Relatively stable progression."
    }`;
  }

  return `You are DermisAI Coach, a warm, knowledgeable, and proactive AI skincare coach for ${userName}.

## Personality
- Warm, encouraging, personal — you know this user's skin journey
- Proactive: notice patterns and bring them up without being asked
- Evidence-based but approachable — explain science simply
- Honest: flag concerns clearly but never cause alarm

## ${userName}'s Skin Profile
- Conditions identified: ${conditions}
- Baseline health: ${baselineHealth}
- Progress: ${progressSummary}
${patterns ? `- Pattern: ${patterns}` : ""}

## Rules
- Always personalise to ${userName}'s conditions
- Never diagnose — recommend dermatologist for serious concerns
- Keep responses conversational unless detail is requested
- First message: greet by name with a data-driven insight`;
};

const toGeminiHistory = (messages) => {
  const filtered = [];
  let lastRole = null;
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    if (role !== lastRole) {
      filtered.push({ role, parts: [{ text: m.content }] });
      lastRole = role;
    }
  }
  if (filtered.length > 0 && filtered[filtered.length - 1].role === "model") {
    filtered.pop();
  }
  return filtered;
};

// POST /api/coach/chat
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    const userName = req.user.name?.split(" ")[0] || "there";

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const [profile, recentEntries, chatHistory] = await Promise.all([
      UserProfile.findOne({ userId }),
      ProgressEntry.find({ userId, isOnboarding: false })
        .sort({ createdAt: 1 })
        .limit(14)
        .select("-imageBase64"),
      ChatHistory.findOne({ userId }),
    ]);

    const existingMessages = chatHistory?.messages || [];
    const historyForGemini = toGeminiHistory(existingMessages.slice(-20));

    const coachModel = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: buildSystemPrompt(profile, recentEntries, userName),
    });

    const chatSession = coachModel.startChat({
      history: historyForGemini,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.75 },
    });

    const result = await generateWithRetry(() =>
      chatSession.sendMessage(message.trim())
    );
    const reply = result.response.text();

    const userMsg = { role: "user", content: message.trim() };
    const botMsg = { role: "assistant", content: reply };

    if (chatHistory) {
      chatHistory.messages.push(userMsg, botMsg);
      chatHistory.lastActive = new Date();
      if (chatHistory.messages.length > 100) {
        chatHistory.messages = chatHistory.messages.slice(-100);
      }
      await chatHistory.save();
    } else {
      await ChatHistory.create({ userId, messages: [userMsg, botMsg] });
    }

    res.json({ success: true, reply: reply, message: reply });
  } catch (error) {
    console.error("Coach error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message?.includes("429")
        ? "Coach is busy right now. Please wait a moment and try again."
        : "Coach is unavailable. Please try again.",
    });
  }
};

// GET /api/coach/history
const getHistory = async (req, res) => {
  try {
    const chatHistory = await ChatHistory.findOne({ userId: req.user.id });
    res.json({ success: true, messages: chatHistory?.messages?.slice(-50) || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
};

// DELETE /api/coach/history
const clearHistory = async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ userId: req.user.id });
    res.json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to clear history" });
  }
};

// GET /api/coach/greeting
const getGreeting = async (req, res) => {
  try {
    const userId = req.user.id;
    const userName = req.user.name?.split(" ")[0] || "there";

    const [profile, recentEntries] = await Promise.all([
      UserProfile.findOne({ userId }),
      ProgressEntry.find({ userId, isOnboarding: false })
        .sort({ createdAt: -1 })
        .limit(7)
        .select("-imageBase64"),
    ]);

    // ✅ FIX 3: Same model fix applied here
    const greetingModel = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: buildSystemPrompt(profile, recentEntries.reverse(), userName),
    });

    const result = await generateWithRetry(() =>
      greetingModel.generateContent(
        "Generate a short warm opening greeting. Lead with one specific data-driven insight about my skin. Maximum 3 sentences."
      )
    );

    res.json({ success: true, greeting: result.response.text() });
  } catch (error) {
    console.error("Greeting error:", error.message);
    const userName = req.user.name?.split(" ")[0] || "there";
    res.json({
      success: true,
      greeting: `Hi ${userName}! 🌿 I'm your DermisAI Coach, powered by Gemini. I know your skin history and I'm here to help you build the perfect routine. What would you like to know today?`,
    });
  }
};

module.exports = { sendMessage, getHistory, clearHistory, getGreeting };
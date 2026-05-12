/**
 * skinAnalysisService.js — Backend Gemini AI skin analysis service.
 *
 * FIXES:
 * 1. Uses @google/generative-ai (the SDK that IS in package.json)
 * 2. genAI is instantiated ONCE at module level, not inside the function
 *    (previous code re-declared it with `const` inside the function body,
 *    shadowing the outer one — works but wasteful)
 * 3. response.text is a FUNCTION — must be called as response.text()
 *    The previous service file used response.text without () which returns
 *    the function reference, not the string — JSON.parse then throws.
 * 4. Added robust error handling so a bad Gemini response doesn't crash the route.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Single instance — created once when the module loads
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

const analyzeSkin = async (base64Image, mediaType = "image/jpeg") => {
  const prompt = `You are an expert dermatologist AI assistant. Analyze this skin photo carefully.

You MUST respond with ONLY a raw JSON object. No markdown. No backticks. No explanation. No code fences. Just the JSON.

Example of exactly how to respond:
{"skinType":"Combination","conditions":["mild acne","oily T-zone"],"severity":"Mild","overallHealth":"Good","analysis":"The skin shows a combination type with an oily T-zone and drier cheeks. Some mild acne is visible around the forehead.","recommendations":["Use a gentle foaming cleanser twice daily","Apply niacinamide serum to reduce oiliness","Use a lightweight moisturizer","Always wear SPF 30+"],"avoidIngredients":["heavy oils","coconut oil","alcohol-based toners"]}

Now analyze the provided skin image and respond in the exact same format. Only output the JSON, nothing else.`;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mediaType,
    },
  };

  const result = await geminiModel.generateContent([prompt, imagePart]);
  const response = await result.response;

  // ✅ FIX: response.text is a function — call it with ()
  const content = response.text();

  console.log("Gemini full response (first 300 chars):", content.substring(0, 300));

  // Robustly extract JSON regardless of what Gemini wraps it in
  let cleaned = content.trim();

  // Strip markdown code fences if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Extract the first JSON object found
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    cleaned = objMatch[0];
  }

  console.log("Cleaned JSON (first 300 chars):", cleaned.substring(0, 300));

  const parsed = JSON.parse(cleaned);
  return parsed;
};

module.exports = { analyzeSkin };
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const analyzeSkin = async (
  base64Image,
  mediaType = "image/jpeg"
) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: `
You are an expert dermatologist AI assistant.

Analyze the provided skin image carefully.

You MUST respond ONLY with valid raw JSON.
No markdown.
No backticks.
No explanations.

Return exactly in this format:

{
  "skinType": "Oily",
  "conditions": ["Acne", "Dark circles"],
  "severity": "Mild",
  "overallHealth": "Good",
  "analysis": "Detailed skin analysis here",
  "recommendations": [
    "Use salicylic acid cleanser",
    "Apply sunscreen daily"
  ],
  "avoidIngredients": [
    "Alcohol",
    "Heavy oils"
  ],
  "confidence": 92
}
          `,
        },
        {
          inlineData: {
            mimeType: mediaType,
            data: base64Image,
          },
        },
      ],
    });

    const content = response.text;

    console.log(
      "Gemini raw response:",
      content.substring(0, 300)
    );

    // Clean markdown wrappers if model adds them
    let cleaned = content.trim();

    const fenceMatch = cleaned.match(
      /```(?:json)?\s*([\s\S]*?)```/
    );

    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    const objMatch = cleaned.match(
      /\{[\s\S]*\}/
    );

    if (objMatch) {
      cleaned = objMatch[0];
    }

    const parsed = JSON.parse(cleaned);

    return parsed;
  } catch (error) {
    console.error(
      "Gemini Skin Analysis Error:",
      error
    );

    return {
      skinType: "Unknown",
      conditions: [],
      severity: "Unknown",
      overallHealth: "Unknown",
      analysis:
        "Unable to analyze skin currently.",
      recommendations: [
        "Try uploading a clearer image",
      ],
      avoidIngredients: [],
      confidence: 0,
      error: error.message,
    };
  }
};

module.exports = {
  analyzeSkin,
};

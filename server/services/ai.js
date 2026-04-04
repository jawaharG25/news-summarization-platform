const { GoogleGenAI } = require('@google/genai');

// We use the new SDK as requested if GEMINI_API_KEY is available
let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

async function analyzeArticle(title, content) {
  if (!ai) {
    console.warn("No GEMINI_API_KEY found. Returning mock analysis data.");
    return {
      summary: [
        "This is a mock summary point 1 based on the title.",
        "Mock summary point 2 highlights the main entities.",
        "Mock summary point 3 provides the conclusion."
      ],
      sentiment: 40, // 0 to 100 where 50 is neutral
      biasScore: 75 // 0(Left) to 100(Right)
    };
  }

  const prompt = `
    Analyze the following news article.
    Title: ${title}
    Content: ${content}

    Provide the output strictly as a JSON object with the following structure:
    {
      "summary": ["point 1", "point 2", "point 3"],
      "sentiment": <a number from 0 to 100 where 0 is extremely negative, 50 is neutral, and 100 is extremely positive>,
      "biasScore": <a number from 0 to 100 indicating political bias. 0 is extremely Left-leaning, 50 is strictly Center/Neutral, 100 is extremely Right-leaning>
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    const resultObj = JSON.parse(resultText);
    return resultObj;

  } catch (err) {
    console.error("AI Analysis Failed:", err);
    throw new Error("Failed to analyze article with AI. " + err.message);
  }
}

async function generateEmbedding(text) {
  if (!ai) {
    console.warn("No GEMINI_API_KEY found. Returning mock embedding.");
    return Array(768).fill(0); // Mock 768-dimensional vector
  }
  
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text
    });
    return response.embeddings[0].values;
  } catch (err) {
    console.error("AI Embedding Failed:", err);
    throw new Error("Failed to generate embedding.");
  }
}

module.exports = { analyzeArticle, generateEmbedding };

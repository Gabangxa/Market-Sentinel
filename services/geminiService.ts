import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const MODEL_NAME = "gemini-3-pro-preview"; 

const SYSTEM_PROMPT = `You are a senior financial market analyst. 
Analyze the provided chat history from a Discord channel. 
Identify key themes, market sentiment, and significant events mentioned by users.

CRITICAL: Your output must be a perfectly formed JSON object. 
Do not include any conversational text before or after the JSON.
Escape all newlines and quotes within the markdown summary correctly.`;

const RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        overallSentiment: { 
          type: Type.NUMBER,
          description: "Sentiment score from -1.0 (bearish) to 1.0 (bullish)"
        },
        summaryMarkdown: { 
          type: Type.STRING,
          description: "Detailed analysis summary in Markdown format"
        },
        keyThemes: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of 3-5 key market themes"
        }
    },
    required: ["overallSentiment", "summaryMarkdown", "keyThemes"]
};

export const analyzeChatHistory = async (chatHistory: string): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Chat History from the last hour:\n${chatHistory}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        maxOutputTokens: 4000,
        thinkingConfig: { thinkingBudget: 2000 }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      sentimentScore: data.overallSentiment ?? 0,
      summary: data.summaryMarkdown ?? "No summary generated.",
      themes: data.keyThemes ?? [],
      groundingUrls: [],
    };
  } catch (error) {
    console.error("Discord Analysis Error:", error);
    throw error;
  }
};
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

/**
 * Using Gemini 3 Pro for advanced reasoning and financial pattern recognition.
 */
const MODEL_NAME = "gemini-3-pro-preview"; 

/**
 * The System Instruction defines the persona and output constraints.
 * We enforce a JSON response to ensure the frontend can predictably parse the analysis.
 */
const SYSTEM_PROMPT = `You are a senior financial market analyst. 
Analyze the provided chat history from a Discord channel. 
Identify key themes, market sentiment, and significant events mentioned by users.

CRITICAL: Your output must be a perfectly formed JSON object. 
Do not include any conversational text before or after the JSON.
Escape all newlines and quotes within the markdown summary correctly.`;

/**
 * Strict schema definition for Gemini's structured output.
 * This maps directly to our AnalysisResult type.
 */
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

/**
 * Sends chat logs to Gemini and processes the intelligence report.
 * @param chatHistory - Concatenated string of Discord messages
 */
export const analyzeChatHistory = async (chatHistory: string): Promise<AnalysisResult> => {
  try {
    // Initialize the SDK with the environment API Key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Chat History from the last hour:\n${chatHistory}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        maxOutputTokens: 4000,
        // Using thinkingBudget to allow the model to reason before summarizing
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
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
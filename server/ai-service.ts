import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini model - use the correct format for the model name
const GEMINI_MODEL = "gemini-1.0-pro";

export class AIService {
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    // Initialize Gemini if API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY || "";
    if (geminiApiKey) {
      this.gemini = new GoogleGenerativeAI(geminiApiKey);
    }
  }

  async generateResponse(prompt: string, username: string): Promise<string> {
    if (!this.gemini) {
      throw new Error("Gemini API key not configured");
    }

    try {
      const model = this.gemini.getGenerativeModel({ model: GEMINI_MODEL });
      
      const result = await model.generateContent({
        contents: [{ 
          role: "user", 
          parts: [{ 
            text: `[You are Brain, an AI assistant for ${username}. Be helpful, friendly, and conversational.]\n\n${prompt}` 
          }]
        }],
      });

      const response = result.response;
      return response.text() || "I'm sorry, I couldn't generate a response.";
    } catch (error: any) {
      console.error("Gemini API error:", error);
      throw new Error(`Error generating Gemini response: ${error.message || 'Unknown error'}`);
    }
  }
}

export const aiService = new AIService();

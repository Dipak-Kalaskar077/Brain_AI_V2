import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini model - use an available model from the API
const GEMINI_MODEL = "gemini-1.5-pro-latest";

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
      console.log(`Generating response with Gemini model: ${GEMINI_MODEL}`);
      console.log(`Prompt: "${prompt.substring(0, 50)}..." for user: ${username}`);
      
      const model = this.gemini.getGenerativeModel({ model: GEMINI_MODEL });
      
      // Create a system prompt to set context
      const systemPrompt = `You are Brain, an AI assistant for ${username}. Be helpful, friendly, and conversational. Keep responses informative but concise.`;
      
      // Create the full prompt with instructions
      const fullPrompt = `${systemPrompt}\n\nUser's question: ${prompt}`;
      
      console.log("Sending request to Gemini API...");
      
      const result = await model.generateContent({
        contents: [{ 
          role: "user", 
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });

      const response = result.response;
      const responseText = response.text() || "I'm sorry, I couldn't generate a response.";
      
      console.log(`Generated response (first 50 chars): "${responseText.substring(0, 50)}..."`);
      
      return responseText;
    } catch (error: any) {
      console.error("Gemini API error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Return a friendly error message instead of throwing
      return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
    }
  }
}

export const aiService = new AIService();

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

  async generateResponse(
    prompt: string, 
    username: string,
    previousMessages: Array<any> = []
  ): Promise<string> {
    if (!this.gemini) {
      throw new Error("Gemini API key not configured");
    }

    try {
      console.log(`Generating response with Gemini model: ${GEMINI_MODEL}`);
      console.log(`Prompt: "${prompt.substring(0, 50)}..." for user: ${username}`);
      
      const model = this.gemini.getGenerativeModel({ model: GEMINI_MODEL });
      
      // Create a system prompt to set context
      const systemPrompt = `You are Brain, a personal AI assistant for ${username}.
Your name is Brain. Always address the user by their exact name: ${username} (not User_1 or Guest).
Be helpful, friendly, and conversational. Keep responses informative but concise.
Your responses should be personalized to ${username}. Avoid generic responses.
Carefully remember details ${username} shares with you during conversation and refer back to them in later responses.
When asked follow-up questions, connect them to previous conversation context.`;
      
      // Build conversation history from previous messages (most recent 8 for better context)
      let conversationHistory = '';
      const recentMessages = previousMessages.slice(0, 8).reverse();
      
      if (recentMessages.length > 0) {
        conversationHistory = "\n\nPrevious conversation:\n";
        recentMessages.forEach(msg => {
          conversationHistory += `${username}: ${msg.content}\n`;
          conversationHistory += `Brain: ${msg.aiResponse}\n`;
        });
        console.log(`Added ${recentMessages.length} previous messages for context`);
      }
      
      // Create the full prompt with instructions and conversation history
      const fullPrompt = `${systemPrompt}${conversationHistory}\n\n${username}: ${prompt}\nBrain:`;
      
      // Debug the conversation context
      if (recentMessages.length > 0) {
        console.log("Using conversation history for context with messages:");
        recentMessages.forEach((msg, i) => {
          console.log(`  ${i+1}. User: ${msg.content.substring(0, 30)}...`);
        });
      }
      
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
      
      // Clean up potential AI misunderstandings
      let cleanedResponse = responseText
        .replace(/^Brain:/i, '') // Remove any "Brain:" prefix
        .replace(/^Assistant:/i, '') // Remove any "Assistant:" prefix
        .trim();
      
      console.log(`Generated response (first 50 chars): "${cleanedResponse.substring(0, 50)}..."`);
      
      return cleanedResponse;
    } catch (error: any) {
      console.error("Gemini API error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Return a friendly error message instead of throwing
      return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
    }
  }
}

export const aiService = new AIService();

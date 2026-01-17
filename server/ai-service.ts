import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini model - use an available model from the API
// Updated to use gemini-2.5-flash (fast and efficient)
const GEMINI_MODEL = "gemini-2.5-flash";
console.log("Gemini key loaded:", process.env.GEMINI_API_KEY?.slice(0, 6));

interface RateLimitInfo {
  lastRequestTime: number;
  requestsInLastMinute: number;
  requestsInLastDay: number;
}

class AIService {
  private gemini: GoogleGenerativeAI | null = null;
  private rateLimitInfo: RateLimitInfo = {
    lastRequestTime: 0,
    requestsInLastMinute: 0,
    requestsInLastDay: 0
  };

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return;
    }
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  private checkRateLimit(): { canProceed: boolean; waitTime?: number } {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    // Reset counters if enough time has passed
    if (now - this.rateLimitInfo.lastRequestTime > oneMinute) {
      this.rateLimitInfo.requestsInLastMinute = 0;
    }
    if (now - this.rateLimitInfo.lastRequestTime > oneDay) {
      this.rateLimitInfo.requestsInLastDay = 0;
    }

    // Check rate limits
    if (this.rateLimitInfo.requestsInLastMinute >= 60) {
      const waitTime = oneMinute - (now - this.rateLimitInfo.lastRequestTime);
      return { canProceed: false, waitTime };
    }
    if (this.rateLimitInfo.requestsInLastDay >= 60) {
      const waitTime = oneDay - (now - this.rateLimitInfo.lastRequestTime);
      return { canProceed: false, waitTime };
    }

    return { canProceed: true };
  }

  private updateRateLimit() {
    const now = Date.now();
    this.rateLimitInfo.lastRequestTime = now;
    this.rateLimitInfo.requestsInLastMinute++;
    this.rateLimitInfo.requestsInLastDay++;
  }

  async generateResponse(
    prompt: string, 
    username: string,
    previousMessages: Array<any> = []
  ): Promise<string> {
    // Check rate limits
    const rateLimitCheck = this.checkRateLimit();
    if (!rateLimitCheck.canProceed) {
      const waitTimeSeconds = Math.ceil((rateLimitCheck.waitTime || 0) / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTimeSeconds} seconds before trying again.`);
    }
    if (!this.gemini) {
      throw new Error("Gemini API key not configured");
    }

    try {
      console.log('Starting AI response generation...');
      
      if (!prompt || typeof prompt !== 'string') {
        throw new Error('Invalid prompt: must be a non-empty string');
      }
      
      if (!this.gemini) {
        console.error('Gemini client not initialized. API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
        throw new Error('Gemini API client not initialized');      
      }

      console.log(`Generating response with Gemini model: ${GEMINI_MODEL}`);
      console.log(`Prompt: "${prompt.substring(0, 50)}..." for user: ${username}`);
      
      // Initialize the model with basic configuration
      const model = this.gemini.getGenerativeModel({ model: GEMINI_MODEL });
      
      if (!model) {
        throw new Error('Failed to initialize Gemini model');
      }
      
      // Create the system prompt
      const systemPrompt = `You are Brain, a personal AI assistant for ${username}. Always address the user as ${username}. Be helpful, friendly, and concise.

IMPORTANT: If the user asks to open an application or website, respond naturally but the system will handle opening it automatically. You can acknowledge their request like "Opening [app name] for you" or "I'll open that for you".`;
      
      // Combine system prompt, history, and current message
      let fullPrompt = systemPrompt + '\n\n';
      
      // Add recent conversation history
      const recentMessages = previousMessages.slice(0, 5).reverse();
      if (recentMessages.length > 0) {
        fullPrompt += 'Previous conversation:\n';
        for (const msg of recentMessages) {
          fullPrompt += `${username}: ${msg.content}\nBrain: ${msg.aiResponse}\n\n`;
        }
      }
      
      // Add current message
      fullPrompt += `${username}: ${prompt}\nBrain:`;
      
      console.log('Sending request to Gemini...');
      // Update rate limit before making the request
      this.updateRateLimit();
      
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const responseText = response.text() || "I'm sorry, I couldn't generate a response.";
      
      // Clean up potential AI misunderstandings
      let cleanedResponse = responseText
        .replace(/^Brain:/i, '') // Remove any "Brain:" prefix
        .replace(/^Assistant:/i, '') // Remove any "Assistant:" prefix
        .trim();
      
      console.log(`Generated response (first 50 chars): "${cleanedResponse.substring(0, 50)}..."`);
      
      return cleanedResponse;
    } catch (error: unknown) {
      console.error('Error generating AI response:', error);
      console.error('Full error details:', error);
      
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        throw new Error(`AI response generation failed: ${error.message}`);
      } else {
        console.error('Non-Error object thrown:', typeof error);
        throw new Error('AI response generation failed: Unknown error');
      }
    }
  }
}

// Create and export a singleton instance
export const aiService = new AIService();

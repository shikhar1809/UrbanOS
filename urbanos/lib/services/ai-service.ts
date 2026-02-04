import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

export class AIService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        if (!API_KEY) {
            console.warn('⚠️ GOOGLE_AI_API_KEY is missing. AI features will not work.');
        }
        this.genAI = new GoogleGenerativeAI(API_KEY || '');
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    /**
     * Interpret spoken text to extract structured report data
     */
    async interpretVoiceReport(text: string): Promise<any> {
        if (!API_KEY) throw new Error('AI API Key missing');

        const prompt = `
      You are an AI assistant for a city reporting app (UrbanOS).
      Analyze the following user complaint and extract structured data.
      
      User Input: "${text}"

      Return ONLY a valid JSON object with these fields:
      - title: Short title (max 50 chars)
      - description: Professional summary of the issue
      - type: One of [infrastructure, sanitation, lighting, security, pollution, other]
      - severity: One of [low, medium, high, critical]
      - urgency: [low, medium, high]
      - location_context: Any location details mentioned (e.g. "near the bank")
      
      Example JSON:
      {
        "title": "Pothole on Main Road",
        "description": "User reported a large pothole causing traffic slowdown near the SBI branch.",
        "type": "infrastructure",
        "severity": "medium",
        "urgency": "medium",
        "location_context": "near SBI branch"
      }
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('AI Interpretation failed:', error);
            throw new Error('Failed to interpret report');
        }
    }

    /**
     * Analyze an uploaded image to identify issues
     */
    async analyzeReportImage(base64Image: string, mimeType: string = 'image/jpeg'): Promise<any> {
        if (!API_KEY) throw new Error('AI API Key missing');

        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

        const prompt = `
      Analyze this image for civic issues (potholes, garbage, broken lights, accidents, etc.).
      
      Return ONLY a JSON object:
      {
        "is_civic_issue": boolean,
        "issue_type": string (e.g. "pothole", "garbage dump"),
        "severity": "low" | "medium" | "high",
        "description": "Detailed description of what is seen",
        "confidence": number (0-100)
      }
    `;

        const imageParts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType,
                },
            },
        ];

        try {
            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            const text = response.text();
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('AI Image Analysis failed:', error);
            throw new Error('Failed to analyze image');
        }
    }
    /**
     * Chat with the "Nagar Mitra" (City Friend) AI
     */
    /**
     * Chat with UrbanMind (Context-Aware City AI)
     */
    async chatWithUrbanMind(message: string, history: { role: 'user' | 'model'; parts: string }[], context: any): Promise<string> {
        if (!API_KEY) throw new Error('AI API Key missing');

        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemPrompt = `
        You are UrbanMind, the advanced AI operating system for the city of Lucknow.
        
        CURRENT CITY STATUS (Real-time Context):
        - Air Quality (AQI): ${context.aqi || 'Unknown'} (${context.aqiLevel || 'Unknown'})
        - Weather: ${context.weather || 'Unknown'}
        - Active Alerts: ${context.alerts?.length || 0}
        - High Risk Zones: ${context.riskZones?.length || 0}
        
        Recent Critical Incidents:
        ${JSON.stringify(context.incidents || [], null, 2)}

        YOUR CAPABILITIES:
        1. Answer questions about the city's status based on the context above.
        2. Advise on safety/health (e.g., "Should I go for a run?" -> check AQI).
        3. Explain your 3D capabilities ("I am monitoring the city via UrbanVision").
        4. Be helpful, professional, but friendly.
        
        User Query: ${message}
        `;

        // If history is empty, this is the first message, so we just send the system prompt + message
        // If history exists, we need to be careful not to confuse the model. 
        // Best approach for single-turn with context or multi-turn:
        // For this implementation, we will treat it as "stateless" context injection for the latest turn, 
        // or prepend context to the latest user message.

        const chat = model.startChat({
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.parts }],
            })),
        });

        try {
            const result = await chat.sendMessage(systemPrompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('UrbanMind Chat failed:', error);
            return "I'm having trouble connecting to the city grid right now. Please try again.";
        }
    }

    /**
     * Chat with the "Nagar Mitra" (City Friend) AI
     */
    async chatWithCityBot(history: { role: 'user' | 'model'; parts: string }[], message: string): Promise<string> {
        if (!API_KEY) throw new Error('AI API Key missing');

        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const chat = model.startChat({
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.parts }],
            })),
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        try {
            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('AI Chat failed:', error);
            throw new Error('Failed to get chat response');
        }
    }

    /**
     * Analyze report data to generate predictive insights
     */
    async generatePredictiveInsights(reports: any[]): Promise<any[]> {
        if (!API_KEY) throw new Error('AI API Key missing');

        // Summarize reports to avoid hitting token limits
        // We only take the last 50 reports for analysis
        const recentReports = reports.slice(0, 50).map(r => ({
            type: r.type,
            severity: r.priority || 'medium',
            date: r.created_at,
            location_lat: r.location?.lat,
            location_lng: r.location?.lng
        }));

        const prompt = `
      Analyze these recent city incidents and predict 3-5 future risks.
      
      Data: ${JSON.stringify(recentReports)}

      Return ONLY a JSON array of objects with this structure:
      {
        "id": "unique-id",
        "type": "pattern" | "location" | "seasonal",
        "title": "Short Alert Title",
        "description": "Why this is predicted",
        "severity": "low" | "medium" | "high",
        "predictedDate": "ISO date string for when this might peak",
        "action": "Recommended preventive action"
      }
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('AI Prediction failed:', error);
            // Return empty array instead of throwing to allow app to fallback to hardcoded rules
            return [];
        }
    }
}

export const aiService = new AIService();

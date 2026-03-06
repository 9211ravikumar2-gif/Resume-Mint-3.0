import { Express } from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

/**
 * NOTE: The platform guidelines recommend calling Gemini API from the frontend.
 * This backend route is provided as per user request for an API-based improvement.
 */
export function registerAiRoutes(app: Express) {
  app.post("/api/ai-improve", async (req, res) => {
    try {
      const { prompt, type } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "AI Service configuration missing on server" });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Route Error:", error);
      res.status(500).json({ error: "AI Improvement failed on server: " + error.message });
    }
  });
}

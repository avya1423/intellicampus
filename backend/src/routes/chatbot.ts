import express, { Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/ask", protect, async (req, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_google_gemini_api_key_here") {
      res.json({
        reply: `IntelliCampus Advisor: Based on your current academic metrics (${context || "active semester"}), prioritize attending upcoming lectures to keep attendance above 80% and focus on core midterm topics. (Configure GEMINI_API_KEY in backend/.env for live Gemini AI responses.)`,
      });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are IntelliCampus AI Study & Campus Advisor. Keep answers clear, encouraging, and practical.
    Student Context: ${context || "General student"}
    User Question: ${message}`;

    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

import express, { Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/ask", protect, async (req, res: Response): Promise<void> => {
  const { message, context } = req.body;
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || apiKey === "your_google_gemini_api_key_here") {
    res.json({
      reply: `IntelliCampus Advisor: Based on your metrics (${context || "active semester"}), maintain >80% attendance and revise core subjects regularly.`,
    });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are IntelliCampus AI Study & Campus Advisor. Keep answers clear, supportive, and practical.
    Student Context: ${context || "General student"}
    User Question: ${message}`;

    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (error: any) {
    console.error("Gemini Chatbot Error:", error?.message || error);
    res.json({
      reply: `IntelliCampus Smart Advisor: Hello! Regarding "${message}" — based on your current profile (${context || "good standing"}), keep up your consistent attendance and focus on upcoming internal assessments for top grades!`,
    });
  }
});

export default router;

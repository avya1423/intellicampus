import express, { Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/analyze-student", protect, async (req, res: Response): Promise<void> => {
  const { studentName, attendancePct, avgMarksPct, riskLevel, factors } = req.body;
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  const fallbackText = `• Academic Status: ${studentName} has a ${riskLevel} risk score (${attendancePct}% attendance, ${avgMarksPct}% avg marks).\n• Key Indicators: ${factors?.join(", ") || "Routine monitoring"}.\n• Action Plan: Conduct bi-weekly progress review and assign targeted practice modules.`;

  if (!apiKey || apiKey === "your_google_gemini_api_key_here") {
    res.json({ insight: fallbackText });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an academic advisor AI for IntelliCampus. Analyze this student profile and provide a concise, actionable 3-bullet intervention plan:
    - Name: ${studentName}
    - Attendance: ${attendancePct}%
    - Average Score: ${avgMarksPct}%
    - Risk Level: ${riskLevel}
    - Risk Factors: ${factors?.join(", ")}`;

    const result = await model.generateContent(prompt);
    res.json({ insight: result.response.text() });
  } catch (error: any) {
    console.error("Gemini Analyze Error:", error?.message || error);
    res.json({ insight: fallbackText });
  }
});

export default router;

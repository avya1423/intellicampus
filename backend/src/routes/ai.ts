import express, { Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/analyze-student", protect, async (req, res: Response): Promise<void> => {
  try {
    const { studentName, attendancePct, avgMarksPct, riskLevel, factors } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_google_gemini_api_key_here") {
      res.json({
        insight: `[AI Advisory Summary] ${studentName} currently shows a ${riskLevel} risk profile (${attendancePct}% attendance, ${avgMarksPct}% average score). Primary indicators: ${factors?.join(", ")}. Recommended Action: Schedule a 1-on-1 mentoring session and assign a 2-week attendance & revision tracker.`,
      });
      return;
    }

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
    res.status(500).json({ message: error.message });
  }
});

export default router;

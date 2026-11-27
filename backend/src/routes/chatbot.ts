import express, { Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User";
import Attendance from "../models/Attendance";
import Marks from "../models/Marks";
import { protect, AuthRequest } from "../middleware/auth";

const router = express.Router();

const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

async function generateWithFallback(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: any = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text && text.trim()) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} failed:`, err?.message || err);
    }
  }

  throw lastError || new Error("All Gemini models unavailable");
}

router.post("/ask", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const { message, context } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ message: "Message is required" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const userRole = req.user?.role || "student";
  const userId = req.user?.id;

  // =========================================================
  // 1. STUDENT MODE (Read-Only + Strict RBAC Write Protection)
  // =========================================================
  if (userRole === "student") {
    const student = await User.findById(userId).select("-password");
    const attRecords = await Attendance.find({ studentId: userId });
    const markRecords = await Marks.find({ studentId: userId });

    const activeAtt = attRecords.filter((r) => r.status !== "Cancelled");
    const totalHeld = activeAtt.length;
    const totalPresent = activeAtt.filter(
      (r) => r.status === "Present" || r.status === "Late"
    ).length;
    const overallAttPct = totalHeld > 0 ? Math.round((totalPresent / totalHeld) * 100) : 0;

    const classesNeeded =
      totalHeld > 0 && overallAttPct < 75
        ? Math.ceil((0.75 * totalHeld - totalPresent) / 0.25)
        : 0;
    const canSkip =
      totalHeld > 0 && overallAttPct >= 75
        ? Math.max(0, Math.floor(totalPresent / 0.75 - totalHeld))
        : 0;

    // Subject-wise attendance summary
    const subAttMap: Record<string, { held: number; present: number }> = {};
    activeAtt.forEach((r) => {
      if (!subAttMap[r.subject]) subAttMap[r.subject] = { held: 0, present: 0 };
      subAttMap[r.subject].held += 1;
      if (r.status === "Present" || r.status === "Late") {
        subAttMap[r.subject].present += 1;
      }
    });
    const subAttSummary = Object.entries(subAttMap)
      .map(([sub, val]) => {
        const pct = Math.round((val.present / val.held) * 100);
        return `${sub}: ${pct}% (${val.present}/${val.held})`;
      })
      .join("; ");

    // Subject-wise marks summary
    const marksSummary = markRecords
      .map((m) => `${m.subject} (${m.examType}): ${m.score}/${m.maxScore || 100}`)
      .join("; ");

    // RBAC Check before even calling LLM
    const lowerMsg = message.toLowerCase();
    if (
      (lowerMsg.includes("update") ||
        lowerMsg.includes("change") ||
        lowerMsg.includes("edit") ||
        lowerMsg.includes("mark me")) &&
      (lowerMsg.includes("marks") || lowerMsg.includes("attendance") || lowerMsg.includes("present"))
    ) {
      res.json({
        reply:
          "Access Denied (RBAC Security): Students have read-only access and cannot directly modify attendance or marks. Please use 'Request Correction' in your Attendance Log or contact your faculty.",
      });
      return;
    }

    const studentPrompt = `
You are the IntelliCampus AI Academic Advisor speaking directly to a verified STUDENT.

STUDENT PROFILE & LIVE DATABASE RECORDS:
- Name: ${student?.name || "Student"}
- Roll Number: ${student?.rollNumber || "N/A"}
- Enrollment Number: ${student?.enrollmentNumber || "N/A"}
- Program & Branch: ${student?.program || "B.Tech"} - ${student?.department || "N/A"}
- Semester: ${student?.semester || 1}
- College: ${student?.collegeName || "IntelliCampus Institute of Technology"}
- Overall Attendance: ${overallAttPct}% (${totalPresent}/${totalHeld} active lectures)
- Subject-wise Attendance: ${subAttSummary || "No attendance records yet"}
- Exam & Internal Marks: ${marksSummary || "No marks uploaded yet"}
- Additional UI Context: ${context || "None"}

INSTRUCTIONS:
1. Share accurate profile, attendance, and marks insights based on the live data above.
2. Calculate exact classes needed for 75% (${classesNeeded} classes) or safe skip margin (${canSkip} classes).
3. Keep the response concise, motivating, and formatted with clear bullet points.

Student Question: "${message}"
`;

    try {
      if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
      const aiReply = await generateWithFallback(apiKey, studentPrompt);
      res.json({ reply: aiReply });
      return;
    } catch (err: any) {
      // Smart Live Database Fallback when Gemini API quota/rate limit is hit
      const fallbackLines = [
        `Here is your live academic summary, ${student?.name || "Student"}:`,
        `• Profile: ${student?.department} (Semester ${student?.semester || 1}) | Roll: ${
          student?.rollNumber || "N/A"
        }`,
        `• Overall Attendance: ${overallAttPct}% (${totalPresent}/${totalHeld} lectures) — ${
          totalHeld === 0
            ? "No classes logged yet."
            : overallAttPct < 75
            ? `Attend the next ${classesNeeded} consecutive class(es) to reach 75%.`
            : `Safe zone! You can miss up to ${canSkip} upcoming class(es).`
        }`,
        subAttSummary ? `• Subject Breakdown: ${subAttSummary}` : null,
        marksSummary ? `• Recorded Marks: ${marksSummary}` : "• Recorded Marks: None uploaded yet.",
      ].filter(Boolean);

      res.json({ reply: fallbackLines.join("\n") });
      return;
    }
  }

  // =========================================================
  // 2. TEACHER / ADMIN MODE (Full Class Analytics & Risk List)
  // =========================================================
  const allStudents = await User.find({ role: "student" }).select("-password");
  const allAttendance = await Attendance.find({});
  const allMarks = await Marks.find({});

  const atRiskList: string[] = [];
  const studentAnalytics = allStudents.map((stu) => {
    const stuAtt = allAttendance.filter(
      (a) => a.studentId.toString() === stu._id.toString() && a.status !== "Cancelled"
    );
    const held = stuAtt.length;
    const present = stuAtt.filter((a) => a.status === "Present" || a.status === "Late").length;
    const attPct = held > 0 ? Math.round((present / held) * 100) : 0;

    const stuMarks = allMarks.filter((m) => m.studentId.toString() === stu._id.toString());
    const avgMarks =
      stuMarks.length > 0
        ? Math.round(
            stuMarks.reduce((acc, m) => acc + (m.score / (m.maxScore || 100)) * 100, 0) /
              stuMarks.length
          )
        : 0;

    const isAtRisk = (held > 0 && attPct < 75) || (stuMarks.length > 0 && avgMarks < 50);
    const line = `${stu.name} (Roll: ${stu.rollNumber || "N/A"}, ${stu.department} Sem ${
      stu.semester || 1
    }) — Attendance: ${held > 0 ? attPct + "%" : "N/A"}, Avg Marks: ${
      stuMarks.length > 0 ? avgMarks + "%" : "N/A"
    }`;

    if (isAtRisk) atRiskList.push(line);
    return `${line} [${isAtRisk ? "AT RISK" : "Safe"}]`;
  });

  const teacherPrompt = `
You are the IntelliCampus AI Teaching & Administrative Assistant speaking to a verified ${userRole.toUpperCase()}.

LIVE CAMPUS STUDENT DATABASE ANALYTICS (${allStudents.length} Students):
${studentAnalytics.length > 0 ? studentAnalytics.join("\n") : "No students enrolled yet."}

Additional Context: ${context || "None"}

INSTRUCTIONS:
1. List exact Student Names, Roll Numbers, Branch/Semester, Attendance %, and Average Marks when asked about class performance or at-risk students.
2. Provide concise, actionable academic mentoring recommendations using bullet points.

Faculty/Admin Query: "${message}"
`;

  try {
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
    const aiReply = await generateWithFallback(apiKey, teacherPrompt);
    res.json({ reply: aiReply });
  } catch (err: any) {
    // Smart Live Database Fallback for Teacher/Admin when Gemini API limit is reached
    const fallbackReport =
      atRiskList.length > 0
        ? `Live Class Risk Analysis (${atRiskList.length} At-Risk Student(s) out of ${
            allStudents.length
          }):\n${atRiskList.map((item) => `• ${item}`).join("\n")}`
        : `Live Class Summary: All ${allStudents.length} enrolled students are currently in safe academic standing (≥75% attendance and ≥50% marks).`;

    res.json({ reply: fallbackReport });
  }
});

export default router;

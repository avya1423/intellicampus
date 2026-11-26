import express, { Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User";
import Attendance from "../models/Attendance";
import Marks from "../models/Marks";
import { protect, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.post("/ask", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ message: "Message is required" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json({
        reply:
          "GEMINI_API_KEY is not configured on the backend server yet. Please add it in Render Environment Variables.",
      });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const userRole = req.user?.role || "student";
    const userId = req.user?.id;

    // =========================================================
    // 1. STUDENT MODE (Read-Only + Strict RBAC Write Protection)
    // =========================================================
    if (userRole === "student") {
      const student = await User.findById(userId).select("-password");
      const attRecords = await Attendance.find({ studentId: userId });
      const markRecords = await Marks.find({ studentId: userId });

      const totalHeld = attRecords.length;
      const totalPresent = attRecords.filter(
        (r) => r.status === "Present" || r.status === "Late"
      ).length;
      const overallAttPct =
        totalHeld > 0 ? Math.round((totalPresent / totalHeld) * 100) : 0;

      // Subject-wise attendance summary
      const subAttMap: Record<string, { held: number; present: number }> = {};
      attRecords.forEach((r) => {
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

      const studentPrompt = `
You are the IntelliCampus AI Academic Advisor speaking directly to a verified STUDENT.

STUDENT PROFILE & LIVE DATABASE RECORDS:
- Name: ${student?.name || "Student"}
- Roll Number: ${student?.rollNumber || "N/A"}
- Enrollment Number: ${student?.enrollmentNumber || "N/A"}
- Program & Branch: ${student?.program || "B.Tech"} - ${student?.department || "N/A"}
- Semester: ${student?.semester || 1}
- College: ${student?.collegeName || "IntelliCampus Institute of Technology"}
- Overall Attendance: ${overallAttPct}% (${totalPresent}/${totalHeld} lectures)
- Subject-wise Attendance: ${subAttSummary || "No attendance records yet"}
- Exam & Internal Marks: ${marksSummary || "No marks uploaded yet"}
- Additional UI Context: ${context || "None"}

STRICT SECURITY & RESPONSE RULES:
1. ROLE-BASED ACCESS CONTROL (RBAC): If the student asks to modify, update, insert, or delete marks, attendance, or database records (e.g., "update my marks", "mark me present"), politely refuse and explain that students have read-only access and must submit an Attendance Correction Request or contact faculty.
2. PROFILE QUERIES: If asked for profile/details, share their Name, Enrollment Number, Roll Number, Branch, Semester, and College clearly.
3. ATTENDANCE & 75% TARGET: Calculate exact consecutive classes needed if attendance is below 75% using ceil((0.75 * held - present) / 0.25), or how many classes they can safely miss if above 75%.
4. GRADE PREDICTION: If asked to predict final performance, estimate realistically from their current attendance and internal marks without showing raw mathematical formulas.
5. Keep answers concise, encouraging, and well-structured with bullet points (no markdown tables).

Student Question: "${message}"
`;

      const result = await model.generateContent(studentPrompt);
      res.json({ reply: result.response.text() });
      return;
    }

    // =========================================================
    // 2. TEACHER / ADMIN MODE (Full Class Analytics & Risk List)
    // =========================================================
    const allStudents = await User.find({ role: "student" }).select("-password");
    const allAttendance = await Attendance.find({});
    const allMarks = await Marks.find({});

    const studentAnalytics = allStudents.map((stu) => {
      const stuAtt = allAttendance.filter(
        (a) => a.studentId.toString() === stu._id.toString()
      );
      const held = stuAtt.length;
      const present = stuAtt.filter(
        (a) => a.status === "Present" || a.status === "Late"
      ).length;
      const attPct = held > 0 ? Math.round((present / held) * 100) : 0;

      const stuMarks = allMarks.filter(
        (m) => m.studentId.toString() === stu._id.toString()
      );
      const avgMarks =
        stuMarks.length > 0
          ? Math.round(
              stuMarks.reduce(
                (acc, m) => acc + (m.score / (m.maxScore || 100)) * 100,
                0
              ) / stuMarks.length
            )
          : 0;

      const isAtRisk = (held > 0 && attPct < 75) || (stuMarks.length > 0 && avgMarks < 50);

      return `${stu.name} (Roll: ${stu.rollNumber || "N/A"}, Branch: ${stu.department}, Sem: ${
        stu.semester || 1
      }) -> Attendance: ${held > 0 ? attPct + "%" : "No classes"}, Avg Marks: ${
        stuMarks.length > 0 ? avgMarks + "%" : "No marks"
      }, Status: ${isAtRisk ? "AT RISK" : "Safe"}`;
    });

    const teacherPrompt = `
You are the IntelliCampus AI Teaching & Administrative Assistant speaking to a verified ${userRole.toUpperCase()}.

LIVE CAMPUS STUDENT DATABASE ANALYTICS (${allStudents.length} Students):
${studentAnalytics.length > 0 ? studentAnalytics.join("\n") : "No students enrolled yet."}

Additional Context: ${context || "None"}

INSTRUCTIONS:
1. You have full authorized access to the class records listed above. Never say you lack access to individual student data.
2. When asked for at-risk students, failing students, or students below 75% attendance, list their exact Names, Roll Numbers, Branch/Semester, Attendance %, and Average Marks using clear bullet points.
3. Provide actionable academic intervention advice where helpful. Keep the response direct and well-organized.

Faculty/Admin Query: "${message}"
`;

    const result = await model.generateContent(teacherPrompt);
    res.json({ reply: result.response.text() });
  } catch (error: any) {
    console.error("Chatbot error:", error);
    res.status(500).json({ message: error.message || "AI service error" });
  }
});

export default router;

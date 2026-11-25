import express, { Response } from "express";
import User from "../models/User";
import Attendance from "../models/Attendance";
import Marks from "../models/Marks";
import HistoricalPerformance from "../models/HistoricalPerformance";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";
import { calculateAttendancePercentage } from "../utils/calcAttendance";
import { evaluateStudentRisk } from "../utils/riskEngine";
import { summarizeClassPerformance } from "../utils/analytics";

const router = express.Router();

router.get("/my", protect, async (req: AuthRequest, res: Response) => {
  try {
    const attendance = await Attendance.find({ studentId: req.user?.id });
    const marks = await Marks.find({ studentId: req.user?.id });
    const history = await HistoricalPerformance.find({ studentId: req.user?.id }).sort({ semester: -1 });

    const attendancePct = calculateAttendancePercentage(attendance);
    const avgMarksPct =
      marks.length > 0
        ? Number((marks.reduce((acc, m) => acc + (m.score / m.maxScore) * 100, 0) / marks.length).toFixed(2))
        : 75;
    const latestGpa = history.length > 0 ? history[0].gpa : 7.5;

    const evaluation = evaluateStudentRisk(attendancePct, avgMarksPct, latestGpa);
    res.json({ attendancePct, avgMarksPct, latestGpa, ...evaluation });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/all", protect, authorizeRoles("teacher", "admin"), async (_req, res: Response) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    const results = await Promise.all(
      students.map(async (student) => {
        const attendance = await Attendance.find({ studentId: student._id });
        const marks = await Marks.find({ studentId: student._id });
        const history = await HistoricalPerformance.find({ studentId: student._id }).sort({ semester: -1 });

        const attendancePct = calculateAttendancePercentage(attendance);
        const avgMarksPct =
          marks.length > 0
            ? Number((marks.reduce((acc, m) => acc + (m.score / m.maxScore) * 100, 0) / marks.length).toFixed(2))
            : 75;
        const latestGpa = history.length > 0 ? history[0].gpa : 7.5;

        const evaluation = evaluateStudentRisk(attendancePct, avgMarksPct, latestGpa);
        return {
          student,
          attendancePct,
          avgMarksPct,
          latestGpa,
          ...evaluation,
        };
      })
    );

    const summary = summarizeClassPerformance(results);
    res.json({ summary, students: results });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

import express, { Response } from "express";
import Attendance from "../models/Attendance";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";
import { calculateAttendancePercentage } from "../utils/calcAttendance";

const router = express.Router();

router.post("/mark", protect, authorizeRoles("teacher", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, subject, status, date } = req.body;
    const record = await Attendance.create({
      studentId,
      subject,
      status,
      date: date || new Date(),
      markedBy: req.user?.id,
    });
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my", protect, async (req: AuthRequest, res: Response) => {
  try {
    const records = await Attendance.find({ studentId: req.user?.id }).sort({ date: -1 });
    const percentage = calculateAttendancePercentage(records);
    res.json({ percentage, totalClasses: records.length, records });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/student/:id", protect, authorizeRoles("teacher", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const records = await Attendance.find({ studentId: req.params.id }).sort({ date: -1 });
    const percentage = calculateAttendancePercentage(records);
    res.json({ percentage, totalClasses: records.length, records });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

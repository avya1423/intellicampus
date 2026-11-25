import express, { Response } from "express";
import Attendance from "../models/Attendance";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Student views own attendance
router.get("/my", protect, authorizeRoles("student"), async (req: AuthRequest, res: Response) => {
  try {
    const records = await Attendance.find({ studentId: req.user?.id }).sort({ date: -1 });
    const totalClasses = records.length;
    const presentCount = records.filter((r) => r.status === "Present" || r.status === "Late").length;
    const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    res.json({ percentage, totalClasses, records });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher/Admin views full attendance register
router.get("/all", protect, authorizeRoles("teacher", "admin"), async (_req, res: Response) => {
  try {
    const records = await Attendance.find()
      .populate("studentId", "name rollNumber department semester")
      .sort({ date: -1 })
      .limit(200);
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Mark or update attendance for a specific date (prevents duplicates on same date+subject)
router.post("/mark", protect, authorizeRoles("teacher", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, subject, status, date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      studentId,
      subject,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      existing.status = status;
      await existing.save();
      res.json(existing);
      return;
    }

    const record = await Attendance.create({
      studentId,
      subject,
      status,
      date: targetDate,
      markedBy: req.user?.id,
    });
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

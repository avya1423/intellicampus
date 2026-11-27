import express, { Response } from "express";
import Attendance from "../models/Attendance";
import User from "../models/User";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Student views own attendance (Cancelled classes do not penalize percentage)
router.get("/my", protect, authorizeRoles("student"), async (req: AuthRequest, res: Response) => {
  try {
    const records = await Attendance.find({ studentId: req.user?.id }).sort({ date: -1 });
    const activeRecords = records.filter((r) => r.status !== "Cancelled");
    const totalClasses = activeRecords.length;
    const presentCount = activeRecords.filter(
      (r) => r.status === "Present" || r.status === "Late"
    ).length;
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
      .limit(250);
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher fetches attendance records for a specific date (used for "Copy Previous Period")
router.get(
  "/by-date",
  protect,
  authorizeRoles("teacher", "admin"),
  async (req, res: Response): Promise<void> => {
    try {
      const dateStr = String(req.query.date || new Date().toISOString().split("T")[0]);
      const targetDate = new Date(dateStr + "T00:00:00");
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const records = await Attendance.find({
        date: { $gte: startOfDay, $lte: endOfDay },
      }).sort({ createdAt: -1 });

      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Mark or update attendance for a specific date & period
router.post(
  "/mark",
  protect,
  authorizeRoles("teacher", "admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { studentId, subject, status, date, timeSlot } = req.body;
      const targetDate = date ? new Date(date) : new Date();

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const query: any = {
        studentId,
        subject,
        date: { $gte: startOfDay, $lte: endOfDay },
      };
      if (timeSlot) {
        query.timeSlot = timeSlot;
      }

      const existing = await Attendance.findOne(query);

      if (existing) {
        existing.status = status;
        existing.cancelReason = undefined;
        await existing.save();
        res.json(existing);
        return;
      }

      const record = await Attendance.create({
        studentId,
        subject,
        timeSlot,
        status,
        date: targetDate,
        markedBy: req.user?.id,
      });
      res.status(201).json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Teacher marks a scheduled class as Cancelled for the whole class
router.post(
  "/cancel-class",
  protect,
  authorizeRoles("teacher", "admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { department, semester, subject, timeSlot, date, reason } = req.body;
      if (!department || !semester || !subject) {
        res.status(400).json({ message: "Department, semester, and subject are required." });
        return;
      }

      const classStudents = await User.find({
        role: "student",
        department,
        semester: Number(semester),
        isApproved: { $ne: false },
      });

      if (classStudents.length === 0) {
        res.status(404).json({ message: "No students found in this class." });
        return;
      }

      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      for (const stu of classStudents) {
        const query: any = {
          studentId: stu._id,
          subject,
          date: { $gte: startOfDay, $lte: endOfDay },
        };
        if (timeSlot) query.timeSlot = timeSlot;

        const existing = await Attendance.findOne(query);
        if (existing) {
          existing.status = "Cancelled";
          existing.cancelReason = reason || "Class Cancelled by Faculty";
          await existing.save();
        } else {
          await Attendance.create({
            studentId: stu._id,
            subject,
            timeSlot,
            status: "Cancelled",
            cancelReason: reason || "Class Cancelled by Faculty",
            date: targetDate,
            markedBy: req.user?.id,
          });
        }
      }

      res.json({
        message: `Marked ${subject} (${timeSlot || "Lecture"}) as Cancelled for ${
          classStudents.length
        } student(s).`,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

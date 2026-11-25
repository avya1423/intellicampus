import express, { Response } from "express";
import AttendanceCorrection from "../models/AttendanceCorrection";
import Attendance from "../models/Attendance";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Student submits attendance correction request
router.post("/", protect, authorizeRoles("student"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { attendanceId, reason } = req.body;
    const record = await Attendance.findById(attendanceId);
    if (!record) {
      res.status(404).json({ message: "Attendance record not found" });
      return;
    }

    const existing = await AttendanceCorrection.findOne({ attendanceId, status: "Pending" });
    if (existing) {
      res.status(400).json({ message: "A pending correction request already exists for this class." });
      return;
    }

    const correction = await AttendanceCorrection.create({
      attendanceId: record._id,
      studentId: req.user?.id,
      teacherId: (record as any).markedBy,
      subject: record.subject,
      date: record.date,
      currentStatus: record.status,
      requestedStatus: "Present",
      reason,
    });

    res.status(201).json(correction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Student views their own correction requests
router.get("/my", protect, authorizeRoles("student"), async (req: AuthRequest, res: Response) => {
  try {
    const list = await AttendanceCorrection.find({ studentId: req.user?.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher / Admin views student correction requests
router.get("/teacher", protect, authorizeRoles("teacher", "admin"), async (_req, res: Response) => {
  try {
    const list = await AttendanceCorrection.find()
      .populate("studentId", "name email rollNumber department semester")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher approves or rejects request (Auto-updates Attendance on Approve)
router.patch("/:id", protect, authorizeRoles("teacher", "admin"), async (req, res: Response) => {
  try {
    const { status } = req.body; // "Approved" | "Rejected"
    const correction = await AttendanceCorrection.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (correction && status === "Approved") {
      await Attendance.findByIdAndUpdate(correction.attendanceId, {
        status: correction.requestedStatus || "Present",
      });
    }

    res.json(correction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

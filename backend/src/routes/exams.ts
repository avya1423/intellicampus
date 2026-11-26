import express, { Response } from "express";
import ExamSchedule from "../models/ExamSchedule";
import AdmitCondonation from "../models/AdmitCondonation";
import Attendance from "../models/Attendance";
import User from "../models/User";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Get Exam Schedule (optional department & semester filter)
router.get("/schedule", protect, async (req, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.semester) filter.semester = Number(req.query.semester);

    const list = await ExamSchedule.find(filter).sort({ examDate: 1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin adds an Exam Paper to the Hall Ticket Timetable
router.post("/schedule", protect, authorizeRoles("admin"), async (req, res: Response) => {
  try {
    const created = await ExamSchedule.create(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin deletes an Exam Paper
router.delete("/schedule/:id", protect, authorizeRoles("admin"), async (req, res: Response) => {
  try {
    await ExamSchedule.findByIdAndDelete(req.params.id);
    res.json({ message: "Exam schedule removed" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Student fetches personalized 75%-Gated Exam Admit Card / Hall Ticket
router.get(
  "/admit-card/my",
  protect,
  authorizeRoles("student"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const student = await User.findById(req.user?.id).select("-password");
      if (!student) {
        res.status(404).json({ message: "Student not found" });
        return;
      }

      const attRecords = await Attendance.find({ studentId: student._id });
      const totalHeld = attRecords.length;
      const totalPresent = attRecords.filter(
        (r) => r.status === "Present" || r.status === "Late"
      ).length;
      const overallAttPct = totalHeld > 0 ? Math.round((totalPresent / totalHeld) * 100) : 100;

      const condonation = await AdmitCondonation.findOne({ studentId: student._id });
      const isEligible = overallAttPct >= 75 || Boolean(condonation);

      const schedule = await ExamSchedule.find({
        department: student.department,
        semester: student.semester || 1,
      }).sort({ examDate: 1 });

      res.json({
        student,
        totalHeld,
        totalPresent,
        overallAttPct,
        isEligible,
        condonation,
        schedule,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Admin / Teacher views granted 75% attendance condonations
router.get("/condonations", protect, authorizeRoles("admin", "teacher"), async (_req, res: Response) => {
  try {
    const list = await AdmitCondonation.find()
      .populate("studentId", "name email rollNumber department semester")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin grants 75% attendance condonation to unlock a student's Admit Card
router.post(
  "/condonations",
  protect,
  authorizeRoles("admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { studentId, reason } = req.body;
      const adminUser = await User.findById(req.user?.id);
      const doc = await AdmitCondonation.findOneAndUpdate(
        { studentId },
        {
          studentId,
          reason: reason || "Medical / Special Dean Condonation Approved",
          grantedBy: adminUser?.name || "Campus Admin",
        },
        { upsert: true, new: true }
      );
      res.status(201).json(doc);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Admin revokes condonation
router.delete(
  "/condonations/:studentId",
  protect,
  authorizeRoles("admin"),
  async (req, res: Response) => {
    try {
      await AdmitCondonation.findOneAndDelete({ studentId: req.params.studentId });
      res.json({ message: "Condonation revoked" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

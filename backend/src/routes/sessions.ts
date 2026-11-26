import express, { Response } from "express";
import AttendanceSession from "../models/AttendanceSession";
import Attendance from "../models/Attendance";
import User from "../models/User";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Teacher starts a Live QR/OTP Attendance Session
router.post(
  "/start",
  protect,
  authorizeRoles("teacher", "admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { department, semester, subject, timeSlot, durationMinutes } = req.body;
      if (!department || !semester || !subject) {
        res.status(400).json({ message: "Department, semester, and subject are required." });
        return;
      }

      const teacher = await User.findById(req.user?.id);
      const mins = Math.min(60, Math.max(1, Number(durationMinutes || 5)));
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(Date.now() + mins * 60 * 1000);

      // Deactivate any previous active sessions by this teacher
      await AttendanceSession.updateMany(
        { teacherId: req.user?.id, isActive: true },
        { $set: { isActive: false } }
      );

      const session = await AttendanceSession.create({
        code,
        department,
        semester: Number(semester),
        subject: subject.trim(),
        timeSlot: timeSlot || "Live Lecture",
        teacherId: req.user?.id,
        teacherName: teacher?.name || "Faculty",
        expiresAt,
        isActive: true,
        attendees: [],
      });

      res.status(201).json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get Active Sessions (Filtered for Student's Branch/Sem; Recent/Active for Teacher)
router.get("/active", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    if (req.user?.role === "student") {
      const student = await User.findById(req.user.id);
      if (!student) {
        res.json([]);
        return;
      }
      const sessions = await AttendanceSession.find({
        department: student.department,
        semester: student.semester || 1,
        isActive: true,
        expiresAt: { $gt: now },
      }).sort({ createdAt: -1 });
      res.json(sessions);
      return;
    }

    const sessions = await AttendanceSession.find({
      teacherId: req.user?.id,
    })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Student checks in using the 4-digit Live OTP
router.post(
  "/checkin",
  protect,
  authorizeRoles("student"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { code } = req.body;
      if (!code || !String(code).trim()) {
        res.status(400).json({ message: "Please enter the 4-digit classroom code." });
        return;
      }

      const student = await User.findById(req.user?.id);
      if (!student) {
        res.status(404).json({ message: "Student account not found." });
        return;
      }

      const now = new Date();
      const session = await AttendanceSession.findOne({
        code: String(code).trim(),
        isActive: true,
        expiresAt: { $gt: now },
      });

      if (!session) {
        res.status(400).json({ message: "Invalid or expired classroom attendance code." });
        return;
      }

      if (
        session.department !== student.department ||
        Number(session.semester) !== Number(student.semester || 1)
      ) {
        res.status(403).json({
          message: `This session is for ${session.department} Semester ${session.semester}, not your class.`,
        });
        return;
      }

      const alreadyCheckedIn = session.attendees.some(
        (a) => a.studentId.toString() === student._id.toString()
      );
      if (alreadyCheckedIn) {
        res.status(400).json({ message: "Your attendance is already marked for this session!" });
        return;
      }

      // Record Present in main Attendance collection (prevent duplicate for today + subject)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const existingAtt = await Attendance.findOne({
        studentId: student._id,
        subject: session.subject,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      if (existingAtt) {
        existingAtt.status = "Present";
        await existingAtt.save();
      } else {
        await Attendance.create({
          studentId: student._id,
          subject: session.subject,
          timeSlot: session.timeSlot,
          status: "Present",
          date: new Date(),
          markedBy: session.teacherId,
        });
      }

      session.attendees.push({
        studentId: student._id as any,
        studentName: student.name,
        rollNumber: student.rollNumber,
        checkedInAt: new Date(),
      });
      await session.save();

      res.json({
        message: `Present marked for ${session.subject} (${session.teacherName})!`,
        subject: session.subject,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Teacher closes session & optionally auto-marks remaining students Absent
router.post(
  "/:id/close",
  protect,
  authorizeRoles("teacher", "admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { markRemainingAbsent } = req.body;
      const session = await AttendanceSession.findById(req.params.id);
      if (!session) {
        res.status(404).json({ message: "Session not found." });
        return;
      }

      session.isActive = false;
      await session.save();

      let absentCount = 0;
      if (markRemainingAbsent) {
        const classStudents = await User.find({
          role: "student",
          department: session.department,
          semester: session.semester,
          isApproved: { $ne: false },
        });

        const presentIds = new Set(session.attendees.map((a) => a.studentId.toString()));
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        for (const stu of classStudents) {
          if (!presentIds.has(stu._id.toString())) {
            const existing = await Attendance.findOne({
              studentId: stu._id,
              subject: session.subject,
              date: { $gte: startOfDay, $lte: endOfDay },
            });
            if (!existing) {
              await Attendance.create({
                studentId: stu._id,
                subject: session.subject,
                timeSlot: session.timeSlot,
                status: "Absent",
                date: new Date(),
                markedBy: session.teacherId,
              });
              absentCount += 1;
            }
          }
        }
      }

      res.json({
        message: markRemainingAbsent
          ? `Session closed. ${session.attendees.length} Present, ${absentCount} remaining students marked Absent.`
          : `Live attendance session closed (${session.attendees.length} Present).`,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

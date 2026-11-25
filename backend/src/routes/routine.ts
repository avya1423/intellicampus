import express, { Response } from "express";
import Routine from "../models/Routine";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Get routine
router.get("/", protect, async (req, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.semester) filter.semester = Number(req.query.semester);
    if (req.query.dayOfWeek) filter.dayOfWeek = req.query.dayOfWeek;

    const slots = await Routine.find(filter).sort({ createdAt: 1 });
    res.json(slots);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Save or replace full week's Master Timetable for a Branch + Semester in one go
router.post("/bulk", protect, authorizeRoles("teacher", "admin"), async (req, res: Response) => {
  try {
    const { department, semester, slots } = req.body;
    await Routine.deleteMany({ department, semester: Number(semester) });

    const validSlots = (slots || [])
      .filter((s: any) => s.subject && s.subject.trim())
      .map((s: any) => ({
        department,
        semester: Number(semester),
        dayOfWeek: s.dayOfWeek,
        subject: s.subject.trim(),
        timeSlot: s.timeSlot || "Period 1 (09:00 - 10:00)",
        teacherName: s.teacherName,
      }));

    const inserted = validSlots.length > 0 ? await Routine.insertMany(validSlots) : [];
    res.status(201).json(inserted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Single slot add
router.post("/", protect, authorizeRoles("teacher", "admin"), async (req, res: Response) => {
  try {
    const slot = await Routine.create(req.body);
    res.status(201).json(slot);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete single slot
router.delete("/:id", protect, authorizeRoles("teacher", "admin"), async (req, res: Response) => {
  try {
    await Routine.findByIdAndDelete(req.params.id);
    res.json({ message: "Routine slot removed" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

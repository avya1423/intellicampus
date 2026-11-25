import express, { Response } from "express";
import Routine from "../models/Routine";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Get routine (optional filters: department, semester, dayOfWeek)
router.get("/", protect, async (req, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.semester) filter.semester = Number(req.query.semester);
    if (req.query.dayOfWeek) filter.dayOfWeek = req.query.dayOfWeek;

    const slots = await Routine.find(filter).sort({ timeSlot: 1 });
    res.json(slots);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher or Admin adds a routine/subject slot
router.post("/", protect, authorizeRoles("teacher", "admin"), async (req, res: Response) => {
  try {
    const slot = await Routine.create(req.body);
    res.status(201).json(slot);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

import express, { Response } from "express";
import AcademicEvent from "../models/AcademicEvent";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Get all holidays & events
router.get("/", protect, async (_req, res: Response) => {
  try {
    const events = await AcademicEvent.find().sort({ date: 1 });
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher or Admin adds a holiday/exam/event
router.post("/", protect, authorizeRoles("teacher", "admin"), async (req, res: Response) => {
  try {
    const event = await AcademicEvent.create(req.body);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

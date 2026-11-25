import express, { Response } from "express";
import AcademicEvent from "../models/AcademicEvent";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Get all holidays & events (Students, Teachers, Admins)
router.get("/", protect, async (_req, res: Response) => {
  try {
    const events = await AcademicEvent.find().sort({ date: 1 });
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Only Admin adds a holiday/exam/event
router.post("/", protect, authorizeRoles("admin"), async (req, res: Response) => {
  try {
    const event = await AcademicEvent.create(req.body);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Only Admin deletes a calendar entry
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res: Response) => {
  try {
    await AcademicEvent.findByIdAndDelete(req.params.id);
    res.json({ message: "Calendar event removed" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

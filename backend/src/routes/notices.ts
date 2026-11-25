import express, { Response } from "express";
import Notice from "../models/Notice";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Get notices (optional filter by department & semester)
router.get("/", protect, async (req, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.semester) filter.semester = Number(req.query.semester);

    const notices = await Notice.find(filter).sort({ createdAt: -1 }).limit(30);
    res.json(notices);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher or Admin posts a class notice / study material link
router.post("/", protect, authorizeRoles("teacher", "admin"), async (req, res: Response) => {
  try {
    const notice = await Notice.create(req.body);
    res.status(201).json(notice);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher or Admin deletes a notice
router.delete("/:id", protect, authorizeRoles("teacher", "admin"), async (req, res: Response) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: "Notice deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

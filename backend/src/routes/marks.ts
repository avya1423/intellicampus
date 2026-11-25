import express, { Response } from "express";
import Marks from "../models/Marks";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

router.post("/add", protect, authorizeRoles("teacher", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, subject, examType, score, maxScore } = req.body;
    const mark = await Marks.create({ studentId, subject, examType, score, maxScore: maxScore || 100 });
    res.status(201).json(mark);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my", protect, async (req: AuthRequest, res: Response) => {
  try {
    const records = await Marks.find({ studentId: req.user?.id });
    const avgPct =
      records.length > 0
        ? Number(
            (
              records.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / records.length
            ).toFixed(2)
          )
        : 0;
    res.json({ averagePercentage: avgPct, records });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

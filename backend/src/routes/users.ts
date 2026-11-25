import express, { Response } from "express";
import User from "../models/User";
import ProfileRequest from "../models/ProfileRequest";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

router.get("/students", protect, authorizeRoles("teacher", "admin"), async (_req, res: Response) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/profile-request", protect, authorizeRoles("student"), async (req: AuthRequest, res: Response) => {
  try {
    const request = await ProfileRequest.create({
      studentId: req.user?.id,
      requestedChanges: req.body.requestedChanges,
      reason: req.body.reason,
    });
    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

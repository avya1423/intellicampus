import express, { Response } from "express";
import User from "../models/User";
import ProfileRequest from "../models/ProfileRequest";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

router.get("/stats", protect, authorizeRoles("admin"), async (_req, res: Response) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const pendingRequests = await ProfileRequest.countDocuments({ status: "Pending" });
    res.json({ totalStudents, totalTeachers, pendingRequests });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users", protect, authorizeRoles("admin"), async (_req, res: Response) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/profile-requests", protect, authorizeRoles("admin"), async (_req, res: Response) => {
  try {
    const requests = await ProfileRequest.find().populate("studentId", "name email rollNumber");
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/profile-requests/:id", protect, authorizeRoles("admin"), async (req, res: Response) => {
  try {
    const { status } = req.body;
    const request = await ProfileRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (request && status === "Approved") {
      await User.findByIdAndUpdate(request.studentId, request.requestedChanges);
    }
    res.json(request);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

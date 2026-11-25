import express, { Response } from "express";
import User from "../models/User";
import ProfileRequest from "../models/ProfileRequest";
import { protect } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Campus Stats
router.get("/stats", protect, authorizeRoles("admin"), async (_req, res: Response) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student", isApproved: { $ne: false } });
    const totalTeachers = await User.countDocuments({ role: "teacher", isApproved: { $ne: false } });
    const pendingRequests = await ProfileRequest.countDocuments({ status: "Pending" });
    const pendingUsers = await User.countDocuments({
      $or: [{ isApproved: false }, { approvalStatus: "Pending" }],
    });
    res.json({ totalStudents, totalTeachers, pendingRequests, pendingUsers });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Users
router.get("/users", protect, authorizeRoles("admin"), async (_req, res: Response) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Approve or Reject New User Registration
router.patch("/users/:id/approval", protect, authorizeRoles("admin"), async (req, res: Response) => {
  try {
    const { status } = req.body; // "Approved" | "Rejected"
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: status === "Approved",
        approvalStatus: status,
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get Profile Change Requests
router.get("/profile-requests", protect, authorizeRoles("admin"), async (_req, res: Response) => {
  try {
    const requests = await ProfileRequest.find()
      .populate("studentId", "name email rollNumber")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Approve or Reject Profile Change Request
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

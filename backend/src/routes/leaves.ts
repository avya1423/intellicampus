import express, { Response } from "express";
import LeaveRequest from "../models/LeaveRequest";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Student applies for Medical / Duty Leave
router.post("/", protect, authorizeRoles("student"), async (req: AuthRequest, res: Response) => {
  try {
    const { leaveType, fromDate, toDate, reason, documentLink } = req.body;
    const leave = await LeaveRequest.create({
      studentId: req.user?.id,
      leaveType,
      fromDate,
      toDate,
      reason,
      documentLink,
    });
    res.status(201).json(leave);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Student views their own leave history
router.get("/my", protect, authorizeRoles("student"), async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await LeaveRequest.find({ studentId: req.user?.id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher / Admin views all student leave requests
router.get("/all", protect, authorizeRoles("teacher", "admin"), async (_req, res: Response) => {
  try {
    const leaves = await LeaveRequest.find()
      .populate("studentId", "name email rollNumber department semester")
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher / Admin approves or rejects leave
router.patch("/:id", protect, authorizeRoles("teacher", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { status, reviewedBy } = req.body;
    const updated = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: reviewedBy || "Faculty" },
      { new: true }
    );
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

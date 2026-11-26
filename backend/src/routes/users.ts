import express, { Response } from "express";
import User from "../models/User";
import ProfileRequest from "../models/ProfileRequest";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Get current logged-in user full profile
router.get("/profile", protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile (Student & Faculty fields)
router.patch("/profile", protect, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      department,
      semester,
      rollNumber,
      enrollmentNumber,
      program,
      batch,
      section,
      collegeName,
      phone,
      guardianName,
      guardianPhone,
      bloodGroup,
      address,
      employeeId,
      designation,
      qualification,
      specialization,
      experienceYears,
      cabinLocation,
      officeHours,
    } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user?.id,
      {
        name,
        department,
        semester,
        rollNumber,
        enrollmentNumber,
        program,
        batch,
        section,
        collegeName,
        phone,
        guardianName,
        guardianPhone,
        bloodGroup,
        address,
        employeeId,
        designation,
        qualification,
        specialization,
        experienceYears,
        cabinLocation,
        officeHours,
      },
      { new: true }
    ).select("-password");

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get all students (for Teacher & Admin)
router.get("/students", protect, authorizeRoles("teacher", "admin"), async (_req, res: Response) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Student or Faculty submits an official profile change request to Admin
router.post(
  "/profile-request",
  protect,
  authorizeRoles("student", "teacher"),
  async (req: AuthRequest, res: Response) => {
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
  }
);

// Student or Faculty views their submitted profile requests
router.get(
  "/my-requests",
  protect,
  authorizeRoles("student", "teacher"),
  async (req: AuthRequest, res: Response) => {
    try {
      const requests = await ProfileRequest.find({ studentId: req.user?.id }).sort({ createdAt: -1 });
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

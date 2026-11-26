import express, { Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import ProfileRequest from "../models/ProfileRequest";
import Attendance from "../models/Attendance";
import Marks from "../models/Marks";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Campus Stats
router.get("/stats", protect, authorizeRoles("admin"), async (_req, res: Response) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student", isApproved: { $ne: false } });
    const totalTeachers = await User.countDocuments({ role: "teacher", isApproved: { $ne: false } });
    const totalAdmins = await User.countDocuments({ role: "admin", isApproved: { $ne: false } });
    const pendingRequests = await ProfileRequest.countDocuments({ status: "Pending" });
    const pendingUsers = await User.countDocuments({
      $or: [{ isApproved: false }, { approvalStatus: "Pending" }],
    });
    res.json({ totalStudents, totalTeachers, totalAdmins, pendingRequests, pendingUsers });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Users (Students, Teachers, Admins)
router.get("/users", protect, authorizeRoles("admin"), async (_req, res: Response) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Directly Creates a Verified Student / Faculty / Admin Account
router.post("/create-user", protect, authorizeRoles("admin"), async (req, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      semester,
      rollNumber,
      enrollmentNumber,
      program,
      section,
      employeeId,
      designation,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: "An account with this email already exists." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const targetRole = role || "student";

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: targetRole,
      department: department || "Computer Science",
      semester: targetRole === "student" ? Number(semester || 1) : undefined,
      rollNumber: targetRole === "student" ? rollNumber : undefined,
      enrollmentNumber: targetRole === "student" ? enrollmentNumber : undefined,
      program: targetRole === "student" ? program || "B.Tech" : undefined,
      section: targetRole === "student" ? section || "Section A" : undefined,
      employeeId: targetRole === "teacher" ? employeeId : undefined,
      designation: targetRole === "teacher" ? designation || "Assistant Professor" : undefined,
      isApproved: true,
      approvalStatus: "Approved",
    });

    res.status(201).json({
      message: `${newUser.role.toUpperCase()} account (${newUser.name}) created and verified!`,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Full Edit of Any Student / Teacher / Admin Record
router.patch("/users/:id", protect, authorizeRoles("admin"), async (req, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      role,
      department,
      semester,
      rollNumber,
      enrollmentNumber,
      program,
      batch,
      section,
      employeeId,
      designation,
      qualification,
      phone,
      approvalStatus,
    } = req.body;

    const updateFields: any = {
      name,
      email,
      role,
      department,
      semester: semester !== undefined ? Number(semester) : undefined,
      rollNumber,
      enrollmentNumber,
      program,
      batch,
      section,
      employeeId,
      designation,
      qualification,
      phone,
    };

    if (approvalStatus) {
      updateFields.approvalStatus = approvalStatus;
      updateFields.isApproved = approvalStatus === "Approved";
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    }).select("-password");

    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Resets Any Student / Teacher Password
router.patch(
  "/users/:id/reset-password",
  protect,
  authorizeRoles("admin"),
  async (req, res: Response): Promise<void> => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 4) {
        res.status(400).json({ message: "Password must be at least 4 characters long." });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updated = await User.findByIdAndUpdate(
        req.params.id,
        { password: hashedPassword },
        { new: true }
      ).select("-password");

      if (!updated) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({ message: `Password updated successfully for ${updated.name}.` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Approve or Suspend/Reject User Registration
router.patch("/users/:id/approval", protect, authorizeRoles("admin"), async (req, res: Response): Promise<void> => {
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

// Admin Deletes a Student / Teacher Account & Cleans Up Records
router.delete("/users/:id", protect, authorizeRoles("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.user?.id) {
      res.status(400).json({ message: "You cannot delete your own active admin account." });
      return;
    }

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await Attendance.deleteMany({ studentId: req.params.id });
    await Marks.deleteMany({ studentId: req.params.id });
    await ProfileRequest.deleteMany({ studentId: req.params.id });

    res.json({ message: `User ${deleted.name} and associated records removed.` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk Promote Students of a Branch & Semester to Next Semester
router.post("/promote-semester", protect, authorizeRoles("admin"), async (req, res: Response): Promise<void> => {
  try {
    const { department, fromSemester } = req.body;
    const currentSem = Number(fromSemester);
    if (currentSem >= 8) {
      res.status(400).json({ message: "Semester 8 is the final semester." });
      return;
    }

    const result = await User.updateMany(
      {
        role: "student",
        department,
        semester: currentSem,
        isApproved: { $ne: false },
      },
      { $set: { semester: currentSem + 1 } }
    );

    res.json({
      message: `Promoted ${result.modifiedCount} student(s) in ${department} from Semester ${currentSem} to Semester ${currentSem + 1}!`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get Profile Change Requests
router.get("/profile-requests", protect, authorizeRoles("admin"), async (_req, res: Response) => {
  try {
    const requests = await ProfileRequest.find()
      .populate("studentId", "name email rollNumber employeeId role department")
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

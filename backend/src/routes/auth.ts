import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { generateToken } from "../utils/generateTokens";

const router = express.Router();

// Register (Requires Admin Approval)
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, department, rollNumber, semester } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: "An account with this email already exists." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Prevent public admin creation (only allow student/teacher from public signup)
    const safeRole = role === "teacher" ? "teacher" : "student";

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: safeRole,
      department: department || "Computer Science",
      rollNumber: safeRole === "student" ? rollNumber : undefined,
      semester: safeRole === "student" ? semester || 1 : undefined,
      isApproved: false,
      approvalStatus: "Pending",
    });

    res.status(201).json({
      pendingApproval: true,
      message: "Registration submitted! Your account is pending Campus Admin approval. You can sign in once approved.",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Login (Blocks Pending or Rejected Users)
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    // Check approval status (existing legacy accounts without isApproved field remain allowed)
    if (user.approvalStatus === "Rejected") {
      res.status(403).json({
        message: "Your registration request was rejected by the Campus Administrator.",
      });
      return;
    }

    if (user.isApproved === false || user.approvalStatus === "Pending") {
      res.status(403).json({
        message: "Your account is awaiting Admin approval. Please try signing in after verification.",
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        rollNumber: user.rollNumber,
        semester: user.semester,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

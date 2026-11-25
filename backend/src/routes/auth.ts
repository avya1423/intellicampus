import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { generateToken } from "../utils/generateTokens";
import { protect, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, department, rollNumber, semester } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "student",
      department: department || "Computer Science",
      rollNumber,
      semester: semester || 1,
    });

    res.status(201).json({
      token: generateToken(String(user._id), user.role),
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

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.json({
      token: generateToken(String(user._id), user.role),
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

router.get("/me", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

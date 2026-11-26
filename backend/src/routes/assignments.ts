import express, { Response } from "express";
import Assignment from "../models/Assignment";
import User from "../models/User";
import { protect, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/checkRole";

const router = express.Router();

// Get assignments (filtered by department & semester if provided)
router.get("/", protect, async (req, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.semester) filter.semester = Number(req.query.semester);

    const list = await Assignment.find(filter).sort({ dueDate: 1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher / Admin creates a new Assignment or Lab Record task
router.post("/", protect, authorizeRoles("teacher", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.create(req.body);
    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Student submits or updates their Google Drive / GitHub link
router.post("/:id/submit", protect, authorizeRoles("student"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { submissionLink, remarks } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    const student = await User.findById(req.user?.id);
    if (!student) {
      res.status(404).json({ message: "Student profile not found" });
      return;
    }

    const existingIdx = assignment.submissions.findIndex(
      (s) => s.studentId.toString() === student._id.toString()
    );

    if (existingIdx > -1) {
      assignment.submissions[existingIdx].submissionLink = submissionLink;
      assignment.submissions[existingIdx].remarks = remarks;
      assignment.submissions[existingIdx].submittedAt = new Date();
    } else {
      assignment.submissions.push({
        studentId: student._id as any,
        studentName: student.name,
        rollNumber: student.rollNumber,
        submissionLink,
        remarks,
        submittedAt: new Date(),
      });
    }

    await assignment.save();
    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher / Admin deletes an assignment
router.delete("/:id", protect, authorizeRoles("teacher", "admin"), async (req, res: Response) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: "Assignment removed" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

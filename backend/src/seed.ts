import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "./utils/db";
import User from "./models/User";
import Attendance from "./models/Attendance";
import Marks from "./models/Marks";
import HistoricalPerformance from "./models/HistoricalPerformance";

dotenv.config();

const seedData = async () => {
  await connectDB();
  await User.deleteMany({});
  await Attendance.deleteMany({});
  await Marks.deleteMany({});
  await HistoricalPerformance.deleteMany({});

  const password = await bcrypt.hash("password123", 10);

  await User.create({
    name: "Dr. Rajesh Verma",
    email: "admin@intellicampus.edu",
    password,
    role: "admin",
    department: "Administration",
  });

  const teacher = await User.create({
    name: "Prof. Neha Sharma",
    email: "teacher@intellicampus.edu",
    password,
    role: "teacher",
    department: "Computer Science",
  });

  const student1 = await User.create({
    name: "Aarav Patel",
    email: "student@intellicampus.edu",
    password,
    role: "student",
    department: "Computer Science",
    rollNumber: "CS2026-101",
    semester: 5,
  });

  const student2 = await User.create({
    name: "Anjali Kumari",
    email: "anjali@intellicampus.edu",
    password,
    role: "student",
    department: "Computer Science",
    rollNumber: "CS2026-102",
    semester: 5,
  });

  const subjects = ["Data Structures", "Operating Systems", "DBMS", "Computer Networks"];
  for (let i = 0; i < 10; i++) {
    await Attendance.create({
      studentId: student1._id,
      subject: subjects[i % subjects.length],
      status: i === 2 ? "Absent" : "Present",
      markedBy: teacher._id,
    });
    await Attendance.create({
      studentId: student2._id,
      subject: subjects[i % subjects.length],
      status: i % 2 === 0 ? "Present" : "Absent",
      markedBy: teacher._id,
    });
  }

  await Marks.insertMany([
    { studentId: student1._id, subject: "Data Structures", examType: "Midterm", score: 84, maxScore: 100 },
    { studentId: student1._id, subject: "Operating Systems", examType: "Midterm", score: 79, maxScore: 100 },
    { studentId: student1._id, subject: "DBMS", examType: "Quiz", score: 88, maxScore: 100 },
    { studentId: student2._id, subject: "Data Structures", examType: "Midterm", score: 42, maxScore: 100 },
    { studentId: student2._id, subject: "Operating Systems", examType: "Midterm", score: 38, maxScore: 100 },
    { studentId: student2._id, subject: "DBMS", examType: "Quiz", score: 51, maxScore: 100 },
  ]);

  await HistoricalPerformance.insertMany([
    { studentId: student1._id, semester: 4, gpa: 8.4, attendanceRate: 88, creditsEarned: 22 },
    { studentId: student2._id, semester: 4, gpa: 5.8, attendanceRate: 62, creditsEarned: 18 },
  ]);

  console.log("Database Seeded Successfully!");
  process.exit(0);
};

seedData();

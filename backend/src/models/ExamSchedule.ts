import mongoose, { Document, Schema } from "mongoose";

export interface IExamSchedule extends Document {
  examSession: string;
  department: string;
  semester: number;
  subjectCode: string;
  subject: string;
  examDate: Date;
  shiftTime: string;
  roomNumber: string;
}

const ExamScheduleSchema = new Schema<IExamSchedule>(
  {
    examSession: { type: String, default: "End-Semester Examinations 2026" },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    subjectCode: { type: String, required: true },
    subject: { type: String, required: true },
    examDate: { type: Date, required: true },
    shiftTime: { type: String, default: "10:00 AM - 01:00 PM" },
    roomNumber: { type: String, default: "Exam Hall A - Block 1" },
  },
  { timestamps: true }
);

export default mongoose.model<IExamSchedule>("ExamSchedule", ExamScheduleSchema);

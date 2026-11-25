import mongoose, { Schema, Document } from "mongoose";

export interface IMarks extends Document {
  studentId: mongoose.Types.ObjectId;
  subject: string;
  examType: "Midterm" | "Final" | "Quiz" | "Assignment";
  score: number;
  maxScore: number;
}

const MarksSchema = new Schema<IMarks>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    examType: { type: String, enum: ["Midterm", "Final", "Quiz", "Assignment"], default: "Midterm" },
    score: { type: Number, required: true },
    maxScore: { type: Number, default: 100 },
  },
  { timestamps: true }
);

export default mongoose.model<IMarks>("Marks", MarksSchema);

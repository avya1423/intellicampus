import mongoose, { Schema, Document } from "mongoose";

export interface IHistoricalPerformance extends Document {
  studentId: mongoose.Types.ObjectId;
  semester: number;
  gpa: number;
  attendanceRate: number;
  creditsEarned: number;
}

const HistoricalPerformanceSchema = new Schema<IHistoricalPerformance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    semester: { type: Number, required: true },
    gpa: { type: Number, required: true },
    attendanceRate: { type: Number, required: true },
    creditsEarned: { type: Number, default: 20 },
  },
  { timestamps: true }
);

export default mongoose.model<IHistoricalPerformance>(
  "HistoricalPerformance",
  HistoricalPerformanceSchema
);

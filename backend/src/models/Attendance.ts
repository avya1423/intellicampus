import mongoose, { Document, Schema } from "mongoose";

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  subject: string;
  timeSlot?: string;
  date: Date;
  status: "Present" | "Absent" | "Late" | "Cancelled";
  cancelReason?: string;
  markedBy: mongoose.Types.ObjectId;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    timeSlot: { type: String },
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Cancelled"],
      required: true,
    },
    cancelReason: { type: String },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IAttendance>("Attendance", AttendanceSchema);

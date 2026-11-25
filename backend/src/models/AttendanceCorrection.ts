import mongoose, { Document, Schema } from "mongoose";

export interface IAttendanceCorrection extends Document {
  attendanceId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  subject: string;
  date: Date;
  currentStatus: string;
  requestedStatus: "Present" | "Late";
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

const AttendanceCorrectionSchema = new Schema<IAttendanceCorrection>(
  {
    attendanceId: { type: Schema.Types.ObjectId, ref: "Attendance", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User" },
    subject: { type: String, required: true },
    date: { type: Date, required: true },
    currentStatus: { type: String, required: true },
    requestedStatus: { type: String, enum: ["Present", "Late"], default: "Present" },
    reason: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model<IAttendanceCorrection>("AttendanceCorrection", AttendanceCorrectionSchema);

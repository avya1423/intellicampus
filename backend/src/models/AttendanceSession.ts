import mongoose, { Document, Schema } from "mongoose";

export interface ICheckInEntry {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber?: string;
  checkedInAt: Date;
}

export interface IAttendanceSession extends Document {
  code: string;
  department: string;
  semester: number;
  subject: string;
  timeSlot: string;
  teacherId: mongoose.Types.ObjectId;
  teacherName: string;
  expiresAt: Date;
  isActive: boolean;
  attendees: ICheckInEntry[];
}

const CheckInEntrySchema = new Schema<ICheckInEntry>({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String },
  checkedInAt: { type: Date, default: Date.now },
});

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    code: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    subject: { type: String, required: true },
    timeSlot: { type: String, default: "Live Lecture" },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacherName: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    attendees: [CheckInEntrySchema],
  },
  { timestamps: true }
);

export default mongoose.model<IAttendanceSession>("AttendanceSession", AttendanceSessionSchema);

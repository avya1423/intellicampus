import mongoose, { Document, Schema } from "mongoose";

export interface IRoutine extends Document {
  department: string;
  semester: number;
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  subject: string;
  timeSlot: string;
  teacherName?: string;
}

const RoutineSchema = new Schema<IRoutine>(
  {
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },
    subject: { type: String, required: true },
    timeSlot: { type: String, default: "10:00 AM - 11:00 AM" },
    teacherName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IRoutine>("Routine", RoutineSchema);

import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
  department: string;
  rollNumber?: string;
  enrollmentNumber?: string;
  semester?: number;
  program?: string;
  batch?: string;
  section?: string;
  collegeName?: string;
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  bloodGroup?: string;
  address?: string;
  isApproved: boolean;
  approvalStatus: "Pending" | "Approved" | "Rejected";
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    department: { type: String, default: "Computer Science" },
    rollNumber: { type: String },
    enrollmentNumber: { type: String },
    semester: { type: Number, default: 1 },
    program: { type: String, default: "B.Tech" },
    batch: { type: String, default: "2026 - 2030" },
    section: { type: String, default: "Section A" },
    collegeName: { type: String, default: "IntelliCampus Institute of Technology" },
    phone: { type: String },
    guardianName: { type: String },
    guardianPhone: { type: String },
    bloodGroup: { type: String },
    address: { type: String },
    isApproved: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);

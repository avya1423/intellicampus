import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
  department: string;
  rollNumber?: string;
  semester?: number;
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
    semester: { type: Number, default: 1 },
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

import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "teacher" | "student";
  department: string;
  rollNumber?: string;
  semester?: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "teacher", "student"], default: "student" },
    department: { type: String, default: "Computer Science" },
    rollNumber: { type: String },
    semester: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);

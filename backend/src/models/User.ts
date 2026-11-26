import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
  department: string;
  // Student Fields
  rollNumber?: string;
  enrollmentNumber?: string;
  semester?: number;
  program?: string;
  batch?: string;
  section?: string;
  guardianName?: string;
  guardianPhone?: string;
  // Faculty / Teacher Fields
  employeeId?: string;
  designation?: string;
  qualification?: string;
  specialization?: string;
  experienceYears?: string;
  cabinLocation?: string;
  officeHours?: string;
  // Shared Institution & Personal Fields
  collegeName?: string;
  phone?: string;
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
    // Student Fields
    rollNumber: { type: String },
    enrollmentNumber: { type: String },
    semester: { type: Number, default: 1 },
    program: { type: String, default: "B.Tech" },
    batch: { type: String, default: "2026 - 2030" },
    section: { type: String, default: "Section A" },
    guardianName: { type: String },
    guardianPhone: { type: String },
    // Faculty / Teacher Fields
    employeeId: { type: String },
    designation: { type: String, default: "Assistant Professor" },
    qualification: { type: String, default: "M.Tech / Ph.D." },
    specialization: { type: String },
    experienceYears: { type: String, default: "5 Years" },
    cabinLocation: { type: String },
    officeHours: { type: String, default: "Mon - Fri, 02:00 PM - 04:00 PM" },
    // Shared Institution & Personal Fields
    collegeName: { type: String, default: "IntelliCampus Institute of Technology" },
    phone: { type: String },
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

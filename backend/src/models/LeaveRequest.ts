import mongoose, { Document, Schema } from "mongoose";

export interface ILeaveRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  leaveType: "Medical Leave" | "Duty / Event Leave" | "Personal Leave";
  fromDate: Date;
  toDate: Date;
  reason: string;
  documentLink?: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: string;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    leaveType: {
      type: String,
      enum: ["Medical Leave", "Duty / Event Leave", "Personal Leave"],
      default: "Medical Leave",
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    documentLink: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reviewedBy: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ILeaveRequest>("LeaveRequest", LeaveRequestSchema);

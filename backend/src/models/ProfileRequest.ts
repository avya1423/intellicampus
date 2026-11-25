import mongoose, { Schema, Document } from "mongoose";

export interface IProfileRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  requestedChanges: Record<string, any>;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

const ProfileRequestSchema = new Schema<IProfileRequest>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedChanges: { type: Schema.Types.Mixed, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model<IProfileRequest>("ProfileRequest", ProfileRequestSchema);

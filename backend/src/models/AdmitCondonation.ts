import mongoose, { Document, Schema } from "mongoose";

export interface IAdmitCondonation extends Document {
  studentId: mongoose.Types.ObjectId;
  reason: string;
  grantedBy: string;
}

const AdmitCondonationSchema = new Schema<IAdmitCondonation>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    reason: { type: String, required: true },
    grantedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAdmitCondonation>("AdmitCondonation", AdmitCondonationSchema);

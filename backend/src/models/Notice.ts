import mongoose, { Document, Schema } from "mongoose";

export interface INotice extends Document {
  title: string;
  message: string;
  department: string;
  semester: number;
  resourceLink?: string;
  postedBy: string;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    resourceLink: { type: String },
    postedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<INotice>("Notice", NoticeSchema);

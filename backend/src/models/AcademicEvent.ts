import mongoose, { Document, Schema } from "mongoose";

export interface IAcademicEvent extends Document {
  title: string;
  date: Date;
  type: "Holiday" | "Exam" | "Event";
  description?: string;
}

const AcademicEventSchema = new Schema<IAcademicEvent>(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ["Holiday", "Exam", "Event"], default: "Holiday" },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAcademicEvent>("AcademicEvent", AcademicEventSchema);

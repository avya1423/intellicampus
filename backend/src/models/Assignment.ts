import mongoose, { Document, Schema } from "mongoose";

export interface ISubmission {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  rollNumber?: string;
  submissionLink: string;
  remarks?: string;
  submittedAt: Date;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  department: string;
  semester: number;
  type: "Assignment" | "Lab Record" | "Mini Project";
  dueDate: Date;
  instructions?: string;
  createdBy: string;
  submissions: ISubmission[];
}

const SubmissionSchema = new Schema<ISubmission>({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String },
  submissionLink: { type: String, required: true },
  remarks: { type: String },
  submittedAt: { type: Date, default: Date.now },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    type: {
      type: String,
      enum: ["Assignment", "Lab Record", "Mini Project"],
      default: "Assignment",
    },
    dueDate: { type: Date, required: true },
    instructions: { type: String },
    createdBy: { type: String, required: true },
    submissions: [SubmissionSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>("Assignment", AssignmentSchema);

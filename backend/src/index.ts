import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./utils/db";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import attendanceRoutes from "./routes/attendance";
import marksRoutes from "./routes/marks";
import riskRoutes from "./routes/risk";
import adminRoutes from "./routes/admin";
import aiRoutes from "./routes/ai";
import chatbotRoutes from "./routes/chatbot";
import correctionRoutes from "./routes/corrections";
import routineRoutes from "./routes/routine";
import calendarRoutes from "./routes/calendar";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "IntelliCampus API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/corrections", correctionRoutes);
app.use("/api/routine", routineRoutes);
app.use("/api/calendar", calendarRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`IntelliCampus Server running on http://localhost:${PORT}`);
  });
});

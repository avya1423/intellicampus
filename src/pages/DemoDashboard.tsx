import React from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const sampleData = [
  { subject: "DSA", attendance: 88, avgScore: 79 },
  { subject: "OS", attendance: 64, avgScore: 54 },
  { subject: "DBMS", attendance: 82, avgScore: 75 },
  { subject: "Networks", attendance: 91, avgScore: 84 },
];

export const DemoDashboard: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Navbar />
    <div className="max-w-6xl w-full mx-auto px-4 py-10 space-y-6 flex-1">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Interactive Analytics Sandbox</h1>
        <p className="text-sm text-slate-500 mt-1">
          Live preview of subject-wise attendance vs exam performance correlation
        </p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sampleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="subject" stroke="#475569" />
            <YAxis stroke="#475569" />
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px" }} />
            <Bar dataKey="attendance" fill="#2563eb" name="Attendance %" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avgScore" fill="#10b981" name="Avg Marks %" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    <Footer />
  </div>
);

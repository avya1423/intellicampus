import React, { useEffect, useState } from "react";
import { StudentLayout } from "../components/layouts/StudentLayout";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import {
  Send,
  Bot,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Printer,
  BarChart3,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const StudentPanel: React.FC = () => {
  const { user } = useAuth();
  const [riskData, setRiskData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<{ totalClasses: number; percentage: number; records: any[] }>({
    totalClasses: 0,
    percentage: 0,
    records: [],
  });
  const [marksRecords, setMarksRecords] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hi! I'm your IntelliCampus AI Study Advisor. Ask me how to improve your attendance or exam readiness!" },
  ]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get("/risk/my").then((res) => setRiskData(res.data)).catch(console.error);
    api.get("/attendance/my").then((res) => setAttendanceData(res.data)).catch(console.error);
    api.get("/marks/my").then((res) => setMarksRecords(res.data.records || [])).catch(console.error);
    if (user?.department) {
      api
        .get(`/notices?department=${encodeURIComponent(user.department)}&semester=${user.semester || 1}`)
        .then((res) => setNotices(res.data))
        .catch(console.error);
    }
  }, [user?.department, user?.semester]);

  const total = attendanceData.totalClasses || 0;
  const attended = attendanceData.records?.filter((r) => r.status === "Present" || r.status === "Late").length || 0;
  const pct = attendanceData.percentage || 0;

  let attendanceAdvice = "No classes logged yet. Once faculty marks attendance, your 75% target tracker will appear here.";
  if (total > 0) {
    if (pct < 75) {
      const needed = Math.ceil((0.75 * total - attended) / 0.25);
      attendanceAdvice = `You need to attend the next ${needed} consecutive lecture${needed > 1 ? "s" : ""} to cross the 75% eligibility threshold.`;
    } else {
      const canSkip = Math.floor(attended / 0.75 - total);
      attendanceAdvice =
        canSkip > 0
          ? `You are safely above 75%. You can miss up to ${canSkip} upcoming lecture${canSkip > 1 ? "s" : ""} and still remain eligible.`
          : "You are right on the 75% threshold. Avoid missing the next class to stay safe.";
    }
  }

  const chartData = marksRecords.map((m) => ({
    name: `${m.subject} (${m.examType})`,
    score: Math.round((m.score / (m.maxScore || 100)) * 100),
  }));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    setChatHistory((prev) => [...prev, { sender: "user", text: msg }]);
    setSending(true);
    try {
      const context = riskData
        ? `Attendance: ${riskData.attendancePct}%, Avg Marks: ${riskData.avgMarksPct}%, Risk Level: ${riskData.riskLevel}`
        : "";
      const { data } = await api.post("/chatbot/ask", { message: msg, context });
      setChatHistory((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch {
      setChatHistory((prev) => [...prev, { sender: "ai", text: "Unable to reach AI advisor right now." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header with Print Report Button */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Roll No: {user?.rollNumber || "N/A"} • Department: {user?.department} • Semester {user?.semester || 1}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold border border-slate-200 transition w-fit"
          >
            <Printer className="w-4 h-4" /> Print Summary
          </button>
        </div>

        {/* KPI Cards */}
        {riskData && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Overall Attendance</p>
              <p className="text-3xl font-bold mt-1 text-blue-600">{riskData.attendancePct}%</p>
              <p className="text-xs text-slate-500 mt-1">Target: ≥ 75.0% ({attended}/{total} classes)</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Average Marks</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600">{riskData.avgMarksPct}%</p>
              <p className="text-xs text-slate-500 mt-1">Latest GPA: {riskData.latestGpa}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Academic Risk Status</p>
              <div className="flex items-center gap-2 mt-1">
                {riskData.riskLevel === "Low" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                <span className="text-2xl font-bold text-slate-900">{riskData.riskLevel}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Risk Score: {riskData.riskScore}/100</p>
            </div>
          </div>
        )}

        {/* 75% Attendance Eligibility Tracker */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            pct < 75 && total > 0
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <Calculator className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">75% Attendance Eligibility Tracker</p>
            <p className="text-xs mt-0.5 opacity-90">{attendanceAdvice}</p>
          </div>
        </div>

        {/* Live Faculty Notices & Study Material Links */}
        {notices.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600" /> Class Announcements & Study Resources
            </div>
            <div className="divide-y divide-slate-200">
              {notices.map((n) => (
                <div key={n._id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                    <span className="text-[11px] text-slate-500">
                      Posted by {n.postedBy} • {new Date(n.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                  {n.resourceLink && (
                    <a
                      href={n.resourceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Access Study Material
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject-Wise Performance Chart */}
        {chartData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" /> Assessment Performance Overview (%)
            </h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#475569" }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Gemini AI Academic Advisor */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center gap-2 font-semibold text-slate-800">
            <Bot className="w-5 h-5 text-blue-600" /> Gemini AI Academic Advisor
          </div>
          <div className="p-4 h-72 overflow-y-auto space-y-3 bg-white">
            {chatHistory.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-xl px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-slate-100 text-slate-800 border border-slate-200/60"
                }`}
              >
                {m.text}
              </div>
            ))}
            {sending && <p className="text-xs text-slate-400">AI is thinking...</p>}
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-slate-50/50 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about study strategy, attendance recovery, or exam prep..."
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm font-medium shadow-sm"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
};

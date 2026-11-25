import React, { useEffect, useState } from "react";
import { StudentLayout } from "../components/layouts/StudentLayout";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import { Send, Bot, AlertCircle, CheckCircle2 } from "lucide-react";

export const StudentPanel: React.FC = () => {
  const { user } = useAuth();
  const [riskData, setRiskData] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hi! I'm your IntelliCampus AI Study Advisor. Ask me how to improve your attendance or exam readiness!" },
  ]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get("/risk/my").then((res) => setRiskData(res.data)).catch(console.error);
  }, []);

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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Roll No: {user?.rollNumber || "N/A"} • Department: {user?.department} • Semester {user?.semester || 1}
          </p>
        </div>

        {riskData && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Overall Attendance</p>
              <p className="text-3xl font-bold mt-1 text-blue-600">{riskData.attendancePct}%</p>
              <p className="text-xs text-slate-500 mt-1">Target: ≥ 75.0%</p>
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

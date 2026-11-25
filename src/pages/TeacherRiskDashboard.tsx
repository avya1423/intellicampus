import React, { useEffect, useState } from "react";
import { TeacherLayout } from "../components/layouts/TeacherLayout";
import api from "../api/axios";
import { Sparkles } from "lucide-react";

export const TeacherRiskDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/risk/all").then((res) => setData(res.data)).catch(console.error);
  }, []);

  const generateIntervention = async (item: any) => {
    setAnalyzingId(item.student._id);
    try {
      const res = await api.post("/ai/analyze-student", {
        studentName: item.student.name,
        attendancePct: item.attendancePct,
        avgMarksPct: item.avgMarksPct,
        riskLevel: item.riskLevel,
        factors: item.factors,
      });
      setAiInsight(res.data.insight);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {data && (
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Students</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.summary.total}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">High / Critical Risk</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{data.summary.highRisk}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Moderate Risk</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{data.summary.moderateRisk}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Class Avg Attendance</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{data.summary.avgAttendance}%</p>
            </div>
          </div>
        )}

        {aiInsight && (
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> Gemini AI Intervention Plan
            </h3>
            <p className="text-sm text-blue-950 whitespace-pre-line leading-relaxed">{aiInsight}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">Attendance</th>
                <th className="py-3 px-4 font-semibold">Avg Marks</th>
                <th className="py-3 px-4 font-semibold">Risk Level</th>
                <th className="py-3 px-4 font-semibold">AI Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data?.students?.map((item: any) => (
                <tr key={item.student._id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-medium text-slate-900">{item.student.name}</td>
                  <td className="py-3 px-4 text-slate-700">{item.attendancePct}%</td>
                  <td className="py-3 px-4 text-slate-700">{item.avgMarksPct}%</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.riskLevel === "Critical" || item.riskLevel === "High"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : item.riskLevel === "Moderate"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {item.riskLevel} ({item.riskScore})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => generateIntervention(item)}
                      disabled={analyzingId === item.student._id}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm"
                    >
                      {analyzingId === item.student._id ? "Analyzing..." : "Generate AI Plan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TeacherLayout>
  );
};

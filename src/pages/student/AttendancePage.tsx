import React, { useEffect, useState } from "react";
import { StudentLayout } from "../../components/layouts/StudentLayout";
import api from "../../api/axios";
import {
  Target,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  BookOpen,
} from "lucide-react";

interface SubjectStat {
  subject: string;
  total: number;
  present: number;
}

export const AttendancePage: React.FC = () => {
  const [data, setData] = useState<{ percentage: number; totalClasses: number; records: any[] }>({
    percentage: 0,
    totalClasses: 0,
    records: [],
  });
  const [corrections, setCorrections] = useState<any[]>([]);

  // Interactive Target Calculator (60, 70, 75, 80, 85)
  const [targetPct, setTargetPct] = useState<number>(75);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Correction Box State
  const [activeRecord, setActiveRecord] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const loadData = () => {
    api.get("/attendance/my").then((res) => setData(res.data)).catch(console.error);
    api.get("/corrections/my").then((res) => setCorrections(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Target calculation logic
  const total = data.totalClasses || 0;
  const attended = data.records.filter((r) => r.status === "Present" || r.status === "Late").length;
  const currentPct = data.percentage || 0;
  const t = Math.min(99, Math.max(1, targetPct)) / 100;

  let targetMessage = "No classes logged yet. Once classes begin, your attendance projection will appear here.";
  let isShort = false;

  if (total > 0) {
    if (currentPct < targetPct) {
      isShort = true;
      const classesNeeded = Math.ceil((t * total - attended) / (1 - t));
      targetMessage = `To reach ${targetPct}% attendance, you must attend the next ${classesNeeded} consecutive class${
        classesNeeded > 1 ? "es" : ""
      } without any absence.`;
    } else {
      const canSkip = Math.floor(attended / t - total);
      targetMessage =
        canSkip > 0
          ? `You have achieved your ${targetPct}% target! You can safely miss up to ${canSkip} upcoming class${
              canSkip > 1 ? "es" : ""
            } and stay above ${targetPct}%.`
          : `You are right at ${targetPct}%. Attend the next class to maintain your target.`;
    }
  }

  // Group by Subject (Explicitly typed for TypeScript build)
  const subjectMap: Record<string, SubjectStat> = {};
  data.records.forEach((r) => {
    if (!subjectMap[r.subject]) {
      subjectMap[r.subject] = { subject: r.subject, total: 0, present: 0 };
    }
    subjectMap[r.subject].total += 1;
    if (r.status === "Present" || r.status === "Late") {
      subjectMap[r.subject].present += 1;
    }
  });
  const subjectStats: SubjectStat[] = Object.values(subjectMap);

  const uniqueSubjects: string[] = ["All", ...subjectStats.map((s) => s.subject)];

  // Filtered Records
  const filteredRecords = data.records.filter((r) => {
    const matchSubject = selectedSubject === "All" || r.subject === selectedSubject;
    const matchStatus = selectedStatus === "All" || r.status === selectedStatus;
    const recordDateStr = new Date(r.date).toISOString().split("T")[0];
    const matchDate = !selectedDate || recordDateStr === selectedDate;
    return matchSubject && matchStatus && matchDate;
  });

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord || !reason.trim()) return;
    setSubmitting(true);
    setFeedbackMsg("");
    try {
      await api.post("/corrections", {
        attendanceId: activeRecord._id,
        reason,
      });
      setFeedbackMsg(`Correction request for ${activeRecord.subject} sent to faculty!`);
      setActiveRecord(null);
      setReason("");
      loadData();
    } catch (err: any) {
      setFeedbackMsg(err.response?.data?.message || "Could not submit correction request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Top Overview + Interactive Target Simulator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Attendance Analytics & Logs</h1>
              <p className="text-sm text-slate-500">
                Attended {attended} out of {total} total lectures
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-3xl font-extrabold text-blue-600">{data.percentage}%</span>
              <p className="text-xs font-medium text-slate-500">Current Aggregate</p>
            </div>
          </div>

          {/* Interactive Target Selector */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-600" /> Set Attendance Target Goal:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[60, 70, 75, 80, 85].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setTargetPct(goal)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      targetPct === goal
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {goal}%
                  </button>
                ))}
              </div>
            </div>
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
                isShort
                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                  : "bg-emerald-50 text-emerald-900 border border-emerald-200"
              }`}
            >
              {isShort ? (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <span>{targetMessage}</span>
            </div>
          </div>
        </div>

        {/* Subject-Wise Breakdown Grid */}
        {subjectStats.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map((sub) => {
              const subPct = Math.round((sub.present / sub.total) * 100);
              const belowGoal = subPct < targetPct;
              return (
                <div key={sub.subject} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" /> {sub.subject}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        belowGoal
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {subPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${belowGoal ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${subPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Present: {sub.present} / {sub.total} lectures
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {feedbackMsg && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium">
            {feedbackMsg}
          </div>
        )}

        {/* Correction Request Box */}
        {activeRecord && (
          <form
            onSubmit={handleCorrectionSubmit}
            className="bg-white p-5 rounded-2xl border-2 border-blue-500 shadow-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Request Attendance Correction — {activeRecord.subject} (
                {new Date(activeRecord.date).toLocaleDateString()})
              </h3>
              <button
                type="button"
                onClick={() => setActiveRecord(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Your name, roll number, department, and semester will be automatically sent to the faculty for review.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you were marked absent (e.g. Attended lab session, biometric missed)..."
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> {submitting ? "Sending..." : "Send to Teacher"}
              </button>
            </div>
          </form>
        )}

        {/* Date-Wise & Subject-Wise Filterable Attendance Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" /> Date-Wise & Subject-Wise Log ({filteredRecords.length})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              >
                {uniqueSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub === "All" ? "All Subjects" : sub}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="All">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
              {(selectedDate || selectedSubject !== "All" || selectedStatus !== "All") && (
                <button
                  onClick={() => {
                    setSelectedDate("");
                    setSelectedSubject("All");
                    setSelectedStatus("All");
                  }}
                  className="text-xs text-blue-600 font-semibold hover:underline px-2"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Subject</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Correction Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.map((r) => {
                  const existingReq = corrections.find((c) => c.attendanceId === r._id);
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-slate-700">
                        {new Date(r.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{r.subject}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            r.status === "Present"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.status === "Late"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {existingReq ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              existingReq.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : existingReq.status === "Rejected"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {existingReq.status === "Pending" && <Clock className="w-3 h-3" />}
                            {existingReq.status === "Approved" && <CheckCircle2 className="w-3 h-3" />}
                            {existingReq.status === "Rejected" && <XCircle className="w-3 h-3" />}
                            Request {existingReq.status}
                          </span>
                        ) : r.status !== "Present" ? (
                          <button
                            onClick={() => setActiveRecord(r)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Request Correction
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Verified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No matching attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

import React, { useEffect, useState } from "react";
import { TeacherLayout } from "../components/layouts/TeacherLayout";
import api from "../api/axios";
import { CheckCircle2, ClipboardList, Award } from "lucide-react";

export const TeacherPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"attendance" | "marks">("attendance");
  const [students, setStudents] = useState<any[]>([]);
  const [subject, setSubject] = useState("Data Structures");
  const [bulkStatus, setBulkStatus] = useState<Record<string, "Present" | "Absent" | "Late">>({});
  const [submitting, setSubmitting] = useState(false);

  // Marks state
  const [selectedStudent, setSelectedStudent] = useState("");
  const [score, setScore] = useState(80);
  const [examType, setExamType] = useState("Midterm");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/users/students").then((res) => {
      setStudents(res.data);
      const initial: Record<string, "Present" | "Absent" | "Late"> = {};
      res.data.forEach((s: any) => {
        initial[s._id] = "Present";
      });
      setBulkStatus(initial);
      if (res.data.length > 0) setSelectedStudent(res.data[0]._id);
    });
  }, []);

  const handleBulkSubmit = async () => {
    if (students.length === 0) return;
    setSubmitting(true);
    setMsg("");
    try {
      await Promise.all(
        students.map((s) =>
          api.post("/attendance/mark", {
            studentId: s._id,
            subject,
            status: bulkStatus[s._id] || "Present",
          })
        )
      );
      setMsg(`Attendance successfully recorded for all ${students.length} students in ${subject}!`);
    } catch {
      setMsg("Error saving bulk attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const addMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    await api.post("/marks/add", { studentId: selectedStudent, subject, examType, score: Number(score) });
    setMsg("Assessment marks recorded successfully!");
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Faculty Classroom Operations</h1>
            <p className="text-sm text-slate-500 mt-1">Manage daily class attendance register and exam evaluations</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "attendance" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Bulk Attendance
            </button>
            <button
              onClick={() => setActiveTab("marks")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "marks" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="w-4 h-4" /> Marks Entry
            </button>
          </div>
        </div>

        {msg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {msg}
          </div>
        )}

        {activeTab === "attendance" ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">Subject:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleBulkSubmit}
                disabled={submitting || students.length === 0}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                {submitting ? "Saving Register..." : `Submit Class Attendance (${students.length})`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Roll Number</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-medium text-slate-900">{s.name}</td>
                      <td className="py-3 px-4 text-slate-600">{s.rollNumber || s.email}</td>
                      <td className="py-3 px-4">
                        <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                          {(["Present", "Absent", "Late"] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setBulkStatus((prev) => ({ ...prev, [s._id]: st }))}
                              className={`px-3 py-1 text-xs font-semibold transition ${
                                bulkStatus[s._id] === st
                                  ? st === "Present"
                                    ? "bg-emerald-600 text-white"
                                    : st === "Absent"
                                    ? "bg-red-600 text-white"
                                    : "bg-amber-500 text-white"
                                  : "bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        No students registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <form onSubmit={addMarks} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl">
            <h2 className="text-lg font-bold text-slate-900">Upload Assessment Marks</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.rollNumber || s.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Exam Type</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Score (out of 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm">
              Save Assessment Marks
            </button>
          </form>
        )}
      </div>
    </TeacherLayout>
  );
};

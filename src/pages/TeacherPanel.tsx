import React, { useEffect, useState } from "react";
import { TeacherLayout } from "../components/layouts/TeacherLayout";
import api from "../api/axios";

export const TeacherPanel: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [subject, setSubject] = useState("Data Structures");
  const [status, setStatus] = useState("Present");
  const [score, setScore] = useState(80);
  const [examType, setExamType] = useState("Midterm");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/users/students").then((res) => {
      setStudents(res.data);
      if (res.data.length > 0) setSelectedStudent(res.data[0]._id);
    });
  }, []);

  const markAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/attendance/mark", { studentId: selectedStudent, subject, status });
    setMsg("Attendance logged successfully!");
  };

  const addMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/marks/add", { studentId: selectedStudent, subject, examType, score: Number(score) });
    setMsg("Marks recorded successfully!");
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Faculty Classroom Operations</h1>
          <p className="text-sm text-slate-500 mt-1">Log student attendance and exam evaluations</p>
          {msg && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
              {msg}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={markAttendance} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Mark Daily Attendance</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm">
              Submit Attendance
            </button>
          </form>

          <form onSubmit={addMarks} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Upload Assessment Marks</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.rollNumber || s.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Exam Type</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm">
              Save Marks
            </button>
          </form>
        </div>
      </div>
    </TeacherLayout>
  );
};

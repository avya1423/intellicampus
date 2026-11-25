import React, { useEffect, useState } from "react";
import { TeacherLayout } from "../components/layouts/TeacherLayout";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import {
  CheckCircle2,
  ClipboardList,
  Award,
  CalendarClock,
  MessageSquareWarning,
  Plus,
  Check,
  X,
  Shuffle,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
];

export const TeacherPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"attendance" | "routine" | "marks" | "corrections">("attendance");

  const [students, setStudents] = useState<any[]>([]);
  const [routineSlots, setRoutineSlots] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);

  // Selected Branch, Semester & Day
  const [department, setDepartment] = useState(user?.department || "Computer Science");
  const [semester, setSemester] = useState<number>(1);
  const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
  const defaultDay = todayIndex >= 1 && todayIndex <= 6 ? DAYS[todayIndex - 1] : "Monday";
  const [dayOfWeek, setDayOfWeek] = useState<string>(defaultDay);

  // Flexible / Proxy mode for covering other teachers' subjects
  const [proxyMode, setProxyMode] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");

  // Bulk attendance statuses
  const [bulkStatus, setBulkStatus] = useState<Record<string, "Present" | "Absent" | "Late">>({});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // Routine Creator state
  const [newSubName, setNewSubName] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("10:00 AM - 11:00 AM");
  const [addingSlot, setAddingSlot] = useState(false);

  // Marks Entry state
  const [selectedStudent, setSelectedStudent] = useState("");
  const [score, setScore] = useState(80);
  const [examType, setExamType] = useState("Midterm");

  const loadAll = () => {
    api.get("/users/students").then((res) => {
      setStudents(res.data);
      const initial: Record<string, "Present" | "Absent" | "Late"> = {};
      res.data.forEach((s: any) => {
        initial[s._id] = "Present";
      });
      setBulkStatus(initial);
      if (res.data.length > 0 && !selectedStudent) setSelectedStudent(res.data[0]._id);
    });
    api.get("/routine").then((res) => setRoutineSlots(res.data)).catch(console.error);
    api.get("/corrections/teacher").then((res) => setCorrections(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Subjects scheduled specifically for selected Branch + Semester + Day
  const todayScheduledSlots = routineSlots.filter(
    (r) => r.department === department && r.semester === semester && r.dayOfWeek === dayOfWeek
  );

  // All subjects across the week for selected Branch + Semester (for Proxy/Flexible mode)
  const allSemesterSubjects = Array.from(
    new Set(
      routineSlots
        .filter((r) => r.department === department && r.semester === semester)
        .map((r) => r.subject)
    )
  );

  // Auto-select first available subject when filters change
  useEffect(() => {
    if (!proxyMode) {
      if (todayScheduledSlots.length > 0) {
        setSelectedSubject(todayScheduledSlots[0].subject);
      } else {
        setSelectedSubject("");
      }
    } else if (allSemesterSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(allSemesterSubjects[0]);
    }
  }, [department, semester, dayOfWeek, proxyMode, routineSlots.length]);

  // Filter students belonging to selected Branch & Semester
  const classStudents = students.filter(
    (s) => s.department === department && (s.semester || 1) === semester
  );

  const activeSubjectName =
    selectedSubject === "__custom__" ? customSubject.trim() : selectedSubject;

  const handleBulkSubmit = async () => {
    if (!activeSubjectName) {
      setMsg("Please select or enter a subject name first.");
      return;
    }
    if (classStudents.length === 0) {
      setMsg(`No students found in ${department} Semester ${semester}.`);
      return;
    }
    setSubmitting(true);
    setMsg("");
    try {
      const subjectLabel = proxyMode ? `${activeSubjectName} (Proxy/Extra)` : activeSubjectName;
      await Promise.all(
        classStudents.map((s) =>
          api.post("/attendance/mark", {
            studentId: s._id,
            subject: subjectLabel,
            status: bulkStatus[s._id] || "Present",
          })
        )
      );
      setMsg(
        `Attendance saved for ${classStudents.length} students in ${subjectLabel} (${department} • Sem ${semester})!`
      );
    } catch {
      setMsg("Failed to record attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRoutineSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    setAddingSlot(true);
    try {
      await api.post("/routine", {
        department,
        semester,
        dayOfWeek,
        subject: newSubName.trim(),
        timeSlot: newTimeSlot,
        teacherName: user?.name,
      });
      setNewSubName("");
      setMsg(`Added ${newSubName} to ${department} Sem ${semester} (${dayOfWeek}) routine!`);
      loadAll();
    } finally {
      setAddingSlot(false);
    }
  };

  const handleAddMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    const markSub = activeSubjectName || customSubject.trim();
    if (!markSub) {
      setMsg("Please select or enter a subject.");
      return;
    }
    await api.post("/marks/add", {
      studentId: selectedStudent,
      subject: markSub,
      examType,
      score: Number(score),
    });
    setMsg(`Marks (${score}/100) recorded in ${markSub}!`);
  };

  const handleCorrectionDecision = async (id: string, status: "Approved" | "Rejected") => {
    await api.patch(`/corrections/${id}`, { status });
    setMsg(
      status === "Approved"
        ? "Correction approved! Student's attendance has been automatically updated to Present."
        : "Correction request rejected."
    );
    loadAll();
  };

  const pendingCorrections = corrections.filter((c) => c.status === "Pending");

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header & Navigation Tabs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Faculty Classroom & Routine Hub</h1>
            <p className="text-sm text-slate-500 mt-1">
              Mark routine-based attendance, cover proxy classes, upload marks & review student requests
            </p>
          </div>
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 w-fit">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "attendance" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Take Attendance
            </button>
            <button
              onClick={() => setActiveTab("routine")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "routine" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarClock className="w-4 h-4" /> Subject Routine
            </button>
            <button
              onClick={() => setActiveTab("marks")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "marks" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="w-4 h-4" /> Marks Entry
            </button>
            <button
              onClick={() => setActiveTab("corrections")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "corrections" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquareWarning className="w-4 h-4" /> Corrections
              {pendingCorrections.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                  {pendingCorrections.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {msg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> {msg}
          </div>
        )}

        {/* Shared Branch / Semester / Day Selector Bar (For Attendance, Routine & Marks) */}
        {activeTab !== "corrections" && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Branch / Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Schedule Day</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* TAB 1: ROUTINE-BASED + FLEXIBLE PROXY ATTENDANCE */}
        {activeTab === "attendance" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {proxyMode
                        ? `All Subjects (${department} Sem ${semester})`
                        : `Scheduled on ${dayOfWeek} (${department} Sem ${semester})`}
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm min-w-[240px]"
                    >
                      {!proxyMode ? (
                        todayScheduledSlots.length > 0 ? (
                          todayScheduledSlots.map((slot) => (
                            <option key={slot._id} value={slot.subject}>
                              {slot.subject} ({slot.timeSlot})
                            </option>
                          ))
                        ) : (
                          <option value="">No routine class scheduled on {dayOfWeek}</option>
                        )
                      ) : (
                        <>
                          {allSemesterSubjects.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                          <option value="__custom__">+ Enter Other / Custom Subject...</option>
                        </>
                      )}
                    </select>
                  </div>

                  {selectedSubject === "__custom__" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Custom Subject Name</label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="e.g. Operating Systems"
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = !proxyMode;
                      setProxyMode(nextMode);
                      if (nextMode && allSemesterSubjects.length === 0) {
                        setSelectedSubject("__custom__");
                      }
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition ${
                      proxyMode
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    {proxyMode ? "Proxy / Flexible Mode ON" : "Take Other Teacher's / Proxy Class"}
                  </button>

                  <button
                    onClick={handleBulkSubmit}
                    disabled={submitting || classStudents.length === 0 || !activeSubjectName}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm"
                  >
                    {submitting ? "Saving..." : `Submit Attendance (${classStudents.length})`}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Roll Number</th>
                    <th className="py-3 px-4 font-semibold">Branch & Sem</th>
                    <th className="py-3 px-4 font-semibold">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classStudents.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-medium text-slate-900">{s.name}</td>
                      <td className="py-3 px-4 text-slate-600">{s.rollNumber || s.email}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {s.department} • Sem {s.semester || 1}
                      </td>
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
                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No students enrolled in {department} Semester {semester}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CONFIGURE SUBJECTS & WEEKLY ROUTINE */}
        {activeTab === "routine" && (
          <div className="space-y-6">
            <form onSubmit={handleAddRoutineSlot} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Add Subject to {department} — Semester {semester} ({dayOfWeek})
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Subject Name (e.g. Data Structures)"
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  required
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  placeholder="Time Slot (e.g. 10:00 AM - 11:00 AM)"
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  disabled={addingSlot}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  {addingSlot ? "Saving..." : "Add to Timetable"}
                </button>
              </div>
            </form>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 text-sm">
                Configured Timetable — {department} (Semester {semester})
              </div>
              <div className="divide-y divide-slate-200">
                {routineSlots
                  .filter((r) => r.department === department && r.semester === semester)
                  .map((slot) => (
                    <div key={slot._id} className="p-4 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-bold text-slate-900">{slot.subject}</span>
                        <span className="ml-2 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                          {slot.dayOfWeek}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{slot.timeSlot}</span>
                    </div>
                  ))}
                {routineSlots.filter((r) => r.department === department && r.semester === semester).length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-400">
                    No routine subjects configured yet for {department} Semester {semester}. Add subjects above!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MARKS ENTRY */}
        {activeTab === "marks" && (
          <form onSubmit={handleAddMarks} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Upload Assessment Marks ({department} • Sem {semester})
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              >
                {(classStudents.length > 0 ? classStudents : students).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.rollNumber || s.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              {allSemesterSubjects.length > 0 ? (
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  {allSemesterSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter subject name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              )}
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

        {/* TAB 4: STUDENT ATTENDANCE CORRECTION REQUESTS */}
        {activeTab === "corrections" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900">
              Student Attendance Correction Requests ({corrections.length})
            </div>
            <div className="divide-y divide-slate-200">
              {corrections.map((c) => (
                <div key={c._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {c.studentId?.name || "Student"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        Roll: {c.studentId?.rollNumber || "N/A"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {c.studentId?.department} • Sem {c.studentId?.semester || 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">
                      Subject: <strong>{c.subject}</strong> • Date:{" "}
                      <strong>{new Date(c.date).toLocaleDateString("en-IN")}</strong> • Marked:{" "}
                      <span className="text-red-600 font-semibold">{c.currentStatus}</span> → Requested:{" "}
                      <span className="text-emerald-600 font-semibold">Present</span>
                    </p>
                    <p className="text-xs text-slate-500">Reason: "{c.reason}"</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.status === "Pending" ? (
                      <>
                        <button
                          onClick={() => handleCorrectionDecision(c._id, "Approved")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve (Mark Present)
                        </button>
                        <button
                          onClick={() => handleCorrectionDecision(c._id, "Rejected")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          c.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {corrections.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-400">
                  No attendance correction requests submitted by students yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

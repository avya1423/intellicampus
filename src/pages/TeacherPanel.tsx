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
  Search,
  History,
  Megaphone,
  Trash2,
  ExternalLink,
  UserCheck,
  Eye,
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
  const [activeTab, setActiveTab] = useState<
    "attendance" | "history" | "routine" | "marks" | "notices" | "corrections"
  >("attendance");

  const [students, setStudents] = useState<any[]>([]);
  const [riskList, setRiskList] = useState<any[]>([]);
  const [routineSlots, setRoutineSlots] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  // Branch, Semester, Date & Day Sync
  const [department, setDepartment] = useState<string>(user?.department || "Computer Science");
  const [semester, setSemester] = useState<number>(1);
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const getDayFromDateStr = (dateString: string): string => {
    const d = new Date(dateString + "T00:00:00");
    const idx = d.getDay(); // 0=Sun, 1=Mon...
    return idx >= 1 && idx <= 6 ? DAYS[idx - 1] : "Monday";
  };

  const [dayOfWeek, setDayOfWeek] = useState<string>(getDayFromDateStr(todayStr));

  // Flexible / Proxy Mode
  const [proxyMode, setProxyMode] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");

  // Student Search & Bulk Attendance
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<Record<string, "Present" | "Absent" | "Late">>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  // 360 Student Dossier Modal
  const [inspectedStudent, setInspectedStudent] = useState<any | null>(null);

  // Routine Creator
  const [newSubName, setNewSubName] = useState<string>("");
  const [newTimeSlot, setNewTimeSlot] = useState<string>("10:00 AM - 11:00 AM");
  const [addingSlot, setAddingSlot] = useState<boolean>(false);

  // Batch Marks Entry Grid
  const [examType, setExamType] = useState<string>("Midterm");
  const [batchScores, setBatchScores] = useState<Record<string, string>>({});
  const [savingMarks, setSavingMarks] = useState<boolean>(false);

  // Class Announcements & Study Material
  const [noticeTitle, setNoticeTitle] = useState<string>("");
  const [noticeMsg, setNoticeMsg] = useState<string>("");
  const [resourceLink, setResourceLink] = useState<string>("");
  const [postingNotice, setPostingNotice] = useState<boolean>(false);

  // Register History Filters
  const [historySubjectFilter, setHistorySubjectFilter] = useState<string>("All");
  const [historyDateFilter, setHistoryDateFilter] = useState<string>("");

  const loadAll = () => {
    api.get("/users/students").then((res) => {
      setStudents(res.data);
      const initial: Record<string, "Present" | "Absent" | "Late"> = {};
      res.data.forEach((s: any) => {
        initial[s._id] = "Present";
      });
      setBulkStatus(initial);
    });
    api.get("/risk/all").then((res) => setRiskList(res.data.students || [])).catch(console.error);
    api.get("/routine").then((res) => setRoutineSlots(res.data)).catch(console.error);
    api.get("/corrections/teacher").then((res) => setCorrections(res.data)).catch(console.error);
    api.get("/attendance/all").then((res) => setAttendanceLogs(res.data)).catch(console.error);
    api.get("/notices").then((res) => setNotices(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (newDate) {
      setDayOfWeek(getDayFromDateStr(newDate));
    }
  };

  const todayScheduledSlots = routineSlots.filter(
    (r) => r.department === department && r.semester === semester && r.dayOfWeek === dayOfWeek
  );

  const allSemesterSubjects = Array.from(
    new Set(
      routineSlots
        .filter((r) => r.department === department && r.semester === semester)
        .map((r) => r.subject)
    )
  );

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

  const classStudents = students.filter(
    (s) =>
      s.department === department &&
      (s.semester || 1) === semester &&
      (s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.rollNumber || "").toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const activeSubjectName =
    selectedSubject === "__custom__" ? customSubject.trim() : selectedSubject;

  const markAllAs = (status: "Present" | "Absent") => {
    const updated = { ...bulkStatus };
    classStudents.forEach((s) => {
      updated[s._id] = status;
    });
    setBulkStatus(updated);
  };

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
            date: selectedDate,
          })
        )
      );
      setMsg(
        `Attendance saved for ${classStudents.length} students on ${selectedDate} in ${subjectLabel}!`
      );
      api.get("/attendance/all").then((res) => setAttendanceLogs(res.data));
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

  const handleDeleteRoutineSlot = async (id: string) => {
    await api.delete(`/routine/${id}`);
    loadAll();
  };

  const handleBatchMarksSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const markSub = activeSubjectName || customSubject.trim();
    if (!markSub) {
      setMsg("Please select or enter a subject for marks entry.");
      return;
    }
    const entries = classStudents.filter(
      (s) => batchScores[s._id] !== undefined && batchScores[s._id].trim() !== ""
    );
    if (entries.length === 0) {
      setMsg("Enter marks for at least one student before saving.");
      return;
    }
    setSavingMarks(true);
    setMsg("");
    try {
      await Promise.all(
        entries.map((s) =>
          api.post("/marks/add", {
            studentId: s._id,
            subject: markSub,
            examType,
            score: Number(batchScores[s._id]),
          })
        )
      );
      setBatchScores({});
      setMsg(`Recorded ${examType} marks for ${entries.length} students in ${markSub}!`);
      loadAll();
    } finally {
      setSavingMarks(false);
    }
  };

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMsg.trim()) return;
    setPostingNotice(true);
    try {
      await api.post("/notices", {
        title: noticeTitle.trim(),
        message: noticeMsg.trim(),
        department,
        semester,
        resourceLink: resourceLink.trim() || undefined,
        postedBy: user?.name || "Faculty",
      });
      setNoticeTitle("");
      setNoticeMsg("");
      setResourceLink("");
      setMsg(`Notice published to ${department} Semester ${semester} students!`);
      loadAll();
    } finally {
      setPostingNotice(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    await api.delete(`/notices/${id}`);
    loadAll();
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

  const openStudentDossier = (studentId: string) => {
    const found = riskList.find((r) => r.student?._id === studentId);
    if (found) {
      setInspectedStudent(found);
    } else {
      const basic = students.find((s) => s._id === studentId);
      if (basic) {
        setInspectedStudent({
          student: basic,
          attendancePct: 0,
          avgMarksPct: 0,
          latestGpa: 0,
          riskLevel: "Low",
          riskScore: 0,
          factors: ["No records logged yet"],
        });
      }
    }
  };

  const pendingCorrections = corrections.filter((c) => c.status === "Pending");

  const uniqueHistorySubjects = [
    "All",
    ...Array.from(new Set(attendanceLogs.map((l) => l.subject))),
  ];

  const filteredHistory = attendanceLogs.filter((log) => {
    const matchSub = historySubjectFilter === "All" || log.subject === historySubjectFilter;
    const logDate = new Date(log.date).toISOString().split("T")[0];
    const matchDate = !historyDateFilter || logDate === historyDateFilter;
    return matchSub && matchDate;
  });

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* 360 Student Academic Dossier Modal */}
        {inspectedStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    360° Student Dossier
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1.5">
                    {inspectedStudent.student?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Roll: {inspectedStudent.student?.rollNumber || "N/A"} •{" "}
                    {inspectedStudent.student?.department} • Sem{" "}
                    {inspectedStudent.student?.semester || 1}
                  </p>
                </div>
                <button
                  onClick={() => setInspectedStudent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Attendance</p>
                  <p className="text-lg font-extrabold text-blue-600 mt-0.5">
                    {inspectedStudent.attendancePct}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Avg Marks</p>
                  <p className="text-lg font-extrabold text-emerald-600 mt-0.5">
                    {inspectedStudent.avgMarksPct}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Risk Score</p>
                  <p className="text-lg font-extrabold text-amber-600 mt-0.5">
                    {inspectedStudent.riskScore}/100
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Academic Risk Indicators:</p>
                <p>{inspectedStudent.factors?.join(" • ") || "Normal academic standing"}</p>
              </div>

              <button
                onClick={() => setInspectedStudent(null)}
                className="w-full py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}

        {/* Header & Multi-Module Navigation Tabs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Faculty Classroom & Academic Hub</h1>
            <p className="text-sm text-slate-500 mt-1">
              Flexible routine attendance, backdated registers, batch marks entry, study announcements & correction approvals
            </p>
          </div>

          <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 w-fit">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "attendance" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Take Attendance
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-4 h-4" /> Register Logs
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
              <Award className="w-4 h-4" /> Batch Marks
            </button>
            <button
              onClick={() => setActiveTab("notices")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "notices" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Megaphone className="w-4 h-4" /> Class Notices
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

        {/* Shared Branch / Semester / Date / Day Selector Bar */}
        {activeTab !== "corrections" && activeTab !== "history" && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Class Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Timetable Day</label>
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

        {/* TAB 1: FLEXIBLE ROUTINE & BACKDATED BULK ATTENDANCE */}
        {activeTab === "attendance" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
                <div className="flex flex-wrap items-end gap-3">
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
                    {submitting ? "Saving..." : `Save Register (${classStudents.length})`}
                  </button>
                </div>
              </div>

              {/* Quick Bulk Controls & Student Filter */}
              <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Filter by name or roll no..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Quick Mark:</span>
                  <button
                    type="button"
                    onClick={() => markAllAs("Present")}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => markAllAs("Absent")}
                    className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100"
                  >
                    All Absent
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Student (Click for 360° Profile)</th>
                    <th className="py-3 px-4 font-semibold">Roll Number</th>
                    <th className="py-3 px-4 font-semibold">Attendance Status ({selectedDate})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classStudents.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openStudentDossier(s._id)}
                          className="font-semibold text-slate-900 hover:text-blue-600 inline-flex items-center gap-1.5 text-left"
                        >
                          {s.name} <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </td>
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
                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        No students found in {department} Semester {semester}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE REGISTER AUDIT LOGS */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="font-bold text-slate-900 text-sm">
                Recent Attendance Register Logs ({filteredHistory.length})
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <select
                  value={historySubjectFilter}
                  onChange={(e) => setHistorySubjectFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  {uniqueHistorySubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub === "All" ? "All Subjects" : sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Student</th>
                    <th className="py-3 px-4 font-semibold">Subject</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredHistory.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(log.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {log.studentId?.name || "Student"}{" "}
                        <span className="text-xs text-slate-500">
                          ({log.studentId?.rollNumber || "N/A"})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{log.subject}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            log.status === "Present"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : log.status === "Late"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No attendance logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIGURE SUBJECTS & WEEKLY ROUTINE */}
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
                        <span className="ml-3 text-xs text-slate-500">{slot.timeSlot}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteRoutineSlot(slot._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                {routineSlots.filter((r) => r.department === department && r.semester === semester).length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-400">
                    No routine subjects configured yet for {department} Semester {semester}.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BATCH MARKS ENTRY GRID */}
        {activeTab === "marks" && (
          <form onSubmit={handleBatchMarksSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                  {allSemesterSubjects.length > 0 ? (
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm min-w-[200px]"
                    >
                      {allSemesterSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                      <option value="__custom__">+ Custom Subject...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Enter subject name"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    />
                  )}
                </div>

                {selectedSubject === "__custom__" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Custom Subject</label>
                    <input
                      type="text"
                      required
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="e.g. DBMS"
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Exam Type</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="Midterm">Midterm</option>
                    <option value="Final">Final</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Assignment">Assignment</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingMarks || classStudents.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                {savingMarks ? "Saving Marks..." : "Save Batch Marks"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Roll Number</th>
                    <th className="py-3 px-4 font-semibold">Score (out of 100)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classStudents.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-medium text-slate-900">{s.name}</td>
                      <td className="py-3 px-4 text-slate-600">{s.rollNumber || s.email}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={batchScores[s._id] || ""}
                          onChange={(e) =>
                            setBatchScores((prev) => ({ ...prev, [s._id]: e.target.value }))
                          }
                          placeholder="Leave blank to skip"
                          className="w-40 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        No students enrolled in {department} Semester {semester}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </form>
        )}

        {/* TAB 5: CLASS ANNOUNCEMENTS & STUDY MATERIAL BROADCAST */}
        {activeTab === "notices" && (
          <div className="space-y-6">
            <form onSubmit={handlePostNotice} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Broadcast Notice / Study Material to {department} (Semester {semester})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="Title (e.g. Unit 3 Lecture Notes & Assignment)"
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <input
                  type="url"
                  value={resourceLink}
                  onChange={(e) => setResourceLink(e.target.value)}
                  placeholder="Optional Study Material Link (Google Drive / PDF URL)"
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <textarea
                rows={2}
                required
                value={noticeMsg}
                onChange={(e) => setNoticeMsg(e.target.value)}
                placeholder="Write instructions, syllabus details, or submission deadlines..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={postingNotice}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                {postingNotice ? "Publishing..." : "Publish to Class Dashboard"}
              </button>
            </form>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 text-sm">
                Published Notices ({notices.length})
              </div>
              <div className="divide-y divide-slate-200">
                {notices.map((n) => (
                  <div key={n._id} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                          {n.department} • Sem {n.semester}
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
                          <ExternalLink className="w-3.5 h-3.5" /> Open Study Resource
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteNotice(n._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {notices.length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-400">No class notices published yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: STUDENT ATTENDANCE CORRECTION REQUESTS */}
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
                      <button
                        type="button"
                        onClick={() => c.studentId?._id && openStudentDossier(c.studentId._id)}
                        className="font-bold text-slate-900 hover:text-blue-600 text-sm inline-flex items-center gap-1"
                      >
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        {c.studentId?.name || "Student"}
                      </button>
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

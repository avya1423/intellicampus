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
  Save,
  Upload,
  HeartPulse,
  Copy,
  Download,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
];
const PERIOD_PRESETS = [
  "Period 1 (09:00 - 10:00)",
  "Period 2 (10:00 - 11:00)",
  "Period 3 (11:15 - 12:15)",
  "Period 4 (01:00 - 02:00)",
  "Period 5 (02:00 - 03:00)",
  "Period 6 (03:00 - 04:00)",
];

interface DraftSlot {
  dayOfWeek: string;
  timeSlot: string;
  subject: string;
}

export const TeacherPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | "attendance"
    | "routine"
    | "assignments"
    | "leaves"
    | "marks"
    | "notices"
    | "corrections"
    | "history"
  >("attendance");

  const [students, setStudents] = useState<any[]>([]);
  const [riskList, setRiskList] = useState<any[]>([]);
  const [routineSlots, setRoutineSlots] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  // Shared Branch, Semester, Date & Day Sync
  const [department, setDepartment] = useState<string>(user?.department || "Computer Science");
  const [semester, setSemester] = useState<number>(1);
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const getDayFromDateStr = (dateString: string): string => {
    const d = new Date(dateString + "T00:00:00");
    const idx = d.getDay();
    return idx >= 1 && idx <= 6 ? DAYS[idx - 1] : "Monday";
  };

  const [dayOfWeek, setDayOfWeek] = useState<string>(getDayFromDateStr(todayStr));

  // Attendance Slot & Proxy Mode
  const [proxyMode, setProxyMode] = useState<boolean>(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [proxySubject, setProxySubject] = useState<string>("");
  const [customSubject, setCustomSubject] = useState<string>("");

  // Master Weekly Routine Builder State
  const [subjectPool, setSubjectPool] = useState<string[]>([]);
  const [newPoolSubject, setNewPoolSubject] = useState<string>("");
  const [weeklyDraft, setWeeklyDraft] = useState<DraftSlot[]>([]);
  const [savingRoutine, setSavingRoutine] = useState<boolean>(false);

  // Student Search, Defaulter Filter & Bulk Attendance
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [onlyDefaulters, setOnlyDefaulters] = useState<boolean>(false);
  const [bulkStatus, setBulkStatus] = useState<Record<string, "Present" | "Absent" | "Late">>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  // 360 Student Dossier Modal
  const [inspectedStudent, setInspectedStudent] = useState<any | null>(null);

  // Batch Marks Entry Grid
  const [marksSubject, setMarksSubject] = useState<string>("");
  const [examType, setExamType] = useState<string>("Midterm");
  const [batchScores, setBatchScores] = useState<Record<string, string>>({});
  const [savingMarks, setSavingMarks] = useState<boolean>(false);

  // Class Announcements & Study Material
  const [noticeTitle, setNoticeTitle] = useState<string>("");
  const [noticeMsg, setNoticeMsg] = useState<string>("");
  const [resourceLink, setResourceLink] = useState<string>("");
  const [postingNotice, setPostingNotice] = useState<boolean>(false);

  // Assignments & Lab Submissions State
  const [assignTitle, setAssignTitle] = useState<string>("");
  const [assignSubject, setAssignSubject] = useState<string>("");
  const [assignType, setAssignType] = useState<"Assignment" | "Lab Record" | "Mini Project">(
    "Assignment"
  );
  const [assignDueDate, setAssignDueDate] = useState<string>("");
  const [assignInstructions, setAssignInstructions] = useState<string>("");
  const [creatingAssign, setCreatingAssign] = useState<boolean>(false);
  const [expandedAssignId, setExpandedAssignId] = useState<string | null>(null);
  const [quickGradeMap, setQuickGradeMap] = useState<Record<string, string>>({});

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
    api.get("/assignments").then((res) => setAssignments(res.data)).catch(console.error);
    api.get("/leaves/all").then((res) => setLeaves(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Sync Master Weekly Draft whenever Branch, Semester, or saved routineSlots change
  useEffect(() => {
    const existing = routineSlots.filter(
      (r) => r.department === department && r.semester === semester
    );
    setWeeklyDraft(
      existing.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        timeSlot: r.timeSlot,
        subject: r.subject,
      }))
    );
    const uniqueSubs: string[] = Array.from(new Set(existing.map((r: any) => String(r.subject))));
    setSubjectPool(uniqueSubs);
    if (uniqueSubs.length > 0) {
      setMarksSubject(uniqueSubs[0]);
      setProxySubject(uniqueSubs[0]);
      setAssignSubject(uniqueSubs[0]);
    } else {
      setMarksSubject("__custom__");
      setProxySubject("__custom__");
      setAssignSubject("__custom__");
    }
  }, [department, semester, routineSlots]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (newDate) {
      setDayOfWeek(getDayFromDateStr(newDate));
    }
  };

  const todayScheduledSlots = routineSlots.filter(
    (r) => r.department === department && r.semester === semester && r.dayOfWeek === dayOfWeek
  );

  const allSemesterSubjects: string[] = Array.from(
    new Set(
      routineSlots
        .filter((r) => r.department === department && r.semester === semester)
        .map((r: any) => String(r.subject))
    )
  );

  useEffect(() => {
    if (!proxyMode) {
      if (todayScheduledSlots.length > 0) {
        setSelectedSlotId(todayScheduledSlots[0]._id);
      } else {
        setSelectedSlotId("");
      }
    }
  }, [department, semester, dayOfWeek, proxyMode, routineSlots]);

  // Helper: Get live attendance percentage of a student from riskList
  const getStudentAttendancePct = (studentId: string): number | null => {
    const found = riskList.find((r) => r.student?._id === studentId);
    return found ? found.attendancePct : null;
  };

  // Helper: Check if a student has an Approved Medical/Duty Leave on selectedDate
  const getApprovedLeaveForDate = (studentId: string, dateStr: string) => {
    const target = new Date(dateStr + "T12:00:00").getTime();
    return leaves.find((lv) => {
      if (lv.status !== "Approved") return false;
      const lvStuId = lv.studentId?._id || lv.studentId;
      if (lvStuId !== studentId) return false;
      const start = new Date(lv.fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(lv.toDate);
      end.setHours(23, 59, 59, 999);
      return target >= start.getTime() && target <= end.getTime();
    });
  };

  // Master Weekly Routine Builder Helpers
  const addSubjectToPool = () => {
    const trimmed = newPoolSubject.trim();
    if (!trimmed) return;
    if (!subjectPool.includes(trimmed)) {
      setSubjectPool((prev) => [...prev, trimmed]);
    }
    setNewPoolSubject("");
  };

  const addPeriodToDay = (day: string) => {
    const daySlots = weeklyDraft.filter((s) => s.dayOfWeek === day);
    const nextPreset = PERIOD_PRESETS[daySlots.length] || `Period ${daySlots.length + 1}`;
    setWeeklyDraft((prev) => [
      ...prev,
      {
        dayOfWeek: day,
        timeSlot: nextPreset,
        subject: subjectPool[0] || "",
      },
    ]);
  };

  const copyPreviousDayTo = (targetDayIndex: number) => {
    if (targetDayIndex <= 0) return;
    const prevDay = DAYS[targetDayIndex - 1];
    const targetDay = DAYS[targetDayIndex];
    const prevSlots = weeklyDraft.filter((s) => s.dayOfWeek === prevDay);
    const withoutTarget = weeklyDraft.filter((s) => s.dayOfWeek !== targetDay);
    const copied = prevSlots.map((s) => ({
      dayOfWeek: targetDay,
      timeSlot: s.timeSlot,
      subject: s.subject,
    }));
    setWeeklyDraft([...withoutTarget, ...copied]);
  };

  const updateDraftSlot = (
    day: string,
    indexInDay: number,
    field: "timeSlot" | "subject",
    value: string
  ) => {
    let counter = -1;
    setWeeklyDraft((prev) =>
      prev.map((slot) => {
        if (slot.dayOfWeek === day) {
          counter += 1;
          if (counter === indexInDay) {
            return { ...slot, [field]: value };
          }
        }
        return slot;
      })
    );
  };

  const removeDraftSlot = (day: string, indexInDay: number) => {
    let counter = -1;
    setWeeklyDraft((prev) =>
      prev.filter((slot) => {
        if (slot.dayOfWeek === day) {
          counter += 1;
          return counter !== indexInDay;
        }
        return true;
      })
    );
  };

  const handleSaveWeeklyMaster = async () => {
    setSavingRoutine(true);
    setMsg("");
    try {
      await api.post("/routine/bulk", {
        department,
        semester,
        slots: weeklyDraft.map((s) => ({
          ...s,
          teacherName: user?.name,
        })),
      });
      setMsg(
        `Master Weekly Timetable saved for ${department} Semester ${semester}! It repeats automatically every week.`
      );
      loadAll();
    } catch {
      setMsg("Failed to save weekly timetable.");
    } finally {
      setSavingRoutine(false);
    }
  };

  const classStudents = students.filter((s) => {
    const matchesClass = s.department === department && (s.semester || 1) === semester;
    const matchesSearch =
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.rollNumber || "").toLowerCase().includes(studentSearch.toLowerCase());
    if (!matchesClass || !matchesSearch) return false;
    if (onlyDefaulters) {
      const pct = getStudentAttendancePct(s._id);
      return pct !== null && pct < 75;
    }
    return true;
  });

  const selectedRoutineObj = todayScheduledSlots.find((s) => s._id === selectedSlotId);
  const activeSubjectName = proxyMode
    ? proxySubject === "__custom__"
      ? customSubject.trim()
      : proxySubject
    : selectedRoutineObj?.subject || "";

  const activeTimeSlot = proxyMode
    ? "Proxy / Extra Session"
    : selectedRoutineObj?.timeSlot || "";

  const markAllAs = (status: "Present" | "Absent") => {
    const updated = { ...bulkStatus };
    classStudents.forEach((s) => {
      updated[s._id] = status;
    });
    setBulkStatus(updated);
  };

  const markLeaveStudentsPresent = () => {
    const updated = { ...bulkStatus };
    let count = 0;
    classStudents.forEach((s) => {
      if (getApprovedLeaveForDate(s._id, selectedDate)) {
        updated[s._id] = "Present";
        count += 1;
      }
    });
    setBulkStatus(updated);
    setMsg(
      count > 0
        ? `Marked ${count} student(s) on Approved Leave as Present!`
        : "No students in this class have an approved leave on this date."
    );
  };

  const handleBulkSubmit = async () => {
    if (!activeSubjectName) {
      setMsg("Please select or enter a subject first.");
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
            timeSlot: activeTimeSlot,
            status: bulkStatus[s._id] || "Present",
            date: selectedDate,
          })
        )
      );
      setMsg(
        `Attendance saved for ${classStudents.length} students on ${selectedDate} in ${subjectLabel} (${activeTimeSlot})!`
      );
      api.get("/attendance/all").then((res) => setAttendanceLogs(res.data));
      api.get("/risk/all").then((res) => setRiskList(res.data.students || []));
    } catch {
      setMsg("Failed to record attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Assignments Create, Delete & Quick Grade Submission
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSub = assignSubject === "__custom__" ? customSubject.trim() : assignSubject;
    if (!assignTitle.trim() || !finalSub || !assignDueDate) return;
    setCreatingAssign(true);
    setMsg("");
    try {
      await api.post("/assignments", {
        title: assignTitle.trim(),
        subject: finalSub,
        department,
        semester,
        type: assignType,
        dueDate: assignDueDate,
        instructions: assignInstructions.trim() || undefined,
        createdBy: user?.name || "Faculty",
      });
      setAssignTitle("");
      setAssignInstructions("");
      setMsg(`${assignType} "${assignTitle}" published to ${department} Semester ${semester}!`);
      loadAll();
    } finally {
      setCreatingAssign(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    await api.delete(`/assignments/${id}`);
    loadAll();
  };

  const handleQuickGradeSubmission = async (
    studentId: string,
    studentName: string,
    subject: string,
    key: string
  ) => {
    const scoreVal = quickGradeMap[key];
    if (!scoreVal || scoreVal.trim() === "") return;
    await api.post("/marks/add", {
      studentId,
      subject,
      examType: "Assignment",
      score: Number(scoreVal),
    });
    setQuickGradeMap((prev) => ({ ...prev, [key]: "" }));
    setMsg(`Saved Assignment score (${scoreVal}/100) for ${studentName} in ${subject}!`);
  };

  // Leave Approval Handler
  const handleLeaveDecision = async (id: string, status: "Approved" | "Rejected") => {
    await api.patch(`/leaves/${id}`, {
      status,
      reviewedBy: user?.name || "Faculty",
    });
    setMsg(`Student leave application ${status.toLowerCase()}!`);
    loadAll();
  };

  const handleBatchMarksSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const markSub = marksSubject === "__custom__" ? customSubject.trim() : marksSubject;
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
  const pendingLeaves = leaves.filter((l) => l.status === "Pending");

  const uniqueHistorySubjects: string[] = [
    "All",
    ...Array.from(new Set(attendanceLogs.map((l: any) => String(l.subject)))),
  ];

  const filteredHistory = attendanceLogs.filter((log) => {
    const matchSub = historySubjectFilter === "All" || log.subject === historySubjectFilter;
    const logDate = new Date(log.date).toISOString().split("T")[0];
    const matchDate = !historyDateFilter || logDate === historyDateFilter;
    return matchSub && matchDate;
  });

  const exportHistoryCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ["Date", "Student Name", "Roll Number", "Subject", "Period", "Status"];
    const rows = filteredHistory.map((l) => [
      new Date(l.date).toLocaleDateString("en-IN"),
      `"${l.studentId?.name || "Student"}"`,
      l.studentId?.rollNumber || "N/A",
      `"${l.subject}"`,
      `"${l.timeSlot || "-"}"`,
      l.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_register_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* 360 Student Academic Dossier Modal */}
        {inspectedStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
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
              Leave-aware attendance, weekly timetable, assignment submissions, leave approvals, batch marks & notices
            </p>
          </div>

          <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 w-fit">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "attendance" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Take Attendance
            </button>
            <button
              onClick={() => setActiveTab("routine")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "routine" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarClock className="w-4 h-4" /> Weekly Routine
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "assignments" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Upload className="w-4 h-4" /> Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab("leaves")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "leaves" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <HeartPulse className="w-4 h-4" /> Leaves
              {pendingLeaves.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px]">
                  {pendingLeaves.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("corrections")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
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
            <button
              onClick={() => setActiveTab("marks")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "marks" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="w-4 h-4" /> Batch Marks
            </button>
            <button
              onClick={() => setActiveTab("notices")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "notices" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Megaphone className="w-4 h-4" /> Class Notices
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-4 h-4" /> Register Logs
            </button>
          </div>
        </div>

        {msg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> {msg}
          </div>
        )}

        {/* Shared Branch / Semester / Date Selector Bar */}
        {activeTab !== "corrections" && activeTab !== "history" && activeTab !== "leaves" && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Branch / Department
              </label>
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
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Semester
              </label>
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
            {activeTab === "attendance" && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Class Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Auto-Synced Day
                  </label>
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
              </>
            )}
          </div>
        )}

        {/* TAB 1: LEAVE-AWARE ROUTINE & PERIOD-WISE BULK ATTENDANCE */}
        {activeTab === "attendance" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {proxyMode
                        ? `All Subjects (${department} Sem ${semester})`
                        : `Scheduled Classes on ${dayOfWeek} (${department} Sem ${semester})`}
                    </label>
                    {!proxyMode ? (
                      <select
                        value={selectedSlotId}
                        onChange={(e) => setSelectedSlotId(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm min-w-[280px]"
                      >
                        {todayScheduledSlots.length > 0 ? (
                          todayScheduledSlots.map((slot) => (
                            <option key={slot._id} value={slot._id}>
                              {slot.subject} — {slot.timeSlot}
                            </option>
                          ))
                        ) : (
                          <option value="">No class scheduled on {dayOfWeek} (Free Day)</option>
                        )}
                      </select>
                    ) : (
                      <select
                        value={proxySubject}
                        onChange={(e) => setProxySubject(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm min-w-[260px]"
                      >
                        {allSemesterSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                        <option value="__custom__">+ Enter Other / Custom Subject...</option>
                      </select>
                    )}
                  </div>

                  {proxyMode && proxySubject === "__custom__" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Custom Subject Name
                      </label>
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
                        setProxySubject("__custom__");
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

              {/* Quick Bulk Controls, Leave Sync & Defaulter Filter */}
              <div className="pt-3 border-t border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-60">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Filter by name or roll no..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyDefaulters}
                      onChange={(e) => setOnlyDefaulters(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    Only &lt;75% Attendance Students
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                  <button
                    type="button"
                    onClick={markLeaveStudentsPresent}
                    className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100"
                  >
                    Sync Approved Leaves
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
                    <th className="py-3 px-4 font-semibold">Overall % & Leave Status</th>
                    <th className="py-3 px-4 font-semibold">Attendance Status ({selectedDate})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classStudents.map((s) => {
                    const attPct = getStudentAttendancePct(s._id);
                    const approvedLeave = getApprovedLeaveForDate(s._id, selectedDate);
                    return (
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            {attPct !== null ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  attPct < 75
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {attPct}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">New</span>
                            )}
                            {approvedLeave && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                title={approvedLeave.reason}
                              >
                                On {approvedLeave.leaveType}
                              </span>
                            )}
                          </div>
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
                    );
                  })}
                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No matching students found in {department} Semester {semester}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ONE-TIME MASTER WEEKLY TIMETABLE BUILDER */}
        {activeTab === "routine" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Master Weekly Timetable — {department} (Semester {semester})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set Monday–Saturday periods once and click Save. Repeats automatically every week!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveWeeklyMaster}
                  disabled={savingRoutine}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm w-fit"
                >
                  <Save className="w-4 h-4" />
                  {savingRoutine ? "Saving Timetable..." : "Save Master Weekly Routine"}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-500">
                  Step 1: Add Semester Subjects Once (Then Assign to Any Day/Period Below)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newPoolSubject}
                    onChange={(e) => setNewPoolSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubjectToPool();
                      }
                    }}
                    placeholder="Type subject name (e.g. Data Structures, DBMS)..."
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm w-72"
                  />
                  <button
                    type="button"
                    onClick={addSubjectToPool}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Subject
                  </button>
                </div>

                {subjectPool.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {subjectPool.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold"
                      >
                        {sub}
                        <button
                          type="button"
                          onClick={() =>
                            setSubjectPool((prev) => prev.filter((item) => item !== sub))
                          }
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAYS.map((day, dayIdx) => {
                const daySlots = weeklyDraft.filter((s) => s.dayOfWeek === day);
                return (
                  <div
                    key={day}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{day}</span>
                        {dayIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => copyPreviousDayTo(dayIdx)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                            title={`Copy ${DAYS[dayIdx - 1]}'s schedule`}
                          >
                            <Copy className="w-3 h-3" /> Copy {DAYS[dayIdx - 1].slice(0, 3)}
                          </button>
                        )}
                      </div>

                      <div className="p-3 space-y-2.5">
                        {daySlots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <input
                                type="text"
                                value={slot.timeSlot}
                                onChange={(e) =>
                                  updateDraftSlot(day, idx, "timeSlot", e.target.value)
                                }
                                placeholder="e.g. Period 1 (10:00 - 11:00)"
                                className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700"
                              />
                              <button
                                type="button"
                                onClick={() => removeDraftSlot(day, idx)}
                                className="p-1 text-slate-400 hover:text-red-600"
                                title="Remove period"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {subjectPool.length > 0 ? (
                              <select
                                value={slot.subject}
                                onChange={(e) =>
                                  updateDraftSlot(day, idx, "subject", e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                              >
                                <option value="">-- Select Subject --</option>
                                {subjectPool.map((sub) => (
                                  <option key={sub} value={sub}>
                                    {sub}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={slot.subject}
                                onChange={(e) =>
                                  updateDraftSlot(day, idx, "subject", e.target.value)
                                }
                                placeholder="Enter subject name..."
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                              />
                            )}
                          </div>
                        ))}

                        {daySlots.length === 0 && (
                          <p className="py-6 text-center text-xs text-slate-400">
                            No periods scheduled on {day}.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => addPeriodToDay(day)}
                        className="w-full py-1.5 rounded-lg border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-xs font-semibold inline-flex items-center justify-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Period to {day}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ASSIGNMENTS & LAB SUBMISSION TRACKER + QUICK GRADING */}
        {activeTab === "assignments" && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateAssignment}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900">
                Publish Assignment / Lab Task to {department} (Semester {semester})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="Title (e.g. Lab 4: Binary Search Trees)"
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <select
                  value={assignSubject}
                  onChange={(e) => setAssignSubject(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  {allSemesterSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                  <option value="__custom__">+ Custom Subject...</option>
                </select>
                <select
                  value={assignType}
                  onChange={(e) => setAssignType(e.target.value as any)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  <option value="Assignment">Assignment</option>
                  <option value="Lab Record">Lab Record</option>
                  <option value="Mini Project">Mini Project</option>
                </select>
                <input
                  type="date"
                  required
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {assignSubject === "__custom__" && (
                <input
                  type="text"
                  required
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter Subject Name..."
                  className="w-full sm:w-72 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder="Instructions or submission guidelines (Google Drive PDF / GitHub repo link)..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  disabled={creatingAssign}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  {creatingAssign ? "Publishing..." : "Publish Task"}
                </button>
              </div>
            </form>

            {/* Active Assignments & Student Submissions */}
            <div className="space-y-4">
              {assignments.map((task) => {
                const subs = task.submissions || [];
                const isExpanded = expandedAssignId === task._id;
                return (
                  <div
                    key={task._id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{task.title}</span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                            {task.subject} • {task.type}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                            {task.department} Sem {task.semester}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Due: {new Date(task.dueDate).toLocaleDateString("en-IN")} •{" "}
                          <strong>{subs.length}</strong> Student Submission(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedAssignId(isExpanded ? null : task._id)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                        >
                          {isExpanded
                            ? "Hide Submissions"
                            : `View Submissions & Grade (${subs.length})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(task._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          title="Delete assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/60 p-4">
                        {subs.length > 0 ? (
                          <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200">
                            {subs.map((sub: any, idx: number) => {
                              const gradeKey = `${task._id}_${sub.studentId}`;
                              return (
                                <div
                                  key={idx}
                                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-slate-900 text-sm">
                                      {sub.studentName}{" "}
                                      <span className="text-xs font-normal text-slate-500">
                                        ({sub.rollNumber || "N/A"})
                                      </span>
                                    </p>
                                    {sub.remarks && (
                                      <p className="text-slate-600">Note: "{sub.remarks}"</p>
                                    )}
                                    <p className="text-slate-400">
                                      Submitted:{" "}
                                      {new Date(sub.submittedAt).toLocaleDateString("en-IN")}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <a
                                      href={sub.submissionLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" /> Open Work
                                    </a>
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={quickGradeMap[gradeKey] || ""}
                                      onChange={(e) =>
                                        setQuickGradeMap((prev) => ({
                                          ...prev,
                                          [gradeKey]: e.target.value,
                                        }))
                                      }
                                      placeholder="Score /100"
                                      className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuickGradeSubmission(
                                          sub.studentId,
                                          sub.studentName,
                                          task.subject,
                                          gradeKey
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    >
                                      Save Grade
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-center text-xs text-slate-400 py-4">
                            No student has submitted work for this task yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {assignments.length === 0 && (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  No assignments or lab records created yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STUDENT MEDICAL & DUTY LEAVE APPROVALS */}
        {activeTab === "leaves" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900">
              Student Medical & Duty Leave Applications ({leaves.length})
            </div>
            <div className="divide-y divide-slate-200">
              {leaves.map((lv) => (
                <div
                  key={lv._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => lv.studentId?._id && openStudentDossier(lv.studentId._id)}
                        className="font-bold text-slate-900 hover:text-blue-600 text-sm inline-flex items-center gap-1"
                      >
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        {lv.studentId?.name || "Student"}
                      </button>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        Roll: {lv.studentId?.rollNumber || "N/A"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                        {lv.leaveType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">
                      Dates:{" "}
                      <strong>
                        {new Date(lv.fromDate).toLocaleDateString("en-IN")} –{" "}
                        {new Date(lv.toDate).toLocaleDateString("en-IN")}
                      </strong>{" "}
                      • {lv.studentId?.department} Sem {lv.studentId?.semester || 1}
                    </p>
                    <p className="text-xs text-slate-500">Reason: "{lv.reason}"</p>
                    {lv.documentLink && (
                      <a
                        href={lv.documentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-0.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Medical / Event Proof
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {lv.status === "Pending" ? (
                      <>
                        <button
                          onClick={() => handleLeaveDecision(lv._id, "Approved")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve Leave
                        </button>
                        <button
                          onClick={() => handleLeaveDecision(lv._id, "Rejected")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          lv.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {lv.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {leaves.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-400">
                  No medical or duty leave applications submitted yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: STUDENT ATTENDANCE CORRECTION REQUESTS */}
        {activeTab === "corrections" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900">
              Student Attendance Correction Requests ({corrections.length})
            </div>
            <div className="divide-y divide-slate-200">
              {corrections.map((c) => (
                <div
                  key={c._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
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

        {/* TAB 6: BATCH MARKS ENTRY GRID */}
        {activeTab === "marks" && (
          <form
            onSubmit={handleBatchMarksSubmit}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                  <select
                    value={marksSubject}
                    onChange={(e) => setMarksSubject(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm min-w-[200px]"
                  >
                    {allSemesterSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom Subject...</option>
                  </select>
                </div>

                {marksSubject === "__custom__" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Custom Subject
                    </label>
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

        {/* TAB 7: CLASS ANNOUNCEMENTS & STUDY MATERIAL BROADCAST */}
        {activeTab === "notices" && (
          <div className="space-y-6">
            <form
              onSubmit={handlePostNotice}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900">
                Broadcast Notice / Study Material to {department} (Semester {semester})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="Title (e.g. Unit 3 Lecture Notes & Syllabus)"
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
                placeholder="Write instructions, syllabus details, or class updates..."
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
                  <p className="p-6 text-center text-xs text-slate-400">
                    No class notices published yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: ATTENDANCE REGISTER AUDIT LOGS + CSV EXPORT */}
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
                <button
                  type="button"
                  onClick={exportHistoryCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Student</th>
                    <th className="py-3 px-4 font-semibold">Subject & Period</th>
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
                      <td className="py-3 px-4 text-slate-700">
                        {log.subject}{" "}
                        {log.timeSlot && (
                          <span className="text-xs text-slate-400">({log.timeSlot})</span>
                        )}
                      </td>
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
      </div>
    </TeacherLayout>
  );
};

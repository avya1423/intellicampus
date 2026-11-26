import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "../components/layouts/StudentLayout";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import {
  Send,
  Bot,
  AlertCircle,
  CheckCircle2,
  Printer,
  BarChart3,
  Megaphone,
  ExternalLink,
  BookOpen,
  CalendarCheck,
  Target,
  Clock,
  CalendarDays,
  ArrowRight,
  UserCircle,
  Sparkles,
  Upload,
  Calculator,
  HeartPulse,
  Award,
  Radio,
  Ticket,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface SubjectSummary {
  subject: string;
  held: number;
  attended: number;
  missed: number;
  percentage: number;
  neededForTarget: number;
  canSkip: number;
}

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const ALL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const scoreToGradePoint = (totalPct: number): { grade: string; gp: number } => {
  if (totalPct >= 90) return { grade: "O", gp: 10 };
  if (totalPct >= 80) return { grade: "A+", gp: 9 };
  if (totalPct >= 70) return { grade: "A", gp: 8 };
  if (totalPct >= 60) return { grade: "B+", gp: 7 };
  if (totalPct >= 50) return { grade: "B", gp: 6 };
  if (totalPct >= 40) return { grade: "C", gp: 5 };
  return { grade: "F", gp: 0 };
};

export const StudentPanel: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<{
    totalClasses: number;
    percentage: number;
    records: any[];
  }>({
    totalClasses: 0,
    percentage: 0,
    records: [],
  });
  const [marksRecords, setMarksRecords] = useState<any[]>([]);
  const [routineSlots, setRoutineSlots] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  // Live Classroom OTP Check-in State
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [otpCode, setOtpCode] = useState<string>("");
  const [checkingIn, setCheckingIn] = useState<boolean>(false);
  const [otpFeedback, setOtpFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // 1. Attendance Target Goal (60%, 70%, 75%, 80%, 85%)
  const [targetPct, setTargetPct] = useState<number>(75);

  // 2. Full Weekly Timetable Day Selector
  const todayDayName = ALL_DAYS[new Date().getDay()];
  const defaultRoutineTab = todayDayName === "Sunday" ? "Monday" : todayDayName;
  const [selectedRoutineDay, setSelectedRoutineDay] = useState<string>(defaultRoutineTab);

  // 3. SGPA / CGPA Final Exam Simulator State
  const [prevCgpa, setPrevCgpa] = useState<string>("8.0");
  const [expectedEndSemMap, setExpectedEndSemMap] = useState<Record<string, number>>({});

  // 4. Assignment Submission Inline State
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);
  const [submissionLink, setSubmissionLink] = useState<string>("");
  const [submissionRemarks, setSubmissionRemarks] = useState<string>("");
  const [assignmentMsg, setAssignmentMsg] = useState<string>("");

  // 5. Medical & Duty Leave Application State
  const [showLeaveForm, setShowLeaveForm] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<
    "Medical Leave" | "Duty / Event Leave" | "Personal Leave"
  >("Medical Leave");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [leaveReason, setLeaveReason] = useState<string>("");
  const [leaveDocLink, setLeaveDocLink] = useState<string>("");
  const [applyingLeave, setApplyingLeave] = useState<boolean>(false);
  const [leaveFeedback, setLeaveFeedback] = useState<string>("");

  // 6. Gemini AI Advisor with 1-Click Action Prompts
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "ai"; text: string }[]>([
    {
      sender: "ai",
      text: "Hi! I'm your IntelliCampus AI Study Advisor. Click any smart prompt below or ask me about your attendance target, SGPA boost, or exam prep!",
    },
  ]);
  const [sending, setSending] = useState<boolean>(false);

  const loadStudentData = () => {
    api.get("/users/profile").then((res) => setProfile(res.data)).catch(console.error);
    api.get("/risk/my").then((res) => setRiskData(res.data)).catch(console.error);
    api.get("/attendance/my").then((res) => setAttendanceData(res.data)).catch(console.error);
    api.get("/marks/my").then((res) => setMarksRecords(res.data.records || [])).catch(console.error);
    api.get("/calendar").then((res) => setCalendarEvents(res.data)).catch(console.error);
    api.get("/leaves/my").then((res) => setLeaves(res.data)).catch(console.error);
    api.get("/sessions/active").then((res) => setActiveSessions(res.data || [])).catch(console.error);

    if (user?.department) {
      const dept = encodeURIComponent(user.department);
      const sem = user.semester || 1;
      api
        .get(`/routine?department=${dept}&semester=${sem}`)
        .then((res) => setRoutineSlots(res.data))
        .catch(console.error);
      api
        .get(`/notices?department=${dept}&semester=${sem}`)
        .then((res) => setNotices(res.data))
        .catch(console.error);
      api
        .get(`/assignments?department=${dept}&semester=${sem}`)
        .then((res) => setAssignments(res.data))
        .catch(console.error);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [user?.department, user?.semester]);

  // Live Classroom OTP Check-in Submit
  const handleOtpCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setCheckingIn(true);
    setOtpFeedback(null);
    try {
      const { data } = await api.post("/sessions/checkin", { code: otpCode.trim() });
      setOtpFeedback({ type: "success", text: data.message });
      setOtpCode("");
      loadStudentData();
    } catch (err: any) {
      setOtpFeedback({
        type: "error",
        text: err.response?.data?.message || "Invalid or expired classroom code.",
      });
    } finally {
      setCheckingIn(false);
    }
  };

  // Aggregate Held, Attended, Missed
  const totalHeld = attendanceData.totalClasses || 0;
  const totalAttended = attendanceData.records.filter(
    (r) => r.status === "Present" || r.status === "Late"
  ).length;
  const totalMissed = Math.max(0, totalHeld - totalAttended);
  const currentPct = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 0;
  const t = Math.min(99, Math.max(1, targetPct)) / 100;

  let overallTargetText =
    "No classes have been held yet this semester. Once faculty marks attendance, your target projection will appear here.";
  let isBelowTarget = false;
  let overallClassesNeeded = 0;

  if (totalHeld > 0) {
    if (currentPct < targetPct) {
      isBelowTarget = true;
      overallClassesNeeded = Math.ceil((t * totalHeld - totalAttended) / (1 - t));
      overallTargetText = `You need to attend ${overallClassesNeeded} more consecutive class${
        overallClassesNeeded > 1 ? "es" : ""
      } to reach your ${targetPct}% target.`;
    } else {
      const canSkip = Math.floor(totalAttended / t - totalHeld);
      overallTargetText =
        canSkip > 0
          ? `Target achieved! You are above ${targetPct}% and can safely miss up to ${canSkip} upcoming class${
              canSkip > 1 ? "es" : ""
            }.`
          : `You are right on the ${targetPct}% border. Attend the next class to stay above target.`;
    }
  }

  // Merge all Current Semester Subjects
  const allSubjectNamesSet = new Set<string>();
  routineSlots.forEach((s) => allSubjectNamesSet.add(s.subject));
  attendanceData.records.forEach((r) => allSubjectNamesSet.add(r.subject));
  marksRecords.forEach((m) => allSubjectNamesSet.add(m.subject));
  const semesterSubjects = Array.from(allSubjectNamesSet);

  // Subject-Wise Held vs Attended vs Target Breakdown
  const subjectBreakdown: SubjectSummary[] = semesterSubjects.map((sub) => {
    const subRecords = attendanceData.records.filter((r) => r.subject === sub);
    const held = subRecords.length;
    const attended = subRecords.filter((r) => r.status === "Present" || r.status === "Late").length;
    const missed = held - attended;
    const percentage = held > 0 ? Math.round((attended / held) * 100) : 0;

    let neededForTarget = 0;
    let canSkip = 0;
    if (held > 0) {
      if (percentage < targetPct) {
        neededForTarget = Math.ceil((t * held - attended) / (1 - t));
      } else {
        canSkip = Math.max(0, Math.floor(attended / t - held));
      }
    }

    return {
      subject: sub,
      held,
      attended,
      missed,
      percentage,
      neededForTarget,
      canSkip,
    };
  });

  // SGPA / CGPA Simulator Calculations (40% Internal Avg + 60% Expected End-Sem)
  const sgpaRows = semesterSubjects.map((sub) => {
    const subMarks = marksRecords.filter((m) => m.subject === sub);
    const internalAvg =
      subMarks.length > 0
        ? Math.round(
            subMarks.reduce(
              (acc: number, m: any) => acc + (m.score / (m.maxScore || 100)) * 100,
              0
            ) / subMarks.length
          )
        : 75;
    const expectedEndSem = expectedEndSemMap[sub] !== undefined ? expectedEndSemMap[sub] : 75;
    const projectedTotal = Math.round(internalAvg * 0.4 + expectedEndSem * 0.6);
    const { grade, gp } = scoreToGradePoint(projectedTotal);
    return {
      subject: sub,
      internalAvg,
      expectedEndSem,
      projectedTotal,
      grade,
      gp,
    };
  });

  const predictedSgpaNum =
    sgpaRows.length > 0 ? sgpaRows.reduce((sum, r) => sum + r.gp, 0) / sgpaRows.length : 0;
  const predictedSgpa = sgpaRows.length > 0 ? predictedSgpaNum.toFixed(2) : "0.00";
  const currentSemNum = user?.semester || 1;
  const parsedPrevCgpa = Math.min(10, Math.max(0, parseFloat(prevCgpa) || 0));
  const projectedCgpa =
    sgpaRows.length > 0
      ? currentSemNum > 1
        ? ((parsedPrevCgpa * (currentSemNum - 1) + predictedSgpaNum) / currentSemNum).toFixed(2)
        : predictedSgpa
      : "0.00";

  // Filtered Weekly Timetable Slots
  const displayedRoutineSlots =
    selectedRoutineDay === "ALL"
      ? routineSlots
      : routineSlots.filter((r) => r.dayOfWeek === selectedRoutineDay);

  // Upcoming Calendar Events
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const upcomingEvents = calendarEvents
    .filter((ev) => new Date(ev.date) >= todayStart)
    .slice(0, 4);

  const chartData = marksRecords.map((m) => ({
    name: `${m.subject} (${m.examType})`,
    score: Math.round((m.score / (m.maxScore || 100)) * 100),
  }));

  // Assignment Submit Handler
  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignmentId || !submissionLink.trim()) return;
    try {
      await api.post(`/assignments/${submittingAssignmentId}/submit`, {
        submissionLink: submissionLink.trim(),
        remarks: submissionRemarks.trim(),
      });
      setAssignmentMsg("Assignment / Lab link submitted successfully!");
      setSubmittingAssignmentId(null);
      setSubmissionLink("");
      setSubmissionRemarks("");
      loadStudentData();
    } catch {
      setAssignmentMsg("Failed to submit assignment. Please verify the URL.");
    }
  };

  // Leave Application Handler
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate || !leaveReason.trim()) return;
    setApplyingLeave(true);
    setLeaveFeedback("");
    try {
      await api.post("/leaves", {
        leaveType,
        fromDate,
        toDate,
        reason: leaveReason.trim(),
        documentLink: leaveDocLink.trim() || undefined,
      });
      setLeaveFeedback("Leave application submitted to Faculty & Administration!");
      setFromDate("");
      setToDate("");
      setLeaveReason("");
      setLeaveDocLink("");
      setShowLeaveForm(false);
      loadStudentData();
    } catch {
      setLeaveFeedback("Could not submit leave application. Please try again.");
    } finally {
      setApplyingLeave(false);
    }
  };

  // Gemini AI Advisor Send
  const triggerAiPrompt = async (promptText: string) => {
    if (!promptText.trim() || sending) return;
    setChatInput("");
    setChatHistory((prev) => [...prev, { sender: "user", text: promptText }]);
    setSending(true);
    try {
      const subjectSummaryText = subjectBreakdown
        .map((s) => `${s.subject}: ${s.percentage}% (${s.attended}/${s.held})`)
        .join(", ");
      const context = `Student: ${user?.name}, Dept: ${user?.department}, Sem: ${
        user?.semester || 1
      }, Overall Attendance: ${currentPct}% (${totalAttended}/${totalHeld}), Target: ${targetPct}%, Avg Marks: ${
        riskData?.avgMarksPct ?? 0
      }%, Predicted SGPA: ${predictedSgpa}. Subjects: ${subjectSummaryText}`;

      const { data } = await api.post("/chatbot/ask", {
        message: promptText,
        context,
      });
      setChatHistory((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: "Unable to reach AI advisor right now." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleChatFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAiPrompt(chatInput);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Top Student & College Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {profile?.collegeName || "IntelliCampus Institute of Technology"}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {profile?.program || "B.Tech"} • {user?.department} (
              {profile?.section || "Section A"}) • <strong>Semester {user?.semester || 1}</strong> •
              Roll No: <strong>{user?.rollNumber || "N/A"}</strong>
              {profile?.enrollmentNumber ? ` • Enrollment: ${profile.enrollmentNumber}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/student/admit-card"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Ticket className="w-4 h-4" /> Exam Admit Card
            </Link>
            <Link
              to="/student/grade-card"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Award className="w-4 h-4" /> Grade Card & Bonafide
            </Link>
            <Link
              to="/student/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition"
            >
              <UserCircle className="w-4 h-4" /> College ID
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* LIVE CLASSROOM QR / 4-DIGIT OTP ATTENDANCE CHECK-IN CARD */}
        <div
          className={`rounded-2xl border p-5 shadow-sm transition ${
            activeSessions.length > 0
              ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    activeSessions.length > 0
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  {activeSessions.length > 0 ? "Live Class Session Open" : "Live Classroom Check-In"}
                </span>
                {activeSessions.length > 0 && (
                  <span className="text-xs font-bold text-blue-800">
                    {activeSessions[0].subject} ({activeSessions[0].teacherName})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {activeSessions.length > 0
                  ? `Your teacher has opened live attendance for ${activeSessions[0].subject}. Enter the 4-digit classroom code displayed on the projector!`
                  : "When your faculty starts a live QR/OTP attendance session in class, enter the 4-digit code here to mark yourself Present instantly."}
              </p>
            </div>

            <form onSubmit={handleOtpCheckIn} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={4}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="4-Digit OTP"
                className="w-36 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-center font-mono text-base font-extrabold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={checkingIn || otpCode.length < 4}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition whitespace-nowrap"
              >
                {checkingIn ? "Verifying..." : "Mark Present"}
              </button>
            </form>
          </div>

          {otpFeedback && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs font-semibold ${
                otpFeedback.type === "success"
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-red-100 text-red-900 border border-red-300"
              }`}
            >
              {otpFeedback.text}
            </div>
          )}
        </div>

        {/* 4 Core Semester Telemetry KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Semester Subjects
            </p>
            <p className="text-3xl font-extrabold mt-1.5 text-indigo-600">
              {semesterSubjects.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Active in Semester {user?.semester || 1}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-blue-600" /> Classes Held
            </p>
            <p className="text-3xl font-extrabold mt-1.5 text-slate-900">{totalHeld}</p>
            <p className="text-xs text-slate-500 mt-1">Total lectures conducted</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Classes Attended
            </p>
            <p className="text-3xl font-extrabold mt-1.5 text-emerald-600">
              {totalAttended}{" "}
              <span className="text-base font-bold text-slate-400">({currentPct}%)</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Missed: {totalMissed} lectures</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-600" /> Needed for {targetPct}%
            </p>
            <p className="text-3xl font-extrabold mt-1.5 text-amber-600">
              {isBelowTarget ? `+${overallClassesNeeded}` : "0"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isBelowTarget ? "More classes required" : "Target achieved"}
            </p>
          </div>
        </div>

        {/* Interactive Target Simulator & Subject-Wise Held / Attended / Needed Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" /> Semester Attendance & Target Calculator
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your target percentage to see exact required classes overall and per subject
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[60, 70, 75, 80, 85].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setTargetPct(goal)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      targetPct === goal
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {goal}% Target
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                isBelowTarget
                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                  : "bg-emerald-50 text-emerald-900 border border-emerald-200"
              }`}
            >
              {isBelowTarget ? (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <span>{overallTargetText}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Subject Name</th>
                  <th className="py-3 px-4 font-semibold">Classes Held</th>
                  <th className="py-3 px-4 font-semibold">Attended</th>
                  <th className="py-3 px-4 font-semibold">Missed</th>
                  <th className="py-3 px-4 font-semibold">Current %</th>
                  <th className="py-3 px-4 font-semibold">For {targetPct}% Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subjectBreakdown.map((sub) => (
                  <tr key={sub.subject} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">{sub.subject}</td>
                    <td className="py-3 px-4 text-slate-700">{sub.held}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{sub.attended}</td>
                    <td className="py-3 px-4 text-rose-600">{sub.missed}</td>
                    <td className="py-3 px-4">
                      {sub.held === 0 ? (
                        <span className="text-xs text-slate-400">No classes yet</span>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            sub.percentage < targetPct
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {sub.percentage}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {sub.held === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : sub.neededForTarget > 0 ? (
                        <span className="font-bold text-amber-700">
                          Attend next {sub.neededForTarget} class
                          {sub.neededForTarget > 1 ? "es" : ""}
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-700">
                          On track (Margin: {sub.canSkip})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {subjectBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No subjects configured yet for {user?.department} Semester {user?.semester || 1}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500">
              Marked absent by mistake? Request a correction in Attendance Log.
            </span>
            <Link
              to="/student/attendance"
              className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Date-Wise Log & Correction <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* FULL MONDAY–SATURDAY WEEKLY TIMETABLE CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Master Weekly Class Timetable
              </h2>
              <p className="text-xs text-slate-500">
                Complete Monday–Saturday schedule for {user?.department} Semester {user?.semester || 1}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {WEEK_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedRoutineDay(day)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedRoutineDay === day
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {day.slice(0, 3)}
                  {day === todayDayName ? " (Today)" : ""}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedRoutineDay("ALL")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedRoutineDay === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Full Week
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {displayedRoutineSlots.map((slot) => (
              <div
                key={slot._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold min-w-[90px] text-center">
                    {slot.dayOfWeek}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{slot.subject}</p>
                    {slot.teacherName && (
                      <p className="text-xs text-slate-500">Faculty: {slot.teacherName}</p>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold w-fit">
                  {slot.timeSlot}
                </span>
              </div>
            ))}
            {displayedRoutineSlots.length === 0 && (
              <p className="p-8 text-center text-xs text-slate-400">
                No lectures scheduled for{" "}
                {selectedRoutineDay === "ALL" ? "this week" : selectedRoutineDay}.
              </p>
            )}
          </div>
        </div>

        {/* SGPA / CGPA PREDICTOR & FINAL EXAM SIMULATOR */}
        {sgpaRows.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" /> SGPA / CGPA Predictor & Final Exam Simulator
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust expected End-Sem scores (60% weightage) alongside your actual internal marks (40% weightage)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-600">Previous CGPA:</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={10}
                    value={prevCgpa}
                    onChange={(e) => setPrevCgpa(e.target.value)}
                    className="w-14 font-bold text-slate-900 border-b border-slate-300 focus:outline-none text-center"
                  />
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                  Predicted SGPA: {predictedSgpa}
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                  Projected CGPA: {projectedCgpa}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Subject</th>
                    <th className="py-3 px-4 font-semibold">Internal Avg (40%)</th>
                    <th className="py-3 px-4 font-semibold">Target End-Sem Score (60%)</th>
                    <th className="py-3 px-4 font-semibold">Projected Total</th>
                    <th className="py-3 px-4 font-semibold">Expected Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sgpaRows.map((row) => (
                    <tr key={row.subject} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.subject}</td>
                      <td className="py-3 px-4 text-slate-700">{row.internalAvg}%</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={row.expectedEndSem}
                            onChange={(e) =>
                              setExpectedEndSemMap((prev) => ({
                                ...prev,
                                [row.subject]: Number(e.target.value),
                              }))
                            }
                            className="w-28 accent-indigo-600"
                          />
                          <span className="text-xs font-bold text-indigo-700 w-10">
                            {row.expectedEndSem}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{row.projectedTotal}%</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {row.grade} ({row.gp} GP)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ASSIGNMENT & LAB SUBMISSION TRACKER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" /> Assignments & Lab Submission Tracker
              </h2>
              <p className="text-xs text-slate-500">
                Track deadlines and submit Google Drive / GitHub links directly to faculty
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {assignments.length} Active
            </span>
          </div>

          {assignmentMsg && (
            <div className="mx-4 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              {assignmentMsg}
            </div>
          )}

          <div className="divide-y divide-slate-200">
            {assignments.map((task) => {
              const mySub = (task.submissions || []).find((s: any) => s.studentId === user?.id);
              const dueTime = new Date(task.dueDate).getTime();
              const diffDays = Math.ceil((dueTime - todayStart.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = diffDays < 0 && !mySub;

              return (
                <div key={task._id} className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{task.title}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {task.subject} • {task.type}
                        </span>
                        {mySub ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                            Submitted
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isOverdue
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {isOverdue
                              ? "Overdue"
                              : diffDays === 0
                              ? "Due Today"
                              : `Due in ${diffDays}d`}
                          </span>
                        )}
                      </div>
                      {task.instructions && (
                        <p className="text-xs text-slate-600">{task.instructions}</p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Deadline: {new Date(task.dueDate).toLocaleDateString("en-IN")} • Assigned by{" "}
                        {task.createdBy}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {mySub && (
                        <a
                          href={mySub.submissionLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Link
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittingAssignmentId(task._id);
                          setSubmissionLink(mySub?.submissionLink || "");
                          setSubmissionRemarks(mySub?.remarks || "");
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                      >
                        {mySub ? "Update Submission" : "Submit Work"}
                      </button>
                    </div>
                  </div>

                  {submittingAssignmentId === task._id && (
                    <form
                      onSubmit={handleAssignmentSubmit}
                      className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row gap-2"
                    >
                      <input
                        type="url"
                        required
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        placeholder="Paste Google Drive / GitHub Repo URL..."
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={submissionRemarks}
                        onChange={(e) => setSubmissionRemarks(e.target.value)}
                        placeholder="Optional note..."
                        className="sm:w-48 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Confirm Submit
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmittingAssignmentId(null)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
            {assignments.length === 0 && (
              <p className="p-8 text-center text-xs text-slate-400">
                No pending assignments or lab records posted for your semester yet.
              </p>
            )}
          </div>
        </div>

        {/* MEDICAL & DUTY LEAVE APPLICATION PORTAL + UPCOMING HOLIDAYS */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Medical & Duty Leave Portal */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" /> Medical & Duty Leave Portal
              </span>
              <button
                type="button"
                onClick={() => setShowLeaveForm(!showLeaveForm)}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {showLeaveForm ? "Close Form" : "+ Apply Leave"}
              </button>
            </div>

            {leaveFeedback && (
              <div className="m-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {leaveFeedback}
              </div>
            )}

            {showLeaveForm && (
              <form
                onSubmit={handleApplyLeave}
                className="p-4 border-b border-slate-200 bg-slate-50/40 space-y-3"
              >
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Duty / Event Leave">Duty / Event Leave</option>
                    <option value="Personal Leave">Personal Leave</option>
                  </select>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Reason (e.g. Viral fever / Inter-college Hackathon participation)..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={leaveDocLink}
                    onChange={(e) => setLeaveDocLink(e.target.value)}
                    placeholder="Optional Medical Certificate / Event Pass Drive Link"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    disabled={applyingLeave}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                  >
                    {applyingLeave ? "Sending..." : "Submit Leave"}
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-200 max-h-64 overflow-y-auto">
              {leaves.map((lv) => (
                <div key={lv._id} className="p-4 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">
                      {lv.leaveType}{" "}
                      <span className="font-normal text-slate-500">
                        ({new Date(lv.fromDate).toLocaleDateString("en-IN")} –{" "}
                        {new Date(lv.toDate).toLocaleDateString("en-IN")})
                      </span>
                    </p>
                    <p className="text-slate-600 mt-0.5">{lv.reason}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                      lv.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : lv.status === "Rejected"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {lv.status}
                  </span>
                </div>
              ))}
              {leaves.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-400">
                  No leave applications submitted yet. Click "+ Apply Leave" above to submit one.
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Holidays & Exams */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-rose-600" /> Upcoming Holidays & Exams
              </span>
              <Link
                to="/student/calendar"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Full Calendar
              </Link>
            </div>
            <div className="divide-y divide-slate-200">
              {upcomingEvents.map((ev) => {
                const diffDays = Math.ceil(
                  (new Date(ev.date).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={ev._id}
                    className="p-4 flex items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{ev.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ev.type === "Holiday"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : ev.type === "Exam"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {ev.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(ev.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {diffDays === 0 ? "Today" : `In ${diffDays}d`}
                    </span>
                  </div>
                );
              })}
              {upcomingEvents.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-400">
                  No upcoming holidays or exam dates scheduled yet.
                </p>
              )}
            </div>
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

        {/* Subject-Wise Assessment Performance Chart */}
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

        {/* Gemini AI Academic Advisor with 1-Click Smart Action Chips */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-semibold text-slate-800 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" /> Gemini AI Academic Advisor
            </span>
            <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Context-Aware Study Coach
            </span>
          </div>

          {/* 1-Click Smart Action Buttons */}
          <div className="px-4 py-2.5 bg-blue-50/40 border-b border-slate-200 flex flex-wrap gap-2">
            {[
              "Analyze my weakest subject and how to improve",
              "Create a 7-day exam revision plan for my subjects",
              "How do I safely reach my attendance target?",
              "Tips to boost my SGPA above 8.5 this semester",
            ].map((quickPrompt) => (
              <button
                key={quickPrompt}
                type="button"
                disabled={sending}
                onClick={() => triggerAiPrompt(quickPrompt)}
                className="px-3 py-1 rounded-full bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium transition shadow-2xs"
              >
                {quickPrompt}
              </button>
            ))}
          </div>

          <div className="p-4 h-72 overflow-y-auto space-y-3 bg-white">
            {chatHistory.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-xl px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-slate-100 text-slate-800 border border-slate-200/60"
                }`}
              >
                {m.text}
              </div>
            ))}
            {sending && <p className="text-xs text-slate-400">AI is analyzing your academic data...</p>}
          </div>
          <form
            onSubmit={handleChatFormSubmit}
            className="p-3 border-t border-slate-200 bg-slate-50/50 flex gap-2"
          >
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

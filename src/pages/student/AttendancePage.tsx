import React, { useEffect, useState } from "react";
import { StudentLayout } from "../../components/layouts/StudentLayout";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";
import {
  CalendarCheck,
  Target,
  AlertTriangle,
  CheckCircle2,
  Send,
  Clock,
  Flame,
  Compass,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Ban,
} from "lucide-react";

interface AttendanceRecord {
  _id: string;
  subject: string;
  timeSlot?: string;
  date: string;
  status: "Present" | "Absent" | "Late" | "Cancelled";
  cancelReason?: string;
}

const ALL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [routineSlots, setRoutineSlots] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [targetPct, setTargetPct] = useState<number>(75);

  // Multi-Day Trip / Bunk Simulator State
  const todayStr = new Date().toISOString().split("T")[0];
  const [tripStart, setTripStart] = useState<string>(todayStr);
  const [tripEnd, setTripEnd] = useState<string>(todayStr);

  // Correction modal state
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const loadData = () => {
    api
      .get("/attendance/my")
      .then((res) => setRecords(res.data.records || []))
      .catch(console.error);
    api
      .get("/corrections/my")
      .then((res) => setCorrections(res.data))
      .catch(console.error);
    api
      .get("/leaves/my")
      .then((res) => setLeaves(res.data))
      .catch(console.error);

    if (user?.department) {
      api
        .get(
          `/routine?department=${encodeURIComponent(user.department)}&semester=${
            user.semester || 1
          }`
        )
        .then((res) => setRoutineSlots(res.data || []))
        .catch(console.error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.department, user?.semester]);

  // Active records (exclude Cancelled lectures from percentage calculations)
  const activeRecords = records.filter((r) => r.status !== "Cancelled");

  const subjects: string[] = [
    "All",
    ...Array.from(
      new Set([
        ...routineSlots.map((s: any) => String(s.subject)),
        ...records.map((r) => String(r.subject)),
      ])
    ),
  ];

  const filteredActiveRecords =
    selectedSubject === "All"
      ? activeRecords
      : activeRecords.filter((r) => r.subject === selectedSubject);

  const filteredAllRecords =
    selectedSubject === "All"
      ? records
      : records.filter((r) => r.subject === selectedSubject);

  const totalClasses = filteredActiveRecords.length;
  const presentCount = filteredActiveRecords.filter(
    (r) => r.status === "Present" || r.status === "Late"
  ).length;
  const currentPct = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  // Dynamic Target Calculator Formula
  const t = Math.min(99, Math.max(1, targetPct)) / 100;
  let classesNeeded = 0;
  let canSkip = 0;
  if (totalClasses > 0) {
    if (currentPct < targetPct) {
      classesNeeded = Math.ceil((t * totalClasses - presentCount) / (1 - t));
    } else {
      canSkip = Math.max(0, Math.floor(presentCount / t - totalClasses));
    }
  }

  // Helper: Subject-specific attendance stats
  const getSubjectStats = (subName: string) => {
    const subActive = activeRecords.filter((r) => r.subject === subName);
    const held = subActive.length;
    const attended = subActive.filter(
      (r) => r.status === "Present" || r.status === "Late"
    ).length;
    const pct = held > 0 ? Math.round((attended / held) * 100) : 100;
    return { held, attended, pct };
  };

  // =========================================================
  // 1. GITHUB-STYLE 84-DAY (12-WEEK) HEATMAP & STREAK
  // =========================================================
  const approvedLeaves = leaves.filter((lv) => lv.status === "Approved");

  const isDateOnApprovedLeave = (dateKey: string) => {
    const dTime = new Date(dateKey + "T12:00:00").getTime();
    return approvedLeaves.some((lv) => {
      const s = new Date(lv.fromDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(lv.toDate);
      e.setHours(23, 59, 59, 999);
      return dTime >= s.getTime() && dTime <= e.getTime();
    });
  };

  const recordsByDate: Record<string, AttendanceRecord[]> = {};
  records.forEach((r) => {
    const key = new Date(r.date).toISOString().split("T")[0];
    if (!recordsByDate[key]) recordsByDate[key] = [];
    recordsByDate[key].push(r);
  });

  // Build 84 days aligned to start on Sunday
  const todayObj = new Date();
  todayObj.setHours(12, 0, 0, 0);
  const endAligned = new Date(todayObj);
  endAligned.setDate(todayObj.getDate() + (6 - todayObj.getDay()));

  const heatmapWeeks: {
    dateKey: string;
    label: string;
    isFuture: boolean;
    colorClass: string;
    tooltip: string;
  }[][] = [];

  const cursor = new Date(endAligned);
  cursor.setDate(endAligned.getDate() - 83); // 12 weeks = 84 days

  for (let w = 0; w < 12; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const dateKey = cursor.toISOString().split("T")[0];
      const isFuture = cursor.getTime() > todayObj.getTime();
      const dayRecs = recordsByDate[dateKey] || [];
      const activeDayRecs = dayRecs.filter((r) => r.status !== "Cancelled");
      const onLeave = isDateOnApprovedLeave(dateKey);

      let colorClass = "bg-slate-100 border-slate-200/70";
      let tooltip = `${dateKey}: No classes logged`;

      if (isFuture) {
        colorClass = "bg-slate-50 border-dashed border-slate-200 opacity-50";
        tooltip = `${dateKey}: Upcoming`;
      } else if (onLeave) {
        colorClass = "bg-blue-500 border-blue-600";
        tooltip = `${dateKey}: Approved Medical / Duty Leave`;
      } else if (activeDayRecs.length > 0) {
        const pres = activeDayRecs.filter(
          (r) => r.status === "Present" || r.status === "Late"
        ).length;
        if (pres === activeDayRecs.length) {
          colorClass = "bg-emerald-500 border-emerald-600";
          tooltip = `${dateKey}: All ${pres}/${activeDayRecs.length} Present`;
        } else if (pres > 0) {
          colorClass = "bg-amber-400 border-amber-500";
          tooltip = `${dateKey}: Partial (${pres}/${activeDayRecs.length} Present)`;
        } else {
          colorClass = "bg-rose-500 border-rose-600";
          tooltip = `${dateKey}: Absent (0/${activeDayRecs.length})`;
        }
      } else if (dayRecs.length > 0) {
        colorClass = "bg-slate-300 border-slate-400";
        tooltip = `${dateKey}: Class Cancelled`;
      }

      weekDays.push({
        dateKey,
        label: cursor.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        isFuture,
        colorClass,
        tooltip,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    heatmapWeeks.push(weekDays);
  }

  // Compute Continuous Present Streak (days with active classes)
  const sortedActiveDates = Object.keys(recordsByDate)
    .filter((dk) => recordsByDate[dk].some((r) => r.status !== "Cancelled"))
    .sort((a, b) => (a > b ? -1 : 1));

  let currentStreak = 0;
  for (const dk of sortedActiveDates) {
    const activeDay = recordsByDate[dk].filter((r) => r.status !== "Cancelled");
    const allPresent = activeDay.every((r) => r.status === "Present" || r.status === "Late");
    if (allPresent) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  // =========================================================
  // 2. TODAY'S PERIOD-BY-PERIOD LIVE TRACKER + SAFE-TO-BUNK
  // =========================================================
  const todayDayName = ALL_DAYS[new Date().getDay()];
  const todaysRoutine = routineSlots.filter((r) => r.dayOfWeek === todayDayName);
  const todaysRecords = recordsByDate[todayStr] || [];

  const liveTodayPeriods = todaysRoutine.map((slot) => {
    const matchedRec =
      todaysRecords.find(
        (r) => r.subject === slot.subject && r.timeSlot === slot.timeSlot
      ) || todaysRecords.find((r) => r.subject === slot.subject);

    const subStats = getSubjectStats(slot.subject);
    const pctIfSkipped =
      subStats.held + 1 > 0
        ? Math.round((subStats.attended / (subStats.held + 1)) * 100)
        : 0;
    const isSafeToSkip = pctIfSkipped >= 75;

    return {
      ...slot,
      status: matchedRec ? matchedRec.status : "Upcoming",
      cancelReason: matchedRec?.cancelReason,
      subStats,
      pctIfSkipped,
      isSafeToSkip,
    };
  });

  // =========================================================
  // 3. MULTI-DAY TRIP / BUNK SIMULATOR
  // =========================================================
  const simulateTripImpact = () => {
    if (!tripStart || !tripEnd || tripEnd < tripStart) return [];
    const start = new Date(tripStart + "T12:00:00");
    const end = new Date(tripEnd + "T12:00:00");
    const extraMissedBySub: Record<string, number> = {};

    const iter = new Date(start);
    let safetyDays = 0;
    while (iter <= end && safetyDays < 45) {
      const dName = ALL_DAYS[iter.getDay()];
      const dayClasses = routineSlots.filter((r) => r.dayOfWeek === dName);
      dayClasses.forEach((cls) => {
        extraMissedBySub[cls.subject] = (extraMissedBySub[cls.subject] || 0) + 1;
      });
      iter.setDate(iter.getDate() + 1);
      safetyDays += 1;
    }

    return Object.entries(extraMissedBySub).map(([sub, missedInTrip]) => {
      const { held, attended, pct } = getSubjectStats(sub);
      const newHeld = held + missedInTrip;
      const postTripPct = newHeld > 0 ? Math.round((attended / newHeld) * 100) : 0;
      return {
        subject: sub,
        currentPct: pct,
        missedInTrip,
        postTripPct,
      };
    });
  };

  const tripSimulationRows = simulateTripImpact();

  // =========================================================
  // 4. DAY & TIME-SLOT ABSENCE PATTERN INSIGHTS
  // =========================================================
  const absentRecords = activeRecords.filter((r) => r.status === "Absent");
  const dayAbsenceCounts: Record<string, number> = {};
  const slotAbsenceCounts: Record<string, number> = {};

  absentRecords.forEach((r) => {
    const dName = ALL_DAYS[new Date(r.date).getDay()];
    dayAbsenceCounts[dName] = (dayAbsenceCounts[dName] || 0) + 1;
    const slotLabel = r.timeSlot || "Unspecified Period";
    slotAbsenceCounts[slotLabel] = (slotAbsenceCounts[slotLabel] || 0) + 1;
  });

  const topMissedDay = Object.entries(dayAbsenceCounts).sort((a, b) => b[1] - a[1])[0];
  const topMissedSlot = Object.entries(slotAbsenceCounts).sort((a, b) => b[1] - a[1])[0];

  // =========================================================
  // 5. CORRECTION REQUEST HANDLER
  // =========================================================
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !reason.trim()) return;
    setSubmitting(true);
    setMsg("");
    try {
      await api.post("/corrections", {
        attendanceId: selectedRecord._id,
        subject: selectedRecord.subject,
        date: selectedRecord.date,
        currentStatus: selectedRecord.status,
        reason,
      });
      setSelectedRecord(null);
      setReason("");
      setMsg("Attendance correction request sent to Faculty!");
      loadData();
    } catch {
      setMsg("Failed to submit correction request.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingCorrection = (attId: string) =>
    corrections.some((c) => c.attendanceId === attId && c.status === "Pending");

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header & Subject Filter */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Smart Daily Attendance Tracker & Simulator
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live daily period status, 12-week attendance heatmap, safe-to-bunk planner & correction requests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold">
              <Flame className="w-4 h-4 text-orange-500" /> {currentStreak}-Day Present Streak
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800"
            >
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub === "All" ? "All Subjects" : sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TODAY'S LIVE PERIOD-BY-PERIOD TRACKER + SAFE-TO-BUNK BADGES */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Today's Period-by-Period Live Tracker (
                {todayDayName})
              </h2>
              <p className="text-xs text-slate-500">
                Real-time attendance status and Safe-to-Skip impact for every lecture today
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 w-fit">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {liveTodayPeriods.map((period) => (
              <div
                key={period._id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold">
                      {period.timeSlot}
                    </span>
                    <span className="font-bold text-slate-900">{period.subject}</span>
                    <span className="text-xs text-slate-500">
                      (Current: {period.subStats.pct}%)
                    </span>
                  </div>
                  {period.status === "Cancelled" && (
                    <p className="text-xs text-slate-500">
                      Note: {period.cancelReason || "Cancelled by Faculty"} (Excluded from held count)
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {period.status === "Upcoming" && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        period.isSafeToSkip
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {period.isSafeToSkip ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" /> Safe to Skip (Stays{" "}
                          {period.pctIfSkipped}%)
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" /> Must Attend (Drops to{" "}
                          {period.pctIfSkipped}%)
                        </>
                      )}
                    </span>
                  )}

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      period.status === "Present" || period.status === "Late"
                        ? "bg-emerald-600 text-white"
                        : period.status === "Absent"
                        ? "bg-rose-600 text-white"
                        : period.status === "Cancelled"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {period.status === "Upcoming" ? "Upcoming Class" : period.status}
                  </span>
                </div>
              </div>
            ))}
            {liveTodayPeriods.length === 0 && (
              <p className="p-6 text-center text-xs text-slate-400">
                No classes scheduled in your weekly routine for {todayDayName}.
              </p>
            )}
          </div>
        </div>

        {/* GITHUB-STYLE 12-WEEK DAILY ATTENDANCE HEATMAP */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                12-Week Daily Attendance Consistency Heatmap
              </h2>
              <p className="text-xs text-slate-500">
                Hover over any day block to inspect daily class attendance
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Full Present
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" /> Partial
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" /> Absent
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" /> Approved Leave
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-300 inline-block" />{" "}
                No Class
              </span>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="inline-flex gap-1.5">
              <div className="flex flex-col justify-between text-[10px] font-bold text-slate-400 pr-1 py-0.5">
                <span>Sun</span>
                <span>Tue</span>
                <span>Thu</span>
                <span>Sat</span>
              </div>
              {heatmapWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                  {week.map((day) => (
                    <div
                      key={day.dateKey}
                      title={day.tooltip}
                      className={`w-5 h-5 rounded-sm border transition-transform hover:scale-125 cursor-pointer ${day.colorClass}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Target Attendance Calculator Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Target className="w-5 h-5 text-blue-600" /> Interactive Attendance Target Calculator
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[60, 70, 75, 80, 85].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setTargetPct(goal)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    targetPct === goal
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {goal}%
                </button>
              ))}
              <div className="flex items-center gap-1 ml-1">
                <span className="text-xs text-slate-500">Custom:</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={targetPct}
                  onChange={(e) => setTargetPct(Number(e.target.value) || 75)}
                  className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-center"
                />
                <span className="text-xs font-bold text-slate-600">%</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase">Current Standing</p>
              <p className="text-3xl font-extrabold text-blue-600 mt-1">{currentPct}%</p>
              <p className="text-xs text-slate-500 mt-1">
                Attended {presentCount} of {totalClasses} active lectures
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Target Goal ({targetPct}%)
              </p>
              <p
                className={`text-3xl font-extrabold mt-1 ${
                  currentPct < targetPct ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {currentPct < targetPct ? `+${classesNeeded} Needed` : "Goal Achieved"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {currentPct < targetPct
                  ? `Attend next ${classesNeeded} class${classesNeeded > 1 ? "es" : ""} in a row`
                  : `You have a ${canSkip}-class safety margin`}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border flex items-start gap-2.5 ${
                currentPct < targetPct && totalClasses > 0
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              {currentPct < targetPct && totalClasses > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">
                <p className="font-bold text-sm mb-0.5">
                  {totalClasses === 0
                    ? "No Lectures Logged Yet"
                    : currentPct < targetPct
                    ? "Action Required"
                    : "Safe Zone"}
                </p>
                {totalClasses === 0
                  ? "Your target projection will update automatically once faculty records attendance."
                  : currentPct < targetPct
                  ? `Do not miss upcoming lectures. Attending ${classesNeeded} consecutive class${
                      classesNeeded > 1 ? "es" : ""
                    } will bring ${selectedSubject === "All" ? "overall" : selectedSubject} attendance to ${targetPct}%.`
                  : `You can safely miss up to ${canSkip} upcoming lecture${
                      canSkip !== 1 ? "s" : ""
                    } without dropping below ${targetPct}%.`}
              </div>
            </div>
          </div>
        </div>

        {/* MULTI-DAY TRIP / LEAVE SIMULATOR + ABSENCE PATTERN INSIGHTS */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trip / Leave Impact Simulator */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-600" /> Planned Leave / Trip Attendance
                  Simulator
                </h2>
                <p className="text-xs text-slate-500">
                  Select a date range to preview how missing those days affects every subject
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={tripStart}
                  onChange={(e) => setTripStart(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
                <span className="font-bold text-slate-400">to</span>
                <input
                  type="date"
                  value={tripEnd}
                  onChange={(e) => setTripEnd(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-4">Current %</th>
                    <th className="py-2.5 px-4">Classes Missed</th>
                    <th className="py-2.5 px-4">Post-Leave %</th>
                    <th className="py-2.5 px-4">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tripSimulationRows.map((row) => (
                    <tr key={row.subject}>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{row.subject}</td>
                      <td className="py-2.5 px-4 text-slate-700">{row.currentPct}%</td>
                      <td className="py-2.5 px-4 font-semibold text-rose-600">
                        -{row.missedInTrip}
                      </td>
                      <td className="py-2.5 px-4 font-extrabold text-slate-900">
                        {row.postTripPct}%
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            row.postTripPct >= 75
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {row.postTripPct >= 75 ? "Safe (≥75%)" : "Drops Below 75%"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tripSimulationRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No scheduled classes fall inside the selected date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Day & Time-Slot Absence Pattern Insights */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600" /> Absence Pattern Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Identifies which weekday and period slot cause the most attendance loss
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[11px] font-bold uppercase text-slate-400">Most Missed Weekday</p>
                <p className="text-base font-extrabold text-slate-900">
                  {topMissedDay ? `${topMissedDay[0]} (${topMissedDay[1]} Absents)` : "Zero Absents!"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Most Missed Time Slot
                </p>
                <p className="text-sm font-extrabold text-slate-900">
                  {topMissedSlot
                    ? `${topMissedSlot[0]} (${topMissedSlot[1]} Absents)`
                    : "100% Punctual"}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 font-medium">
              Tip: Keep an eye on morning Period 1 slots—attending them consistently protects your
              75% buffer across all subjects.
            </div>
          </div>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            {msg}
          </div>
        )}

        {/* Correction Request Modal Box */}
        {selectedRecord && (
          <form
            onSubmit={handleCorrectionSubmit}
            className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-blue-950">
                Request Attendance Correction: {selectedRecord.subject} (
                {new Date(selectedRecord.date).toLocaleDateString("en-IN")})
              </p>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you should be marked Present (e.g. Attended lab / Medical leave / Roll call missed)..."
                className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" /> {submitting ? "Sending..." : "Submit to Teacher"}
              </button>
            </div>
          </form>
        )}

        {/* Date-Wise Attendance Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-800 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" /> Date-Wise Attendance Register (
            {filteredAllRecords.length} entries)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Subject & Period</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAllRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(r.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {r.subject}{" "}
                      {r.timeSlot && <span className="text-xs text-slate-400">({r.timeSlot})</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          r.status === "Present"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.status === "Late"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : r.status === "Cancelled"
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {r.status === "Cancelled" && <Ban className="w-3 h-3" />}
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === "Absent" &&
                        (hasPendingCorrection(r._id) ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <Clock className="w-3.5 h-3.5" /> Correction Pending
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(r)}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Request Correction
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
                {filteredAllRecords.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No attendance records found for this filter.
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

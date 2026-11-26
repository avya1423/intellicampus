import React, { useEffect, useState } from "react";
import { StudentLayout } from "../../components/layouts/StudentLayout";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";
import { Printer, GraduationCap, Award, CheckCircle2, FileText } from "lucide-react";

interface SubjectReportRow {
  subject: string;
  held: number;
  attended: number;
  attendancePct: number;
  avgScorePct: number;
  grade: string;
  gradePoint: number;
}

const getGradeInfo = (pct: number): { grade: string; point: number } => {
  if (pct >= 90) return { grade: "O (Outstanding)", point: 10 };
  if (pct >= 80) return { grade: "A+ (Excellent)", point: 9 };
  if (pct >= 70) return { grade: "A (Very Good)", point: 8 };
  if (pct >= 60) return { grade: "B+ (Good)", point: 7 };
  if (pct >= 50) return { grade: "B (Above Average)", point: 6 };
  if (pct >= 40) return { grade: "C (Pass)", point: 5 };
  return { grade: "F (Reappear)", point: 0 };
};

export const GradeCardPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [marksRecords, setMarksRecords] = useState<any[]>([]);
  const [routineSlots, setRoutineSlots] = useState<any[]>([]);

  useEffect(() => {
    api.get("/users/profile").then((res) => setProfile(res.data)).catch(console.error);
    api
      .get("/attendance/my")
      .then((res) => setAttendanceRecords(res.data.records || []))
      .catch(console.error);
    api
      .get("/marks/my")
      .then((res) => setMarksRecords(res.data.records || []))
      .catch(console.error);
    if (user?.department) {
      api
        .get(
          `/routine?department=${encodeURIComponent(user.department)}&semester=${
            user.semester || 1
          }`
        )
        .then((res) => setRoutineSlots(res.data))
        .catch(console.error);
    }
  }, [user?.department, user?.semester]);

  const subjectSet = new Set<string>();
  routineSlots.forEach((s) => subjectSet.add(s.subject));
  attendanceRecords.forEach((r) => subjectSet.add(r.subject));
  marksRecords.forEach((m) => subjectSet.add(m.subject));
  const subjects = Array.from(subjectSet);

  const reportRows: SubjectReportRow[] = subjects.map((sub) => {
    const subAtt = attendanceRecords.filter((r) => r.subject === sub);
    const held = subAtt.length;
    const attended = subAtt.filter(
      (r) => r.status === "Present" || r.status === "Late"
    ).length;
    const attendancePct = held > 0 ? Math.round((attended / held) * 100) : 0;

    const subMarks = marksRecords.filter((m) => m.subject === sub);
    const avgScorePct =
      subMarks.length > 0
        ? Math.round(
            subMarks.reduce(
              (sum: number, m: any) => sum + (m.score / (m.maxScore || 100)) * 100,
              0
            ) / subMarks.length
          )
        : 0;

    const { grade, point } =
      subMarks.length > 0 ? getGradeInfo(avgScorePct) : { grade: "Pending", point: 0 };

    return {
      subject: sub,
      held,
      attended,
      attendancePct,
      avgScorePct,
      grade,
      gradePoint: point,
    };
  });

  const gradedRows = reportRows.filter((r) => r.grade !== "Pending");
  const calculatedSgpa =
    gradedRows.length > 0
      ? (
          gradedRows.reduce((acc, r) => acc + r.gradePoint, 0) / gradedRows.length
        ).toFixed(2)
      : "N/A";

  const totalHeld = attendanceRecords.length;
  const totalAttended = attendanceRecords.filter(
    (r) => r.status === "Present" || r.status === "Late"
  ).length;
  const overallAttPct = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 0;

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Official Semester Grade Card & Bonafide Report
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified academic transcript & attendance eligibility certificate ready for print/PDF export
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition w-fit"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>

        {/* Printable Official Document Sheet */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-8 space-y-6">
          {/* University Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
                  {profile?.collegeName || "IntelliCampus Institute of Technology"}
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  Office of the Controller of Examinations & Academic Affairs
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-600">
              <p className="font-bold text-slate-900 uppercase">Provisional Statement of Marks</p>
              <p>Issued On: {new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>

          {/* Student Details Matrix */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Student Name</span>
              <span className="font-bold text-slate-900 text-sm">{profile?.name || user?.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">University Roll Number</span>
              <span className="font-bold text-slate-900 text-sm">
                {profile?.rollNumber || user?.rollNumber || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Enrollment Number</span>
              <span className="font-bold text-slate-900 text-sm">
                {profile?.enrollmentNumber || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Program & Branch</span>
              <span className="font-bold text-slate-900">
                {profile?.program || "B.Tech"} — {profile?.department || user?.department}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Semester & Section</span>
              <span className="font-bold text-slate-900">
                Semester {profile?.semester || user?.semester || 1} ({profile?.section || "Section A"})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Academic Batch</span>
              <span className="font-bold text-slate-900">{profile?.batch || "2026 - 2030"}</span>
            </div>
          </div>

          {/* Subject-Wise Performance & Attendance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-slate-200">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4 font-bold">Subject</th>
                  <th className="py-3 px-4 font-bold">Lectures (Att/Held)</th>
                  <th className="py-3 px-4 font-bold">Attendance %</th>
                  <th className="py-3 px-4 font-bold">Internal / Exam %</th>
                  <th className="py-3 px-4 font-bold">Grade</th>
                  <th className="py-3 px-4 font-bold">Grade Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportRows.map((row) => (
                  <tr key={row.subject}>
                    <td className="py-3 px-4 font-semibold text-slate-900">{row.subject}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {row.attended} / {row.held}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{row.attendancePct}%</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {row.grade === "Pending" ? "—" : `${row.avgScorePct}%`}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-700">{row.grade}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.grade === "Pending" ? "—" : row.gradePoint}
                    </td>
                  </tr>
                ))}
                {reportRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No semester subjects or exam records available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* SGPA & Bonafide Eligibility Summary */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-blue-800">Computed Semester GPA</p>
                <p className="text-xs text-blue-700 mt-0.5">Based on evaluated assessments</p>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-blue-600" />
                <span className="text-2xl font-extrabold text-blue-900">{calculatedSgpa} / 10</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-800">Bonafide Attendance Status</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {overallAttPct >= 75
                    ? "Eligible for University End-Sem Exams (≥75%)"
                    : "Attendance Shortage Warning (<75%)"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span className="text-2xl font-extrabold text-emerald-900">{overallAttPct}%</span>
              </div>
            </div>
          </div>

          {/* Official Bonafide Certification Footer */}
          <div className="pt-6 border-t border-slate-200 text-xs text-slate-600 space-y-6">
            <p className="leading-relaxed">
              <strong>BONAFIDE CERTIFICATION:</strong> This is to certify that{" "}
              <strong>{profile?.name || user?.name}</strong> (Roll No:{" "}
              <strong>{profile?.rollNumber || user?.rollNumber || "N/A"}</strong>) is a bonafide
              regular student of <strong>{profile?.program || "B.Tech"}</strong> in{" "}
              <strong>{profile?.department || user?.department}</strong>, Semester{" "}
              <strong>{profile?.semester || user?.semester || 1}</strong> at{" "}
              <strong>{profile?.collegeName || "IntelliCampus Institute of Technology"}</strong>.
            </p>
            <div className="flex justify-between items-end pt-4 text-slate-700 font-semibold">
              <div>
                <p className="border-t border-slate-400 pt-1 px-4">Class Mentor / HOD</p>
              </div>
              <div>
                <p className="border-t border-slate-400 pt-1 px-4">Controller of Examinations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

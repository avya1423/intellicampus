import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "../../components/layouts/StudentLayout";
import api from "../../api/axios";
import {
  Printer,
  GraduationCap,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Ticket,
  QrCode,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export const AdmitCardPage: React.FC = () => {
  const [admitData, setAdmitData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .get("/exams/admit-card/my")
      .then((res) => setAdmitData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <StudentLayout>
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
          Verifying 75% attendance eligibility and loading Hall Ticket...
        </div>
      </StudentLayout>
    );
  }

  const student = admitData?.student || {};
  const totalHeld = admitData?.totalHeld || 0;
  const totalPresent = admitData?.totalPresent || 0;
  const overallAttPct = admitData?.overallAttPct ?? 100;
  const isEligible = Boolean(admitData?.isEligible);
  const condonation = admitData?.condonation;
  const schedule: any[] = admitData?.schedule || [];

  const classesNeeded =
    !isEligible && totalHeld > 0
      ? Math.ceil((0.75 * totalHeld - totalPresent) / 0.25)
      : 0;

  const hallTicketId = `IC-${student.semester || 1}-${
    student.rollNumber || student._id?.slice(-5)?.toUpperCase() || "2026"
  }`;

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Top Action & Status Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-600" /> University Examination Hall Ticket
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated 75% attendance eligibility verification & official exam seating pass
            </p>
          </div>

          {isEligible ? (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition w-fit"
            >
              <Printer className="w-4 h-4" /> Print / Save Admit Card PDF
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold w-fit">
              <Lock className="w-4 h-4" /> Locked (Attendance &lt; 75%)
            </span>
          )}
        </div>

        {/* 75% Attendance Gate Alert (Shown when Locked) */}
        {!isEligible && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 space-y-4 print:hidden">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-base font-bold text-rose-900">
                  Admit Card Locked — Attendance Shortage ({overallAttPct}% / 75% Required)
                </h2>
                <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
                  You have attended <strong>{totalPresent}</strong> out of{" "}
                  <strong>{totalHeld}</strong> lectures ({overallAttPct}%). University regulations
                  require at least <strong>75% aggregate attendance</strong> to download your End-Sem
                  Hall Ticket.
                </p>
                {classesNeeded > 0 && (
                  <p className="text-xs font-bold text-rose-900 pt-1">
                    Recovery Action: Attend the next {classesNeeded} consecutive class
                    {classesNeeded > 1 ? "es" : ""} to automatically unlock your Admit Card, or
                    apply for Medical/Duty Leave & Dean Condonation.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/student/attendance"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Check Attendance & Request Correction <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/student"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-semibold"
              >
                Apply Medical / Duty Leave
              </Link>
            </div>
          </div>
        )}

        {/* Official Printable Admit Card Sheet (Shown when Eligible) */}
        {isEligible && (
          <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            {/* University Header */}
            <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
                    {student.collegeName || "IntelliCampus Institute of Technology"}
                  </h2>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mt-0.5">
                    {schedule[0]?.examSession || "End-Semester University Examinations 2026"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Official Candidate Hall Ticket & Admit Card
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border border-slate-300 rounded-xl p-2.5 bg-slate-50">
                <QrCode className="w-10 h-10 text-slate-900" />
                <div className="text-xs">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Hall Ticket ID</p>
                  <p className="font-mono font-extrabold text-slate-900">{hallTicketId}</p>
                  <p className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Digitally Verified
                  </p>
                </div>
              </div>
            </div>

            {/* Condonation Badge if unlocked via Admin Override */}
            {condonation && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
                <span>
                  Special Condonation Approved: {condonation.reason} (Authorized by{" "}
                  {condonation.grantedBy})
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-200/70 text-[10px] font-bold uppercase">
                  Condonation Pass
                </span>
              </div>
            )}

            {/* Candidate Details & Photo Box */}
            <div className="grid md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="md:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Candidate Full Name
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">{student.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    University Roll No
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {student.rollNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Enrollment Number
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {student.enrollmentNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Program & Branch
                  </span>
                  <span className="font-bold text-slate-900">
                    {student.program || "B.Tech"} — {student.department}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Semester & Section
                  </span>
                  <span className="font-bold text-slate-900">
                    Semester {student.semester || 1} ({student.section || "Section A"})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                    Attendance Clearance
                  </span>
                  <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {overallAttPct}% Verified
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-3 bg-white text-center">
                <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-xl">
                  {student.name?.charAt(0).toUpperCase() || "S"}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">
                  Candidate Photo
                </span>
              </div>
            </div>

            {/* Examination Date Sheet & Seating Schedule */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Permitted Examination Papers & Seating Schedule
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-slate-300">
                  <thead className="bg-slate-900 text-white text-xs uppercase">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Subject Code</th>
                      <th className="py-2.5 px-3 font-semibold">Subject Title</th>
                      <th className="py-2.5 px-3 font-semibold">Exam Date</th>
                      <th className="py-2.5 px-3 font-semibold">Shift & Time</th>
                      <th className="py-2.5 px-3 font-semibold">Room / Hall</th>
                      <th className="py-2.5 px-3 font-semibold">Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {schedule.map((paper) => (
                      <tr key={paper._id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {paper.subjectCode}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {paper.subject}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {new Date(paper.examDate).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 text-xs">{paper.shiftTime}</td>
                        <td className="py-2.5 px-3 font-semibold text-blue-700 text-xs">
                          {paper.roomNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">_____________</td>
                      </tr>
                    ))}
                    {schedule.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                          Examination timetable has not been published yet by the Controller of
                          Examinations for {student.department} Semester {student.semester || 1}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exam Instructions & Official Signatures */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-6">
              <div className="space-y-1">
                <p className="font-bold text-slate-800 uppercase text-[11px]">
                  Important Examination Instructions:
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  <li>
                    Candidates must report to the allotted Examination Hall 20 minutes prior to the
                    scheduled shift.
                  </li>
                  <li>
                    Carry this printed Admit Card along with your College Digital/Physical Identity
                    Card.
                  </li>
                  <li>
                    Mobile phones, smartwatches, and programmable calculators are strictly prohibited.
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap justify-between items-end pt-6 text-slate-800 font-bold text-xs gap-4">
                <div className="border-t border-slate-400 pt-1 px-4">Signature of Candidate</div>
                <div className="border-t border-slate-400 pt-1 px-4">Head of Department</div>
                <div className="border-t border-slate-400 pt-1 px-4">
                  Controller of Examinations
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

import React, { useEffect, useState } from "react";
import { StudentLayout } from "../../components/layouts/StudentLayout";
import api from "../../api/axios";

export const AttendancePage: React.FC = () => {
  const [data, setData] = useState<{ percentage: number; totalClasses: number; records: any[] }>({
    percentage: 0,
    totalClasses: 0,
    records: [],
  });

  useEffect(() => {
    api.get("/attendance/my").then((res) => setData(res.data)).catch(console.error);
  }, []);

  return (
    <StudentLayout>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Attendance Records</h1>
            <p className="text-sm text-slate-500">Total Classes Logged: {data.totalClasses}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-600">{data.percentage}%</span>
            <p className="text-xs text-slate-500">Attendance Rate</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Subject</th>
                <th className="py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.records.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-700">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{r.subject}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === "Present"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {data.records.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    No attendance records found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StudentLayout>
  );
};

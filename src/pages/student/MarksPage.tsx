import React, { useEffect, useState } from "react";
import { StudentLayout } from "../../components/layouts/StudentLayout";
import api from "../../api/axios";

export const MarksPage: React.FC = () => {
  const [data, setData] = useState<{ averagePercentage: number; records: any[] }>({
    averagePercentage: 0,
    records: [],
  });

  useEffect(() => {
    api.get("/marks/my").then((res) => setData(res.data)).catch(console.error);
  }, []);

  return (
    <StudentLayout>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Examination & Assignment Marks</h1>
            <p className="text-sm text-slate-500">Continuous Internal & Semester Assessments</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-emerald-600">{data.averagePercentage}%</span>
            <p className="text-xs text-slate-500">Cumulative Average</p>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="py-3 px-4 font-semibold">Subject</th>
              <th className="py-3 px-4 font-semibold">Assessment Type</th>
              <th className="py-3 px-4 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.records.map((m) => (
              <tr key={m._id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-medium text-slate-900">{m.subject}</td>
                <td className="py-3 px-4 text-slate-600">{m.examType}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {m.score} / {m.maxScore}
                </td>
              </tr>
            ))}
            {data.records.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400">
                  No marks uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </StudentLayout>
  );
};

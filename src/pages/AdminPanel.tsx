import React, { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import api from "../api/axios";

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<any>({ totalStudents: 0, totalTeachers: 0, pendingRequests: 0 });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    api.get("/admin/stats").then((res) => setStats(res.data)).catch(console.error);
    api.get("/admin/users").then((res) => setUsers(res.data)).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Campus Administration Control Center</h1>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Registered Students</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalStudents}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Faculty Members</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.totalTeachers}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Pending Profile Requests</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingRequests}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900">
            All Campus Directory Users
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-medium text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4 uppercase text-xs font-bold text-blue-700">{u.role}</td>
                  <td className="py-3 px-4 text-slate-600">{u.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

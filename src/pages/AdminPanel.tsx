import React, { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import { Search, Check, X, ShieldCheck, Users, GraduationCap, Clock, UserCheck } from "lucide-react";

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({ totalStudents: 0, totalTeachers: 0, pendingRequests: 0, pendingUsers: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadAllData = () => {
    api.get("/admin/stats").then((res) => setStats(res.data)).catch(console.error);
    api.get("/admin/users").then((res) => setUsers(res.data)).catch(console.error);
    api.get("/admin/profile-requests").then((res) => setRequests(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleUserApproval = async (id: string, status: "Approved" | "Rejected") => {
    await api.patch(`/admin/users/${id}/approval`, { status });
    loadAllData();
  };

  const handleRequestAction = async (id: string, status: "Approved" | "Rejected") => {
    await api.patch(`/admin/profile-requests/${id}`, { status });
    loadAllData();
  };

  const pendingAccounts = users.filter((u) => u.isApproved === false || u.approvalStatus === "Pending");

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      (u.rollNumber || "").toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Admin Profile Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Campus Administration Control Center</h1>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Logged in as {user?.name} ({user?.email})
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Pending Accounts</p>
              <p className="text-3xl font-bold text-rose-600 mt-1">{pendingAccounts.length}</p>
            </div>
            <UserCheck className="w-8 h-8 text-rose-200" />
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Verified Students</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalStudents}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-blue-200" />
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Verified Faculty</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.totalTeachers}</p>
            </div>
            <Users className="w-8 h-8 text-emerald-200" />
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Profile Requests</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingRequests}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-200" />
          </div>
        </div>

        {/* Pending New Account Approvals Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-rose-50/50 font-bold text-slate-900 flex items-center justify-between">
            <span>New Account Registration Approvals ({pendingAccounts.length})</span>
            <span className="text-xs font-medium text-slate-500">Users cannot sign in until approved</span>
          </div>
          <div className="divide-y divide-slate-200">
            {pendingAccounts.map((acc) => (
              <div key={acc._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{acc.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {acc.email} • Dept: {acc.department} {acc.rollNumber ? `• Roll: ${acc.rollNumber}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUserApproval(acc._id, "Approved")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Account
                  </button>
                  <button
                    onClick={() => handleUserApproval(acc._id, "Rejected")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingAccounts.length === 0 && (
              <p className="p-6 text-center text-xs text-slate-400">No pending account registrations.</p>
            )}
          </div>
        </div>

        {/* Student Profile Change Requests Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900">
            Student Profile Correction Requests
          </div>
          <div className="divide-y divide-slate-200">
            {requests.map((req) => (
              <div key={req._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {req.studentId?.name || "Student"} ({req.studentId?.email})
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Requested Update: <span className="font-mono text-blue-700 font-semibold">{JSON.stringify(req.requestedChanges)}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Reason: {req.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  {req.status === "Pending" ? (
                    <>
                      <button
                        onClick={() => handleRequestAction(req._id, "Approved")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleRequestAction(req._id, "Rejected")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        req.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <p className="p-6 text-center text-xs text-slate-400">No profile requests in queue.</p>
            )}
          </div>
        </div>

        {/* Searchable Campus Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-bold text-slate-900">Campus Directory ({filteredUsers.length})</span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, roll no..."
                  className="pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((u) => {
                  const statusLabel =
                    u.approvalStatus || (u.isApproved === false ? "Pending" : "Approved");
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-medium text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4 uppercase text-xs font-bold text-blue-700">{u.role}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            statusLabel === "Approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : statusLabel === "Rejected"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.department}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

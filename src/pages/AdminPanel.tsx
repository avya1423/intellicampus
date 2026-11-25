import React, { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import {
  Search,
  Check,
  X,
  ShieldCheck,
  Users,
  GraduationCap,
  Clock,
  UserCheck,
  UserPlus,
  CalendarPlus,
  Trash2,
} from "lucide-react";

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({ totalStudents: 0, totalTeachers: 0, pendingRequests: 0, pendingUsers: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create new Admin/User modal state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [newDept, setNewDept] = useState("Administration");
  const [createMsg, setCreateMsg] = useState("");
  const [creating, setCreating] = useState(false);

  // Calendar Holiday / Event State
  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evType, setEvType] = useState<"Holiday" | "Exam" | "Event">("Holiday");
  const [evDesc, setEvDesc] = useState("");
  const [addingEv, setAddingEv] = useState(false);

  const loadAllData = () => {
    api.get("/admin/stats").then((res) => setStats(res.data)).catch(console.error);
    api.get("/admin/users").then((res) => setUsers(res.data)).catch(console.error);
    api.get("/admin/profile-requests").then((res) => setRequests(res.data)).catch(console.error);
    api.get("/calendar").then((res) => setEvents(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    try {
      const { data } = await api.post("/admin/create-user", {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        department: newDept,
      });
      setCreateMsg(data.message);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowCreateForm(false);
      loadAllData();
    } catch (err: any) {
      setCreateMsg(err.response?.data?.message || "Failed to create account.");
    } finally {
      setCreating(false);
    }
  };

  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim() || !evDate) return;
    setAddingEv(true);
    try {
      await api.post("/calendar", {
        title: evTitle,
        date: evDate,
        type: evType,
        description: evDesc,
      });
      setEvTitle("");
      setEvDate("");
      setEvDesc("");
      setCreateMsg("Academic calendar updated! Visible to all Students & Faculty.");
      loadAllData();
    } finally {
      setAddingEv(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await api.delete(`/calendar/${id}`);
    loadAllData();
  };

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
        {/* Admin Profile Header + Create Button */}
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

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition w-fit"
          >
            <UserPlus className="w-4 h-4" />
            {showCreateForm ? "Close Form" : "Create New Admin / User"}
          </button>
        </div>

        {createMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            {createMsg}
          </div>
        )}

        {/* Create New Verified Admin / User Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Create Verified Campus Account</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin2@university.edu"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  <option value="admin">Administrator</option>
                  <option value="teacher">Faculty</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  {creating ? "Creating..." : "Create & Verify Account"}
                </button>
              </div>
            </div>
          </form>
        )}

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

        {/* Academic Calendar & Holiday Manager (Admin Exclusive) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-blue-600" /> Academic Calendar & Holiday Publisher
          </div>
          <form onSubmit={handleAddCalendarEvent} className="p-4 border-b border-slate-200 space-y-3">
            <div className="grid sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder="Holiday / Exam Title (e.g. Republic Day)"
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
              <input
                type="date"
                required
                value={evDate}
                onChange={(e) => setEvDate(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
              <select
                value={evType}
                onChange={(e) => setEvType(e.target.value as any)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              >
                <option value="Holiday">Holiday</option>
                <option value="Exam">Examination</option>
                <option value="Event">Campus Event</option>
              </select>
              <button
                type="submit"
                disabled={addingEv}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                {addingEv ? "Publishing..." : "Publish to Calendar"}
              </button>
            </div>
            <input
              type="text"
              value={evDesc}
              onChange={(e) => setEvDesc(e.target.value)}
              placeholder="Optional notice or description for students & faculty..."
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </form>

          <div className="divide-y divide-slate-200 max-h-60 overflow-y-auto">
            {events.map((ev) => (
              <div key={ev._id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-slate-900">{ev.title}</span>{" "}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium ml-1">
                    {ev.type}
                  </span>
                  <span className="text-xs text-slate-500 ml-3">
                    {new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteEvent(ev._id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                  title="Remove from calendar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {events.length === 0 && (
              <p className="p-5 text-center text-xs text-slate-400">No holidays or events published yet.</p>
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

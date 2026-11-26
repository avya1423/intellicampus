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
  Edit3,
  KeyRound,
  Download,
  ArrowUpRight,
  Megaphone,
  ExternalLink,
  Ban,
  RefreshCw,
  HeartPulse,
  MessageSquareWarning,
} from "lucide-react";

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Administration",
];

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"directory" | "approvals" | "calendar" | "bulk">(
    "directory"
  );

  const [stats, setStats] = useState<any>({
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    pendingRequests: 0,
    pendingUsers: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [riskList, setRiskList] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  // Directory Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Feedback Banner
  const [bannerMsg, setBannerMsg] = useState("");

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  // Reset Password Modal State
  const [passwordTarget, setPasswordTarget] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resettingPwd, setResettingPwd] = useState(false);

  // Create New User Form State (Bulk / Quick Create)
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("student");
  const [newDept, setNewDept] = useState("Computer Science");
  const [newSemester, setNewSemester] = useState<number>(1);
  const [newRollNo, setNewRollNo] = useState("");
  const [newEnrollmentNo, setNewEnrollmentNo] = useState("");
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [newDesignation, setNewDesignation] = useState("Assistant Professor");
  const [creating, setCreating] = useState(false);

  // Bulk Semester Promotion State
  const [promoDept, setPromoDept] = useState("Computer Science");
  const [promoFromSem, setPromoFromSem] = useState<number>(1);
  const [promoting, setPromoting] = useState(false);

  // Calendar Holiday / Event State
  const [evTitle, setEvTitle] = useState("");
  const [evDate, setEvDate] = useState("");
  const [evType, setEvType] = useState<"Holiday" | "Exam" | "Event">("Holiday");
  const [evDesc, setEvDesc] = useState("");
  const [addingEv, setAddingEv] = useState(false);

  // Official Notice Broadcaster State
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");
  const [noticeDept, setNoticeDept] = useState("Computer Science");
  const [noticeSem, setNoticeSem] = useState<number>(1);
  const [noticeLink, setNoticeLink] = useState("");
  const [postingNotice, setPostingNotice] = useState(false);

  const loadAllData = () => {
    api.get("/admin/stats").then((res) => setStats(res.data)).catch(console.error);
    api.get("/admin/users").then((res) => setUsers(res.data)).catch(console.error);
    api.get("/risk/all").then((res) => setRiskList(res.data.students || [])).catch(console.error);
    api.get("/admin/profile-requests").then((res) => setRequests(res.data)).catch(console.error);
    api.get("/leaves/all").then((res) => setLeaves(res.data)).catch(console.error);
    api.get("/corrections/teacher").then((res) => setCorrections(res.data)).catch(console.error);
    api.get("/calendar").then((res) => setEvents(res.data)).catch(console.error);
    api.get("/notices").then((res) => setNotices(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const getStudentTelemetry = (studentId: string) => {
    return riskList.find((r) => r.student?._id === studentId);
  };

  // Full User Edit Save
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    setBannerMsg("");
    try {
      await api.patch(`/admin/users/${editingUser._id}`, editingUser);
      setBannerMsg(`Updated ${editingUser.name}'s profile & permissions successfully!`);
      setEditingUser(null);
      loadAllData();
    } catch (err: any) {
      setBannerMsg(err.response?.data?.message || "Failed to update user.");
    } finally {
      setSavingUser(false);
    }
  };

  // Password Reset Save
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget || !newPasswordInput.trim()) return;
    setResettingPwd(true);
    setBannerMsg("");
    try {
      const { data } = await api.patch(`/admin/users/${passwordTarget._id}/reset-password`, {
        newPassword: newPasswordInput.trim(),
      });
      setBannerMsg(data.message);
      setPasswordTarget(null);
      setNewPasswordInput("");
    } catch (err: any) {
      setBannerMsg(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setResettingPwd(false);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (targetUser: any) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${targetUser.name} (${targetUser.role}) and all their records?`
      )
    ) {
      return;
    }
    try {
      const { data } = await api.delete(`/admin/users/${targetUser._id}`);
      setBannerMsg(data.message);
      loadAllData();
    } catch (err: any) {
      setBannerMsg(err.response?.data?.message || "Could not delete user.");
    }
  };

  // Create New Verified Account
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setBannerMsg("");
    try {
      const { data } = await api.post("/admin/create-user", {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        department: newDept,
        semester: newSemester,
        rollNumber: newRollNo,
        enrollmentNumber: newEnrollmentNo,
        employeeId: newEmployeeId,
        designation: newDesignation,
      });
      setBannerMsg(data.message);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRollNo("");
      setNewEnrollmentNo("");
      setNewEmployeeId("");
      loadAllData();
    } catch (err: any) {
      setBannerMsg(err.response?.data?.message || "Failed to create account.");
    } finally {
      setCreating(false);
    }
  };

  // Bulk Semester Promotion
  const handlePromoteSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !window.confirm(
        `Promote all approved students in ${promoDept} from Semester ${promoFromSem} to Semester ${
          promoFromSem + 1
        }?`
      )
    ) {
      return;
    }
    setPromoting(true);
    setBannerMsg("");
    try {
      const { data } = await api.post("/admin/promote-semester", {
        department: promoDept,
        fromSemester: promoFromSem,
      });
      setBannerMsg(data.message);
      loadAllData();
    } catch (err: any) {
      setBannerMsg(err.response?.data?.message || "Promotion failed.");
    } finally {
      setPromoting(false);
    }
  };

  // Approval & Override Actions
  const handleUserApproval = async (id: string, status: "Approved" | "Rejected") => {
    await api.patch(`/admin/users/${id}/approval`, { status });
    setBannerMsg(`Account status changed to ${status}.`);
    loadAllData();
  };

  const handleRequestAction = async (id: string, status: "Approved" | "Rejected") => {
    await api.patch(`/admin/profile-requests/${id}`, { status });
    setBannerMsg(`Profile update request ${status.toLowerCase()}.`);
    loadAllData();
  };

  const handleLeaveOverride = async (id: string, status: "Approved" | "Rejected") => {
    await api.patch(`/leaves/${id}`, { status, reviewedBy: `${user?.name} (Admin)` });
    setBannerMsg(`Student leave application ${status.toLowerCase()} by Admin.`);
    loadAllData();
  };

  const handleCorrectionOverride = async (id: string, status: "Approved" | "Rejected") => {
    await api.patch(`/corrections/${id}`, { status });
    setBannerMsg(`Attendance correction ${status.toLowerCase()} by Admin.`);
    loadAllData();
  };

  // Calendar Events
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
      setBannerMsg("Academic calendar updated! Visible to all Students & Faculty.");
      loadAllData();
    } finally {
      setAddingEv(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await api.delete(`/calendar/${id}`);
    loadAllData();
  };

  // Official Notices
  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMsg.trim()) return;
    setPostingNotice(true);
    try {
      await api.post("/notices", {
        title: noticeTitle.trim(),
        message: noticeMsg.trim(),
        department: noticeDept,
        semester: noticeSem,
        resourceLink: noticeLink.trim() || undefined,
        postedBy: `${user?.name} (Admin)`,
      });
      setNoticeTitle("");
      setNoticeMsg("");
      setNoticeLink("");
      setBannerMsg(`Official circular published to ${noticeDept} Semester ${noticeSem}!`);
      loadAllData();
    } finally {
      setPostingNotice(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    await api.delete(`/notices/${id}`);
    loadAllData();
  };

  const pendingAccounts = users.filter((u) => u.isApproved === false || u.approvalStatus === "Pending");
  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const pendingCorrections = corrections.filter((c) => c.status === "Pending");
  const totalPendingQueue =
    pendingAccounts.length +
    Number(stats.pendingRequests || 0) +
    pendingLeaves.length +
    pendingCorrections.length;

  const filteredUsers = users.filter((u) => {
    const statusLabel = u.approvalStatus || (u.isApproved === false ? "Pending" : "Approved");
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesDept = deptFilter === "all" || u.department === deptFilter;
    const matchesStatus = statusFilter === "all" || statusLabel === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      (u.rollNumber || "").toLowerCase().includes(q) ||
      (u.enrollmentNumber || "").toLowerCase().includes(q) ||
      (u.employeeId || "").toLowerCase().includes(q);
    return matchesRole && matchesDept && matchesStatus && matchesSearch;
  });

  const exportDirectoryCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = [
      "Name",
      "Email",
      "Role",
      "Department",
      "Semester",
      "Roll / Employee ID",
      "Phone",
      "Status",
    ];
    const rows = filteredUsers.map((u) => {
      const statusLabel = u.approvalStatus || (u.isApproved === false ? "Pending" : "Approved");
      const idVal = u.role === "student" ? u.rollNumber || "" : u.employeeId || "";
      return [
        `"${u.name}"`,
        u.email,
        u.role.toUpperCase(),
        `"${u.department || ""}"`,
        u.role === "student" ? u.semester || 1 : "-",
        `"${idVal}"`,
        `"${u.phone || ""}"`,
        statusLabel,
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `intellicampus_directory_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* EDIT ANY STUDENT / TEACHER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveUserEdit}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Master Admin Override
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Edit User Account — {editingUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingUser.email || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher / Faculty</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch / Department
                </label>
                <select
                  value={editingUser.department || "Computer Science"}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={
                    editingUser.approvalStatus ||
                    (editingUser.isApproved === false ? "Pending" : "Approved")
                  }
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, approvalStatus: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  <option value="Approved">Approved (Active)</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Rejected">Suspended / Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingUser.phone || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {editingUser.role === "student" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={editingUser.semester || 1}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, semester: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Class Roll Number
                    </label>
                    <input
                      type="text"
                      value={editingUser.rollNumber || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, rollNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Enrollment No
                    </label>
                    <input
                      type="text"
                      value={editingUser.enrollmentNumber || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, enrollmentNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Program</label>
                    <input
                      type="text"
                      value={editingUser.program || "B.Tech"}
                      onChange={(e) => setEditingUser({ ...editingUser, program: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      value={editingUser.section || "Section A"}
                      onChange={(e) => setEditingUser({ ...editingUser, section: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}

              {editingUser.role === "teacher" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={editingUser.employeeId || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, employeeId: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={editingUser.designation || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, designation: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Qualification
                    </label>
                    <input
                      type="text"
                      value={editingUser.qualification || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, qualification: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingUser}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm"
              >
                {savingUser ? "Saving Changes..." : "Save User Details"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {passwordTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handlePasswordReset}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" /> Reset Account Password
              </h3>
              <button
                type="button"
                onClick={() => setPasswordTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Set a new login password for <strong>{passwordTarget.name}</strong> (
              {passwordTarget.email}).
            </p>
            <input
              type="text"
              required
              minLength={4}
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Enter new password..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasswordTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resettingPwd}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                {resettingPwd ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Top Admin Control Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Campus Administration Master Control Center
                </h1>
                <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Logged in as {user?.name} (
                  {user?.email})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportDirectoryCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bulk")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <UserPlus className="w-4 h-4" /> + Create Student / Faculty / Admin
              </button>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 w-fit">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "directory"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" /> Student & Faculty Control ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("approvals")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "approvals"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-4 h-4" /> Approvals & Overrides
              {totalPendingQueue > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                  {totalPendingQueue}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "calendar"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarPlus className="w-4 h-4" /> Calendar & Official Notices
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === "bulk"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> Create Account & Semester Promotion
            </button>
          </div>
        </div>

        {bannerMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
            <span>{bannerMsg}</span>
            <button onClick={() => setBannerMsg("")} className="text-emerald-700 hover:text-emerald-950">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
              <p className="text-xs font-semibold text-slate-500 uppercase">Active Admins</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.totalAdmins || 1}</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-indigo-200" />
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between col-span-2 lg:col-span-1">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Pending Requests</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {Number(stats.pendingRequests || 0) + pendingLeaves.length + pendingCorrections.length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-amber-200" />
          </div>
        </div>

        {/* TAB 1: COMPLETE STUDENT & FACULTY DIRECTORY + INLINE CONTROLS */}
        {activeTab === "directory" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <span className="font-bold text-slate-900">
                Complete Campus Directory ({filteredUsers.length})
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, email, roll, Emp ID..."
                    className="pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Faculty</option>
                  <option value="admin">Admins</option>
                </select>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">All Branches</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">All Status</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Suspended</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Name & ID</th>
                    <th className="py-3 px-4 font-semibold">Role & Academic Info</th>
                    <th className="py-3 px-4 font-semibold">Telemetry / Standing</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Admin Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((u) => {
                    const statusLabel =
                      u.approvalStatus || (u.isApproved === false ? "Pending" : "Approved");
                    const telemetry = u.role === "student" ? getStudentTelemetry(u._id) : null;
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                          {u.role === "student" && (u.rollNumber || u.enrollmentNumber) && (
                            <p className="text-[11px] font-medium text-blue-700 mt-0.5">
                              {u.rollNumber ? `Roll: ${u.rollNumber}` : ""}{" "}
                              {u.enrollmentNumber ? `• Enr: ${u.enrollmentNumber}` : ""}
                            </p>
                          )}
                          {u.role === "teacher" && u.employeeId && (
                            <p className="text-[11px] font-medium text-indigo-700 mt-0.5">
                              Emp ID: {u.employeeId}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.role === "admin"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : u.role === "teacher"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {u.role}
                          </span>
                          <p className="text-xs text-slate-700 font-medium mt-1">
                            {u.department}{" "}
                            {u.role === "student" ? `• Sem ${u.semester || 1}` : ""}
                          </p>
                          {u.role === "teacher" && u.designation && (
                            <p className="text-[11px] text-slate-500">{u.designation}</p>
                          )}
                        </td>

                        <td className="py-3 px-4 text-xs">
                          {u.role === "student" && telemetry ? (
                            <div className="space-y-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-bold ${
                                  telemetry.attendancePct < 75
                                    ? "bg-red-50 text-red-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                Att: {telemetry.attendancePct}%
                              </span>{" "}
                              <span className="text-slate-600 font-semibold">
                                • Avg: {telemetry.avgMarksPct}%
                              </span>
                            </div>
                          ) : u.role === "teacher" ? (
                            <span className="text-slate-500">
                              {u.qualification || "Faculty Member"}
                            </span>
                          ) : (
                            <span className="text-slate-400">System Administrator</span>
                          )}
                        </td>

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
                            {statusLabel === "Rejected" ? "Suspended" : statusLabel}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingUser({ ...u })}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                              title="Edit Profile & Role"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPasswordTarget(u);
                                setNewPasswordInput("");
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {statusLabel === "Approved" ? (
                              <button
                                type="button"
                                onClick={() => handleUserApproval(u._id, "Rejected")}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700"
                                title="Suspend Account"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUserApproval(u._id, "Approved")}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                title="Approve / Activate Account"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            {u._id !== user?.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                title="Delete Account Permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        No users match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ALL APPROVALS & ADMIN OVERRIDE QUEUES */}
        {activeTab === "approvals" && (
          <div className="space-y-6">
            {/* 1. New Account Registration Approvals */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-rose-50/50 font-bold text-slate-900 flex items-center justify-between">
                <span>New Student & Faculty Registration Approvals ({pendingAccounts.length})</span>
                <span className="text-xs font-medium text-slate-500">
                  Users cannot sign in until approved
                </span>
              </div>
              <div className="divide-y divide-slate-200">
                {pendingAccounts.map((acc) => (
                  <div
                    key={acc._id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 text-sm">{acc.name}</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {acc.email} • Dept: {acc.department}{" "}
                        {acc.rollNumber ? `• Roll: ${acc.rollNumber}` : ""}
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
                  <p className="p-6 text-center text-xs text-slate-400">
                    No pending account registrations.
                  </p>
                )}
              </div>
            </div>

            {/* 2. Student & Faculty Official Record Update Requests */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900">
                Student & Faculty Record Change Requests ({requests.length})
              </div>
              <div className="divide-y divide-slate-200">
                {requests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {req.studentId?.name || "User"}{" "}
                        <span className="text-xs uppercase font-bold text-indigo-600">
                          ({req.studentId?.role || "student"})
                        </span>{" "}
                        • {req.studentId?.email}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Requested Update:{" "}
                        <span className="font-mono text-blue-700 font-semibold">
                          {JSON.stringify(req.requestedChanges)}
                        </span>
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
                            <Check className="w-3.5 h-3.5" /> Approve & Apply
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
                  <p className="p-6 text-center text-xs text-slate-400">
                    No profile change requests in queue.
                  </p>
                )}
              </div>
            </div>

            {/* 3. Admin Override: Student Medical & Duty Leaves + Attendance Corrections */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pending Leaves */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 text-sm flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" /> Student Leave Requests Override (
                  {pendingLeaves.length} Pending)
                </div>
                <div className="divide-y divide-slate-200 max-h-72 overflow-y-auto">
                  {pendingLeaves.map((lv) => (
                    <div key={lv._id} className="p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          {lv.studentId?.name} ({lv.leaveType})
                        </span>
                        <span className="text-slate-500">
                          {new Date(lv.fromDate).toLocaleDateString("en-IN")} –{" "}
                          {new Date(lv.toDate).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      <p className="text-slate-600">Reason: {lv.reason}</p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleLeaveOverride(lv._id, "Approved")}
                          className="px-3 py-1 rounded bg-emerald-600 text-white font-semibold"
                        >
                          Approve Leave
                        </button>
                        <button
                          onClick={() => handleLeaveOverride(lv._id, "Rejected")}
                          className="px-3 py-1 rounded bg-red-600 text-white font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingLeaves.length === 0 && (
                    <p className="p-6 text-center text-xs text-slate-400">
                      No pending student leave applications.
                    </p>
                  )}
                </div>
              </div>

              {/* Pending Attendance Corrections */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4 text-amber-600" /> Attendance Corrections
                  Override ({pendingCorrections.length} Pending)
                </div>
                <div className="divide-y divide-slate-200 max-h-72 overflow-y-auto">
                  {pendingCorrections.map((c) => (
                    <div key={c._id} className="p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          {c.studentId?.name} — {c.subject}
                        </span>
                        <span className="text-slate-500">
                          {new Date(c.date).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      <p className="text-slate-600">Reason: "{c.reason}"</p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleCorrectionOverride(c._id, "Approved")}
                          className="px-3 py-1 rounded bg-emerald-600 text-white font-semibold"
                        >
                          Approve (Mark Present)
                        </button>
                        <button
                          onClick={() => handleCorrectionOverride(c._id, "Rejected")}
                          className="px-3 py-1 rounded bg-red-600 text-white font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingCorrections.length === 0 && (
                    <p className="p-6 text-center text-xs text-slate-400">
                      No pending attendance correction requests.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CALENDAR & OFFICIAL NOTICES */}
        {activeTab === "calendar" && (
          <div className="space-y-6">
            {/* Academic Calendar & Holiday Publisher */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-blue-600" /> Academic Calendar & Holiday
                Publisher
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
                        {new Date(ev.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
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
                  <p className="p-5 text-center text-xs text-slate-400">
                    No holidays or events published yet.
                  </p>
                )}
              </div>
            </div>

            {/* Official Campus Circular / Notice Broadcaster */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" /> Official Campus Notice & Circular
                Broadcaster
              </div>
              <form onSubmit={handlePostNotice} className="p-4 border-b border-slate-200 space-y-3">
                <div className="grid sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="Circular Title (e.g. Exam Form Deadline)"
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                  <select
                    value={noticeDept}
                    onChange={(e) => setNoticeDept(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    {DEPARTMENTS.filter((d) => d !== "Administration").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={noticeSem}
                    onChange={(e) => setNoticeSem(Number(e.target.value))}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={noticeLink}
                    onChange={(e) => setNoticeLink(e.target.value)}
                    placeholder="Optional Circular PDF URL"
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    value={noticeMsg}
                    onChange={(e) => setNoticeMsg(e.target.value)}
                    placeholder="Write official notice details..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                  <button
                    type="submit"
                    disabled={postingNotice}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                  >
                    {postingNotice ? "Publishing..." : "Broadcast Circular"}
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-200 max-h-60 overflow-y-auto">
                {notices.map((n) => (
                  <div key={n._id} className="p-4 flex items-start justify-between gap-4 text-sm">
                    <div>
                      <span className="font-bold text-slate-900">{n.title}</span>{" "}
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold ml-1">
                        {n.department} • Sem {n.semester}
                      </span>
                      <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                      {n.resourceLink && (
                        <a
                          href={n.resourceLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Attachment
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
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CREATE VERIFIED ACCOUNTS & BULK SEMESTER PROMOTION */}
        {activeTab === "bulk" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Create Verified Account Form */}
            <form
              onSubmit={handleCreateUser}
              className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" /> Create Verified Student / Faculty /
                  Admin Account
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accounts created here bypass the approval queue and can log in immediately.
                </p>
              </div>

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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@university.edu"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Set login password"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Faculty / Teacher</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {newRole === "student" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Semester
                      </label>
                      <select
                        value={newSemester}
                        onChange={(e) => setNewSemester(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        value={newRollNo}
                        onChange={(e) => setNewRollNo(e.target.value)}
                        placeholder="e.g. 230"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Enrollment Number
                      </label>
                      <input
                        type="text"
                        value={newEnrollmentNo}
                        onChange={(e) => setNewEnrollmentNo(e.target.value)}
                        placeholder="e.g. EN26CS230"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}

                {newRole === "teacher" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={newEmployeeId}
                        onChange={(e) => setNewEmployeeId(e.target.value)}
                        placeholder="e.g. FAC-105"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={newDesignation}
                        onChange={(e) => setNewDesignation(e.target.value)}
                        placeholder="Assistant Professor"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                {creating ? "Creating Account..." : "Create & Verify Account"}
              </button>
            </form>

            {/* Bulk Semester Promotion Tool */}
            <form
              onSubmit={handlePromoteSemester}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-indigo-600" /> Bulk Semester Promotion
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Promote all verified students of a branch to the next semester in 1 click.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Branch
                  </label>
                  <select
                    value={promoDept}
                    onChange={(e) => setPromoDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    {DEPARTMENTS.filter((d) => d !== "Administration").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Promote From Semester
                  </label>
                  <select
                    value={promoFromSem}
                    onChange={(e) => setPromoFromSem(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                      <option key={s} value={s}>
                        Semester {s} → Semester {s + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={promoting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                {promoting
                  ? "Promoting Batch..."
                  : `Promote Batch to Sem ${promoFromSem + 1}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

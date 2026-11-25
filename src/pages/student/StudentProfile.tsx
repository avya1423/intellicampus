import React, { useEffect, useState } from "react";
import { StudentLayout } from "../../components/layouts/StudentLayout";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";
import { UserCircle, Mail, Building2, Hash, GraduationCap, Send, Clock, CheckCircle2, XCircle } from "lucide-react";

export const StudentProfile: React.FC = () => {
  const { user, token, login } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "Computer Science");
  const [semester, setSemester] = useState(user?.semester || 1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Official correction request state
  const [reqField, setReqField] = useState("rollNumber");
  const [reqValue, setReqValue] = useState("");
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [submittingReq, setSubmittingReq] = useState(false);

  const loadRequests = () => {
    api.get("/users/my-requests").then((res) => setRequests(res.data)).catch(console.error);
  };

  useEffect(() => {
    api.get("/users/profile").then((res) => {
      if (res.data) {
        setName(res.data.name);
        setDepartment(res.data.department);
        setSemester(res.data.semester || 1);
      }
    });
    loadRequests();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const { data } = await api.patch("/users/profile", {
        name,
        department,
        semester: Number(semester),
        rollNumber: user?.rollNumber,
      });
      if (token && user) {
        login(token, { ...user, name: data.name, department: data.department, semester: data.semester });
      }
      setMsg("Profile updated successfully!");
    } catch {
      setMsg("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqValue.trim() || !reason.trim()) return;
    setSubmittingReq(true);
    try {
      await api.post("/users/profile-request", {
        requestedChanges: { [reqField]: reqField === "semester" ? Number(reqValue) : reqValue },
        reason,
      });
      setReqValue("");
      setReason("");
      loadRequests();
      setMsg("Official profile correction request sent to Admin!");
    } finally {
      setSubmittingReq(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Student Identity Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-2xl">
              {user?.name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {user?.role}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user?.email}</span>
                <span className="inline-flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> Roll: {user?.rollNumber || "Not Assigned"}</span>
                <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {user?.department}</span>
                <span className="inline-flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Semester {user?.semester || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            {msg}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Edit Basic Details */}
          <form onSubmit={handleProfileSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-600" /> Personal & Academic Details
            </h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              {saving ? "Saving..." : "Save Profile Changes"}
            </button>
          </form>

          {/* Official Admin Correction Request */}
          <form onSubmit={handleRequestSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Request Official Record Correction</h2>
            <p className="text-xs text-slate-500">
              Need an official change to your University Roll Number or Department record? Submit a request for Admin verification.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Field to Update</label>
                <select
                  value={reqField}
                  onChange={(e) => setReqField(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  <option value="rollNumber">Roll Number</option>
                  <option value="department">Department</option>
                  <option value="name">Official Legal Name</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Value</label>
                <input
                  type="text"
                  required
                  value={reqValue}
                  onChange={(e) => setReqValue(e.target.value)}
                  placeholder="e.g. CS2026-205"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Supporting Note</label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mention enrollment slip ID or correction reason..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submittingReq}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {submittingReq ? "Submitting..." : "Submit Request to Admin"}
            </button>
          </form>
        </div>

        {/* Request Status History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 text-sm">
            My Profile Correction Requests History
          </div>
          <div className="divide-y divide-slate-200">
            {requests.map((r) => (
              <div key={r._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">
                    Requested Change: <span className="text-blue-600">{JSON.stringify(r.requestedChanges)}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Reason: {r.reason}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold w-fit ${
                    r.status === "Approved"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : r.status === "Rejected"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {r.status === "Approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {r.status === "Rejected" && <XCircle className="w-3.5 h-3.5" />}
                  {r.status === "Pending" && <Clock className="w-3.5 h-3.5" />}
                  {r.status}
                </span>
              </div>
            ))}
            {requests.length === 0 && (
              <p className="p-6 text-center text-xs text-slate-400">No profile correction requests submitted yet.</p>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

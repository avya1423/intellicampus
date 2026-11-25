import React, { useEffect, useState } from "react";
import { TeacherLayout } from "../../components/layouts/TeacherLayout";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";
import { Mail, Building2, ShieldCheck, Users, AlertTriangle } from "lucide-react";

export const TeacherProfile: React.FC = () => {
  const { user, token, login } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "Computer Science");
  const [summary, setSummary] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/risk/all").then((res) => setSummary(res.data.summary)).catch(console.error);
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/users/profile", { name, department });
      if (token && user) {
        login(token, { ...user, name: data.name, department: data.department });
      }
      setMsg("Faculty profile updated successfully!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-2xl">
            {user?.name?.charAt(0).toUpperCase() || "F"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                Faculty
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user?.email}</span>
              <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {user?.department}</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Instructor</span>
            </div>
          </div>
        </div>

        {summary && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Students Monitored</p>
                <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-50 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">High Risk Alerts</p>
                <p className="text-2xl font-bold text-red-600">{summary.highRisk}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdate} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl">
          <h2 className="text-lg font-bold text-slate-900">Edit Faculty Profile</h2>
          {msg && <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm">{msg}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Faculty Name</label>
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
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
          >
            {saving ? "Updating..." : "Update Faculty Details"}
          </button>
        </form>
      </div>
    </TeacherLayout>
  );
};

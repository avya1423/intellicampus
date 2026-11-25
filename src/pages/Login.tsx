import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BrainCircuit, CheckCircle2 } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { Navbar } from "../components/Navbar";

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [department, setDepartment] = useState("Computer Science");
  const [rollNumber, setRollNumber] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister
        ? { name, email, password, role, department, rollNumber }
        : { email, password };
      const { data } = await api.post(endpoint, payload);

      if (data.pendingApproval) {
        setSuccessMsg(data.message);
        setIsRegister(false);
        setPassword("");
        return;
      }

      login(data.token, data.user);

      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "teacher") navigate("/teacher");
      else navigate("/student");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials or server unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        <div className="bg-white w-full max-w-md p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-center mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <BrainCircuit className="w-6 h-6" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-1">
            {isRegister ? "Campus Portal Registration" : "Institutional Sign In"}
          </h2>
          <p className="text-sm text-slate-500 text-center mb-6">
            {isRegister
              ? "New accounts require Campus Administrator approval"
              : "Enter your verified institutional credentials"}
          </p>

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Faculty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {role === "student" ? "University Roll No" : "Department"}
                    </label>
                    {role === "student" ? (
                      <input
                        type="text"
                        required
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder="e.g. CS2026-101"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Institutional Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm transition"
            >
              {loading ? "Processing..." : isRegister ? "Submit for Approval" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 pt-4 border-t border-slate-100 text-center text-sm text-slate-600">
            {isRegister ? "Already verified?" : "New to IntelliCampus?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setSuccessMsg("");
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isRegister ? "Sign In" : "Request Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

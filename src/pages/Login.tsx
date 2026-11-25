import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { Navbar } from "../components/Navbar";

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("student@intellicampus.edu");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState("student");
  const [department, setDepartment] = useState("Computer Science");
  const [rollNumber, setRollNumber] = useState("CS2026-105");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister
        ? { name, email, password, role, department, rollNumber }
        : { email, password };
      const { data } = await api.post(endpoint, payload);
      login(data.token, data.user);

      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "teacher") navigate("/teacher");
      else navigate("/student");
    } catch (err: any) {
      setError(err.response?.data?.message || "Authentication failed. Ensure backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white w-full max-w-md p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            {isRegister ? "Create IntelliCampus Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-slate-500 text-center mb-6">
            {isRegister ? "Register as Student, Teacher, or Admin" : "Sign in to access your role dashboard"}
          </p>

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
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Anjali Kumari"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Roll No (Students)</label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm transition"
            >
              {loading ? "Please wait..." : isRegister ? "Register" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1.5">
            <p className="font-semibold text-slate-700">Quick Demo Logins (after npm run seed):</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setEmail("student@intellicampus.edu"); setPassword("password123"); setIsRegister(false); }}
                className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-blue-50 hover:text-blue-700 font-medium"
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => { setEmail("teacher@intellicampus.edu"); setPassword("password123"); setIsRegister(false); }}
                className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-blue-50 hover:text-blue-700 font-medium"
              >
                Teacher Demo
              </button>
              <button
                type="button"
                onClick={() => { setEmail("admin@intellicampus.edu"); setPassword("password123"); setIsRegister(false); }}
                className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-blue-50 hover:text-blue-700 font-medium"
              >
                Admin Demo
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-slate-600">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isRegister ? "Sign In" : "Create Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, AlertTriangle, UserCircle } from "lucide-react";
import { Navbar } from "../Navbar";

export const TeacherLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const navItems = [
    { label: "Classroom & Marks Entry", path: "/teacher", icon: Users },
    { label: "AI Risk Analytics", path: "/teacher/risk", icon: AlertTriangle },
    { label: "Faculty Profile", path: "/teacher/profile", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="max-w-7xl w-full mx-auto px-4 py-6 flex flex-col md:flex-row gap-6 flex-1">
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

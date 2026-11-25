import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrainCircuit, LogOut, Home as HomeIcon } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const dashboardPath =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "teacher"
      ? "/teacher"
      : "/student";

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to={user ? dashboardPath : "/"}
          className="flex items-center gap-2.5 font-bold text-xl text-blue-600"
        >
          <BrainCircuit className="w-7 h-7" />
          <span className="tracking-tight text-slate-900">
            Intelli<span className="text-blue-600">Campus</span>
          </span>
        </Link>

        {/* Public Navigation (Only shown when NOT logged in) */}
        {!user && (
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <Link
              to="/"
              className={`inline-flex items-center gap-1.5 transition ${
                pathname === "/" ? "text-blue-600 font-semibold" : "hover:text-blue-600"
              }`}
            >
              <HomeIcon className="w-4 h-4" /> Home
            </Link>
            <Link
              to="/features"
              className={`transition ${
                pathname === "/features" ? "text-blue-600 font-semibold" : "hover:text-blue-600"
              }`}
            >
              Capabilities
            </Link>
            <Link
              to="/architecture"
              className={`transition ${
                pathname === "/architecture" ? "text-blue-600 font-semibold" : "hover:text-blue-600"
              }`}
            >
              Academic Framework
            </Link>
          </div>
        )}

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {pathname !== "/" && (
                <Link
                  to="/"
                  className="md:hidden text-sm font-medium text-slate-600 hover:text-blue-600"
                >
                  Home
                </Link>
              )}
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm transition"
              >
                Portal Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

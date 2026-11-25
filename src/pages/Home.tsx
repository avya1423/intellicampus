import React from "react";
import { Link } from "react-router-dom";
import {
  BrainCircuit,
  ShieldAlert,
  BarChart3,
  Sparkles,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Activity,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useAuth } from "../auth/AuthContext";

export const Home: React.FC = () => {
  const { user } = useAuth();
  const dashboardPath =
    user?.role === "admin" ? "/admin" : user?.role === "teacher" ? "/teacher" : "/student";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 via-white to-slate-50 border-b border-slate-200 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Enterprise Academic Intelligence & Predictive Analytics
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Smarter Campus Governance & <br className="hidden sm:inline" />
            <span className="text-blue-600">Proactive Student Success</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            IntelliCampus unifies daily attendance tracking, continuous assessment analytics, and AI-driven early risk intervention into a single secure platform for Students, Faculty, and Administration.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to={user ? dashboardPath : "/login"}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white shadow-sm transition"
            >
              {user ? "Go to My Dashboard" : "Access Institutional Portal"} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/features"
              className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 font-semibold text-slate-700 border border-slate-300 shadow-sm transition"
            >
              Explore Platform Capabilities
            </Link>
          </div>

          {/* Institutional Metrics */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-2xl font-extrabold text-blue-600">Real-Time</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Attendance & Grade Sync</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-2xl font-extrabold text-emerald-600">3-Tier RBAC</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Role-Based Access Security</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-2xl font-extrabold text-amber-600">75% Threshold</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Automated Early Risk Alerts</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-2xl font-extrabold text-indigo-600">AI Advisor</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Personalized Study & Mentoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Built for Modern Academic Institutions</h2>
          <p className="text-slate-600 mt-2 text-sm">
            Continuous academic telemetry paired with AI guidance to support every student before final examinations.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Early Risk Scoring Engine</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Evaluates attendance percentage (45% weight), exam scores (40% weight), and historical GPA trends (15% weight) to classify academic risk accurately.
            </p>
          </div>
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <BrainCircuit className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">AI Academic Mentor</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Provides students with 24/7 personalized study strategies and equips faculty with structured 3-step mentoring intervention plans.
            </p>
          </div>
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Verified Records & Governance</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Subject-wise attendance logs, exam mark sheets, and admin-approved student record corrections managed cleanly through role portals.
            </p>
          </div>
        </div>
      </section>

      {/* Role-Based Portals Detailed Section */}
      <section className="bg-white border-y border-slate-200 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Dedicated Workspace for Every Role</h2>
            <p className="text-slate-600 mt-2 text-sm">
              Tailored tools and permissions for students, faculty members, and university administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold mb-4">
                  <GraduationCap className="w-4 h-4" /> Student Portal
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Track Progress & Consult AI Advisor</h3>
                <ul className="space-y-2.5 text-sm text-slate-600 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    Live attendance percentage & subject-wise logs
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    Midterm, quiz & assignment mark breakdowns
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    Personal AI Study Advisor & Profile Management
                  </li>
                </ul>
              </div>
              <Link to="/login" className="text-sm font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
                Student Login <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold mb-4">
                  <Users className="w-4 h-4" /> Faculty Portal
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Classroom Logs & Risk Analytics</h3>
                <ul className="space-y-2.5 text-sm text-slate-600 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Streamlined daily attendance & marks entry
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Class-wide student risk matrix & early alerts
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    AI-generated student mentoring action plans
                  </li>
                </ul>
              </div>
              <Link to="/login" className="text-sm font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1">
                Faculty Login <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold mb-4">
                  <ShieldCheck className="w-4 h-4" /> Admin Control Center
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Governance & Directory Control</h3>
                <ul className="space-y-2.5 text-sm text-slate-600 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    Searchable university directory of students & faculty
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    Approve or reject student profile update requests
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    Departmental oversight & institutional metrics
                  </li>
                </ul>
              </div>
              <Link to="/login" className="text-sm font-semibold text-indigo-700 hover:underline inline-flex items-center gap-1">
                Administrator Login <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Workflow */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Academic Intelligence Pipeline</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">1</span>
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900">Continuous Data Capture</h4>
            </div>
            <p className="text-sm text-slate-600">
              Faculty record lecture attendance and exam evaluations directly into the central academic database.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">2</span>
              <Activity className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900">Automated Risk Evaluation</h4>
            </div>
            <p className="text-sm text-slate-600">
              Weighted analytics recalculate student risk scores (0–100) dynamically as new academic data arrives.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">3</span>
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900">Targeted Interventions</h4>
            </div>
            <p className="text-sm text-slate-600">
              Students receive personalized study advice while faculty generate structured mentoring action plans.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

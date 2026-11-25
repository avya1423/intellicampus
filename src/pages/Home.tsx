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

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 via-white to-slate-50 border-b border-slate-200 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini AI & Predictive Campus Analytics
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Smarter Campus Decisions & <br className="hidden sm:inline" />
            <span className="text-blue-600">Proactive Student Success</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            IntelliCampus unifies daily attendance tracking, continuous exam evaluations, and AI-driven dropout risk detection into one seamless platform for Students, Faculty, and Administrators.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white shadow-sm transition"
            >
              Launch Campus Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/demo"
              className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 font-semibold text-slate-700 border border-slate-300 shadow-sm transition"
            >
              View Analytics Sandbox
            </Link>
          </div>

          {/* Quick Campus Metrics Strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-2xl font-extrabold text-blue-600">98.4%</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Attendance Accuracy</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-2xl font-extrabold text-emerald-600">3-Role</p>
              <p className="text-xs font-medium text-slate-500 mt-1">RBAC Security Access</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-2xl font-extrabold text-amber-600">Early Alert</p>
              <p className="text-xs font-medium text-slate-500 mt-1">&lt;75% Attendance Flagging</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-2xl font-extrabold text-indigo-600">Gemini 2.5</p>
              <p className="text-xs font-medium text-slate-500 mt-1">AI Mentor & Interventions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Built for Modern Academic Ecosystems</h2>
          <p className="text-slate-600 mt-2 text-sm">
            Real-time telemetry combined with generative AI guidance to support every learner before finals arrive.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Early Risk Scoring Engine</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Evaluates attendance percentage (45% weight), exam scores (40% weight), and historical GPA trends (15% weight) to classify risk from Low to Critical.
            </p>
          </div>
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <BrainCircuit className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Gemini AI Academic Mentor</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Provides students with 24/7 personalized study strategies and equips faculty with 3-step mentoring action plans for at-risk students.
            </p>
          </div>
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Transparent Records & Profiles</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Subject-wise attendance logs, midterm & quiz mark sheets, and verified profile update requests managed cleanly through role dashboards.
            </p>
          </div>
        </div>
      </section>

      {/* Role-Based Portals Detailed Section */}
      <section className="bg-white border-y border-slate-200 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Dedicated Dashboards for Every Role</h2>
            <p className="text-slate-600 mt-2 text-sm">
              Tailored tools and permissions for students, teachers, and campus administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Student Card */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold mb-4">
                  <GraduationCap className="w-4 h-4" /> Student Portal
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Track Progress & Chat with AI</h3>
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
                Sign in as Student <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Teacher Card */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold mb-4">
                  <Users className="w-4 h-4" /> Faculty Portal
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Classroom Logs & AI Risk Matrix</h3>
                <ul className="space-y-2.5 text-sm text-slate-600 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    One-click daily attendance & marks upload
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Class-wide student risk heatmap & analytics
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    One-click Gemini AI intervention plan generator
                  </li>
                </ul>
              </div>
              <Link to="/login" className="text-sm font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1">
                Sign in as Faculty <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Admin Card */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold mb-4">
                  <ShieldCheck className="w-4 h-4" /> Admin Control Center
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Governance & Directory Control</h3>
                <ul className="space-y-2.5 text-sm text-slate-600 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    Full campus directory of students & faculty
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    Review & approve student profile change requests
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    Institution-wide enrollment & system health metrics
                  </li>
                </ul>
              </div>
              <Link to="/login" className="text-sm font-semibold text-indigo-700 hover:underline inline-flex items-center gap-1">
                Sign in as Admin <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Pipeline */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">How IntelliCampus Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">1</span>
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900">Continuous Data Capture</h4>
            </div>
            <p className="text-sm text-slate-600">
              Faculty log daily lecture attendance and exam scores directly into MongoDB Atlas through secure role endpoints.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">2</span>
              <Activity className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900">Real-Time Risk Scoring</h4>
            </div>
            <p className="text-sm text-slate-600">
              Our weighted risk engine automatically recalculates each student's risk score (0–100) whenever new marks or attendance arrive.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">3</span>
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900">Gemini AI Action Plans</h4>
            </div>
            <p className="text-sm text-slate-600">
              Students receive tailored study guidance while teachers generate targeted mentoring checklists in one click.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

import React from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, ShieldAlert, BarChart3, Sparkles } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <section className="bg-gradient-to-b from-blue-50 via-white to-slate-50 border-b border-slate-200/80 py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini AI & Predictive Analytics
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            Proactive Student Success with <span className="text-blue-600">IntelliCampus</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Unified attendance tracking, academic assessment analytics, and real-time AI dropout risk detection for modern universities.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white shadow-sm transition"
            >
              Launch Portal
            </Link>
            <Link
              to="/demo"
              className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 font-semibold text-slate-700 border border-slate-300 shadow-sm transition"
            >
              Explore Interactive Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Early Risk Scoring Engine</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Automatically flags students dipping below 75% attendance or struggling in midterms before final exams arrive.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <BrainCircuit className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Gemini AI Academic Mentor</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Generates personalized study plans for students and 3-step intervention playbooks for faculty members.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Role-Based Campus Portals</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Dedicated dashboards for Administrators, Teachers, and Students secured with JWT authentication.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
};

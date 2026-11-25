import React from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const PageShell: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Navbar />
    <div className="max-w-5xl mx-auto px-4 py-12 flex-1 w-full">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-600 mb-8">{subtitle}</p>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-sm text-slate-700 leading-relaxed">
        {children}
      </div>
    </div>
    <Footer />
  </div>
);

export const Features: React.FC = () => (
  <PageShell title="Platform Features" subtitle="End-to-end academic intelligence and workflow automation">
    <ul className="list-disc pl-5 space-y-2.5">
      <li><strong>Multi-Factor Risk Engine:</strong> Combines live attendance percentage, midterm scores, and historical semester GPA.</li>
      <li><strong>Gemini AI Academic Chatbot:</strong> Context-aware student support for exam preparation and attendance recovery.</li>
      <li><strong>Faculty Intervention Generator:</strong> One-click AI counseling recommendations for high-risk students.</li>
      <li><strong>Role-Based Security:</strong> Protected routes and JWT middleware separating Admin, Teacher, and Student capabilities.</li>
    </ul>
  </PageShell>
);

export const SystemArchitecture: React.FC = () => (
  <PageShell title="System Architecture" subtitle="Modern decoupled MERN + TypeScript + Gemini AI stack">
    <p><strong>Frontend Layer:</strong> React 18, TypeScript, Vite, Tailwind CSS (Light Theme), Recharts, and Axios interceptors.</p>
    <p><strong>API & Auth Layer:</strong> Node.js, Express.js, JWT Bearer Tokens, and Role-Based Access Control middleware.</p>
    <p><strong>Persistence Layer:</strong> MongoDB with Mongoose schemas for Users, Attendance, Marks, HistoricalPerformance, and ProfileRequests.</p>
    <p><strong>Intelligence Layer:</strong> Deterministic Rule-Based Risk Scoring Engine paired with Google Gemini 2.5 Flash generative insights.</p>
  </PageShell>
);

export const MLDesign: React.FC = () => (
  <PageShell title="ML & Predictive Risk Design" subtitle="How IntelliCampus calculates student risk scores (0–100)">
    <p><strong>Attendance Weight (45%):</strong> Students below 60% receive +45 risk points; students between 60% and 75% receive +25 points.</p>
    <p><strong>Assessment Weight (40%):</strong> Average exam scores below 45% add +40 risk points; scores below 65% add +20 points.</p>
    <p><strong>Historical Trend Weight (15%):</strong> Previous semester GPA below 6.0 contributes +15 risk points.</p>
  </PageShell>
);

export const APIDocs: React.FC = () => (
  <PageShell title="REST API Documentation" subtitle="Core backend endpoints exposed at /api">
    <pre className="bg-slate-50 border border-slate-200 text-slate-800 p-4 rounded-xl overflow-x-auto text-xs font-mono">
{`POST /api/auth/register      - Register new user
POST /api/auth/login         - Authenticate and receive JWT
GET  /api/attendance/my      - Student attendance summary & logs
POST /api/attendance/mark    - Teacher marks student attendance
GET  /api/marks/my           - Student exam scores & average
POST /api/marks/add          - Teacher uploads assessment marks
GET  /api/risk/my            - Student personal risk evaluation
GET  /api/risk/all           - Teacher/Admin class-wide risk matrix
POST /api/ai/analyze-student - Generate Gemini intervention plan
POST /api/chatbot/ask        - Conversational AI academic advisor`}
    </pre>
  </PageShell>
);

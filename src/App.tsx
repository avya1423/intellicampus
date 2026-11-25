import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RoleRoute } from "./auth/RoleRoute";

import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { DemoDashboard } from "./pages/DemoDashboard";
import { Features, SystemArchitecture, MLDesign, APIDocs } from "./pages/InfoPages";
import { StudentPanel } from "./pages/StudentPanel";
import { AttendancePage } from "./pages/student/AttendancePage";
import { MarksPage } from "./pages/student/MarksPage";
import { StudentProfile } from "./pages/student/StudentProfile";
import { TeacherPanel } from "./pages/TeacherPanel";
import { TeacherRiskDashboard } from "./pages/TeacherRiskDashboard";
import { TeacherProfile } from "./pages/teacher/TeacherProfile";
import { AcademicCalendarPage } from "./pages/AcademicCalendarPage";
import { AdminPanel } from "./pages/AdminPanel";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/demo" element={<DemoDashboard />} />
          <Route path="/features" element={<Features />} />
          <Route path="/architecture" element={<SystemArchitecture />} />
          <Route path="/ml-design" element={<MLDesign />} />
          <Route path="/api-docs" element={<APIDocs />} />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <RoleRoute allowedRoles={["student"]}>
                <StudentPanel />
              </RoleRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <RoleRoute allowedRoles={["student"]}>
                <AttendancePage />
              </RoleRoute>
            }
          />
          <Route
            path="/student/marks"
            element={
              <RoleRoute allowedRoles={["student"]}>
                <MarksPage />
              </RoleRoute>
            }
          />
          <Route
            path="/student/calendar"
            element={
              <RoleRoute allowedRoles={["student"]}>
                <AcademicCalendarPage />
              </RoleRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <RoleRoute allowedRoles={["student"]}>
                <StudentProfile />
              </RoleRoute>
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher"
            element={
              <RoleRoute allowedRoles={["teacher", "admin"]}>
                <TeacherPanel />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/risk"
            element={
              <RoleRoute allowedRoles={["teacher", "admin"]}>
                <TeacherRiskDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/calendar"
            element={
              <RoleRoute allowedRoles={["teacher", "admin"]}>
                <AcademicCalendarPage />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <RoleRoute allowedRoles={["teacher", "admin"]}>
                <TeacherProfile />
              </RoleRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <AdminPanel />
              </RoleRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

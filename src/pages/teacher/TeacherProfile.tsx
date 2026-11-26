import React, { useEffect, useState } from "react";
import { TeacherLayout } from "../../components/layouts/TeacherLayout";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";
import {
  Mail,
  Building2,
  Hash,
  GraduationCap,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  HeartPulse,
  BadgeCheck,
  Printer,
  Briefcase,
  BookOpen,
  Award,
  UserCircle,
} from "lucide-react";

interface RoutineSlot {
  _id: string;
  department: string;
  semester: number;
  dayOfWeek: string;
  subject: string;
  timeSlot: string;
  teacherName?: string;
}

export const TeacherProfile: React.FC = () => {
  const { user, token, login } = useAuth();

  // Faculty & Institution Fields
  const [name, setName] = useState(user?.name || "");
  const [collegeName, setCollegeName] = useState("IntelliCampus Institute of Technology");
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [department, setDepartment] = useState(user?.department || "Computer Science");
  const [qualification, setQualification] = useState("M.Tech / Ph.D.");
  const [specialization, setSpecialization] = useState("");
  const [experienceYears, setExperienceYears] = useState("5 Years");
  const [cabinLocation, setCabinLocation] = useState("");
  const [officeHours, setOfficeHours] = useState("Mon - Fri, 02:00 PM - 04:00 PM");

  // Personal & Emergency Contact Fields
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [address, setAddress] = useState("");

  // Live Teaching Workload Telemetry
  const [routineSlots, setRoutineSlots] = useState<RoutineSlot[]>([]);
  const [deptStudentCount, setDeptStudentCount] = useState<number>(0);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Official Admin Record Change Request State
  const [reqField, setReqField] = useState("designation");
  const [reqValue, setReqValue] = useState("");
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [submittingReq, setSubmittingReq] = useState(false);

  const loadRequests = () => {
    api.get("/users/my-requests").then((res) => setRequests(res.data)).catch(console.error);
  };

  useEffect(() => {
    api
      .get("/users/profile")
      .then((res) => {
        const p = res.data;
        if (p) {
          setName(p.name || "");
          setCollegeName(p.collegeName || "IntelliCampus Institute of Technology");
          setEmployeeId(p.employeeId || "");
          setDesignation(p.designation || "Assistant Professor");
          setDepartment(p.department || "Computer Science");
          setQualification(p.qualification || "M.Tech / Ph.D.");
          setSpecialization(p.specialization || "");
          setExperienceYears(p.experienceYears || "5 Years");
          setCabinLocation(p.cabinLocation || "");
          setOfficeHours(p.officeHours || "Mon - Fri, 02:00 PM - 04:00 PM");
          setPhone(p.phone || "");
          setBloodGroup(p.bloodGroup || "O+");
          setAddress(p.address || "");
        }
      })
      .catch(console.error);

    api
      .get("/routine")
      .then((res) => setRoutineSlots(res.data || []))
      .catch(console.error);

    api
      .get("/users/students")
      .then((res) => {
        const list = res.data || [];
        setDeptStudentCount(
          list.filter((s: any) => s.department === (user?.department || "Computer Science")).length
        );
      })
      .catch(console.error);

    loadRequests();
  }, [user?.department]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const { data } = await api.patch("/users/profile", {
        name,
        collegeName,
        employeeId,
        designation,
        department,
        qualification,
        specialization,
        experienceYears,
        cabinLocation,
        officeHours,
        phone,
        bloodGroup,
        address,
      });
      if (token && user) {
        login(token, {
          ...user,
          name: data.name,
          department: data.department,
        });
      }
      setMsg("Faculty profile & academic credentials updated successfully!");
    } catch {
      setMsg("Failed to update faculty profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqValue.trim() || !reason.trim()) return;
    setSubmittingReq(true);
    try {
      await api.post("/users/profile-request", {
        requestedChanges: { [reqField]: reqValue.trim() },
        reason,
      });
      setReqValue("");
      setReason("");
      loadRequests();
      setMsg("Official HR / Admin record update request submitted!");
    } finally {
      setSubmittingReq(false);
    }
  };

  // Compute Faculty Teaching Workload from Routine
  const mySlots = routineSlots.filter(
    (slot) =>
      slot.department === department &&
      (!slot.teacherName || slot.teacherName.toLowerCase() === name.toLowerCase())
  );
  const uniqueSubjectsTaught: string[] = Array.from(new Set(mySlots.map((s) => s.subject)));

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Digital Faculty Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-blue-300" />
              <div>
                <p className="text-sm font-bold tracking-wide uppercase">{collegeName}</p>
                <p className="text-xs text-slate-300">Official Faculty Identity & Academic Dossier</p>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-emerald-300 border border-white/15 text-xs font-semibold">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified Faculty
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print Faculty ID
              </button>
            </div>
          </div>

          <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold text-3xl shrink-0">
                {name?.charAt(0).toUpperCase() || "F"}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
                <p className="text-sm font-semibold text-indigo-600">
                  {designation} • Department of {department}
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  {qualification}
                  {specialization ? ` • Specialization: ${specialization}` : ""}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {user?.email}
                  </span>
                  {phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {phone}
                    </span>
                  )}
                  {bloodGroup && (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                      <HeartPulse className="w-3.5 h-3.5" /> Blood: {bloodGroup}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Employee ID</p>
                <p className="font-bold text-slate-900 mt-0.5">{employeeId || "Not Assigned"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Experience</p>
                <p className="font-bold text-slate-900 mt-0.5">{experienceYears}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Cabin / Room</p>
                <p className="font-bold text-slate-900 mt-0.5">{cabinLocation || "Faculty Block"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Student Mentoring</p>
                <p className="font-bold text-blue-600 mt-0.5">{officeHours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Teaching Workload & Department Telemetry */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" /> Active Subjects
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1.5">
              {uniqueSubjectsTaught.length}
            </p>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {uniqueSubjectsTaught.length > 0
                ? uniqueSubjectsTaught.join(", ")
                : "No routine subjects assigned yet"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" /> Weekly Lecture Slots
            </p>
            <p className="text-3xl font-extrabold text-indigo-600 mt-1.5">{mySlots.length}</p>
            <p className="text-xs text-slate-500 mt-1">Scheduled periods across Mon–Sat</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> Department Students
            </p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1.5">{deptStudentCount}</p>
            <p className="text-xs text-slate-500 mt-1">Enrolled in {department}</p>
          </div>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            {msg}
          </div>
        )}

        {/* Complete Faculty Credentials & Personal Details Form */}
        <form
          onSubmit={handleProfileSave}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:hidden"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" /> Academic Appointment & Personal Details
            </h2>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              {saving ? "Saving..." : "Save Faculty Profile"}
            </button>
          </div>

          {/* Section 1: Academic & Institutional Appointment */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" /> 1. Academic Appointment & Office Hours
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  College / University Name
                </label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty / Employee ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. FAC-CS-104"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Designation
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                  <option value="Lab Instructor">Lab Instructor</option>
                  <option value="Visiting Faculty">Visiting Faculty</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / School
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Highest Qualification
                </label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. Ph.D. (CSE), M.Tech"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teaching Experience
                </label>
                <input
                  type="text"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="e.g. 8 Years"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Research / Subject Specialization
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Data Structures, Machine Learning"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty Cabin / Room No
                </label>
                <input
                  type="text"
                  value={cabinLocation}
                  onChange={(e) => setCabinLocation(e.target.value)}
                  placeholder="e.g. Block B, Cabin 304"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Doubt / Mentoring Hours
                </label>
                <input
                  type="text"
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  placeholder="e.g. Mon - Fri, 02:00 PM - 04:00 PM"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Personal & Emergency Contact */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <UserCircle className="w-4 h-4 text-blue-600" /> 2. Personal & Contact Information
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> City / Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Faculty Quarters / City"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Official Admin Verification Request + History */}
        <div className="grid md:grid-cols-2 gap-6 print:hidden">
          <form
            onSubmit={handleRequestSubmit}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-600" /> Request Official Admin Record Update
            </h2>
            <p className="text-xs text-slate-500">
              Submit an official HR/Admin verification request for promotion, department transfer, or Employee ID correction.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Record Field</label>
                <select
                  value={reqField}
                  onChange={(e) => setReqField(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  <option value="designation">Academic Designation</option>
                  <option value="department">Department Transfer</option>
                  <option value="employeeId">Employee ID</option>
                  <option value="name">Official Legal Name</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Value</label>
                <input
                  type="text"
                  required
                  value={reqValue}
                  onChange={(e) => setReqValue(e.target.value)}
                  placeholder="e.g. Associate Professor"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Order Reference
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mention HR order number or reason..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submittingReq}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {submittingReq ? "Submitting..." : "Submit Request to Admin"}
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 text-sm">
              Admin Verification Requests History
            </div>
            <div className="divide-y divide-slate-200 max-h-64 overflow-y-auto">
              {requests.map((r) => (
                <div key={r._id} className="p-4 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Update: <span className="text-blue-600">{JSON.stringify(r.requestedChanges)}</span>
                    </p>
                    <p className="text-slate-500 mt-0.5">Reason: {r.reason}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold ${
                      r.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : r.status === "Rejected"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {r.status === "Approved" && <CheckCircle2 className="w-3 h-3" />}
                    {r.status === "Rejected" && <XCircle className="w-3 h-3" />}
                    {r.status === "Pending" && <Clock className="w-3 h-3" />}
                    {r.status}
                  </span>
                </div>
              ))}
              {requests.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-400">
                  No official requests submitted yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
};

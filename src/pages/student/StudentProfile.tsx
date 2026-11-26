import React, { useEffect, useState } from "react";
import { StudentLayout } from "../../components/layouts/StudentLayout";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";
import {
  UserCircle,
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
} from "lucide-react";

export const StudentProfile: React.FC = () => {
  const { user, token, login } = useAuth();

  // Academic & College Fields
  const [name, setName] = useState(user?.name || "");
  const [collegeName, setCollegeName] = useState("IntelliCampus Institute of Technology");
  const [program, setProgram] = useState("B.Tech");
  const [department, setDepartment] = useState(user?.department || "Computer Science");
  const [semester, setSemester] = useState<number>(user?.semester || 1);
  const [batch, setBatch] = useState("2026 - 2030");
  const [section, setSection] = useState("Section A");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || "");

  // Personal & Guardian Contact Fields
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [address, setAddress] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Official Admin Correction Request State
  const [reqField, setReqField] = useState("rollNumber");
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
          setProgram(p.program || "B.Tech");
          setDepartment(p.department || "Computer Science");
          setSemester(p.semester || 1);
          setBatch(p.batch || "2026 - 2030");
          setSection(p.section || "Section A");
          setEnrollmentNumber(p.enrollmentNumber || "");
          setRollNumber(p.rollNumber || "");
          setPhone(p.phone || "");
          setBloodGroup(p.bloodGroup || "O+");
          setGuardianName(p.guardianName || "");
          setGuardianPhone(p.guardianPhone || "");
          setAddress(p.address || "");
        }
      })
      .catch(console.error);
    loadRequests();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const { data } = await api.patch("/users/profile", {
        name,
        collegeName,
        program,
        department,
        semester: Number(semester),
        batch,
        section,
        enrollmentNumber,
        rollNumber,
        phone,
        bloodGroup,
        guardianName,
        guardianPhone,
        address,
      });
      if (token && user) {
        login(token, {
          ...user,
          name: data.name,
          department: data.department,
          semester: data.semester,
          rollNumber: data.rollNumber,
        });
      }
      setMsg("Student profile & college details saved successfully!");
    } catch {
      setMsg("Failed to update profile. Please try again.");
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
        requestedChanges: { [reqField]: reqField === "semester" ? Number(reqValue) : reqValue },
        reason,
      });
      setReqValue("");
      setReason("");
      loadRequests();
      setMsg("Official record correction request sent to Campus Admin!");
    } finally {
      setSubmittingReq(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Digital College Student Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6" />
              <div>
                <p className="text-sm font-bold tracking-wide uppercase">{collegeName}</p>
                <p className="text-xs text-blue-100">Official Digital Student Identity Dossier</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified Student
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print ID
              </button>
            </div>
          </div>

          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-3xl shrink-0">
                {name?.charAt(0).toUpperCase() || "S"}
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
                <p className="text-sm font-semibold text-blue-600">
                  {program} • {department} ({section})
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

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-3 w-full md:w-auto text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Roll Number</p>
                <p className="font-bold text-slate-900 mt-0.5">{rollNumber || "Not Set"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Enrollment No</p>
                <p className="font-bold text-slate-900 mt-0.5">{enrollmentNumber || "Not Set"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Academic Batch</p>
                <p className="font-bold text-slate-900 mt-0.5">{batch}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Current Semester</p>
                <p className="font-bold text-blue-600 mt-0.5">Semester {semester}</p>
              </div>
            </div>
          </div>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            {msg}
          </div>
        )}

        {/* Complete College, Academic & Personal Contact Details Form */}
        <form onSubmit={handleProfileSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> College Enrollment & Personal Information
            </h2>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              {saving ? "Saving..." : "Save All Details"}
            </button>
          </div>

          {/* Section 1: College & Course Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Institution & Course Details
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">College / University Name</label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Degree / Program</label>
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  <option value="B.Tech">B.Tech</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="MBA">MBA</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch / Department</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Batch</label>
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="e.g. 2026 - 2030"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section / Division</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. Section A"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">University Enrollment No</label>
                <input
                  type="text"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value)}
                  placeholder="e.g. EN26CS0230"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Roll Number</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 230"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Personal & Guardian Contact Details */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <UserCircle className="w-4 h-4 text-blue-600" /> 2. Personal, Emergency & Guardian Details
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Mobile Number</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Guardian full name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Contact Number</label>
                <input
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> City / Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Hostel / Home city address"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Official Admin Correction Request + History */}
        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={handleRequestSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-600" /> Request Official Admin Verification Change
            </h2>
            <p className="text-xs text-slate-500">
              Submit an official verification request to Campus Admin for locked university records.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Record Field</label>
                <select
                  value={reqField}
                  onChange={(e) => setReqField(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                >
                  <option value="rollNumber">Roll Number</option>
                  <option value="enrollmentNumber">Enrollment Number</option>
                  <option value="department">Department</option>
                  <option value="name">Official Legal Name</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corrected Value</label>
                <input
                  type="text"
                  required
                  value={reqValue}
                  onChange={(e) => setReqValue(e.target.value)}
                  placeholder="Enter new value"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Document ID</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mention admission receipt or reason..."
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
                <p className="p-8 text-center text-xs text-slate-400">No official requests submitted yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export const summarizeClassPerformance = (studentsData: any[]) => {
  const total = studentsData.length;
  if (total === 0) return { total: 0, highRisk: 0, moderateRisk: 0, lowRisk: 0, avgAttendance: 0 };

  const highRisk = studentsData.filter((s) => s.riskLevel === "High" || s.riskLevel === "Critical").length;
  const moderateRisk = studentsData.filter((s) => s.riskLevel === "Moderate").length;
  const lowRisk = studentsData.filter((s) => s.riskLevel === "Low").length;
  const avgAttendance = Number(
    (studentsData.reduce((acc, s) => acc + (s.attendancePct || 0), 0) / total).toFixed(1)
  );

  return { total, highRisk, moderateRisk, lowRisk, avgAttendance };
};

export const calculateAttendancePercentage = (records: { status: string }[]) => {
  if (!records || records.length === 0) return 0;
  const presentCount = records.filter((r) => r.status === "Present" || r.status === "Late").length;
  return Number(((presentCount / records.length) * 100).toFixed(2));
};

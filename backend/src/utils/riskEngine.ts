export interface RiskEvaluation {
  riskScore: number;
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  factors: string[];
  recommendations: string[];
}

export const evaluateStudentRisk = (
  attendancePct: number,
  avgMarksPct: number,
  previousGpa: number = 7.0
): RiskEvaluation => {
  let riskScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];

  if (attendancePct < 60) {
    riskScore += 45;
    factors.push(`Critically low attendance (${attendancePct}%)`);
    recommendations.push("Schedule immediate counselor & guardian check-in for attendance recovery.");
  } else if (attendancePct < 75) {
    riskScore += 25;
    factors.push(`Attendance below institutional 75% threshold (${attendancePct}%)`);
    recommendations.push("Send automated attendance warning and monitor weekly class presence.");
  }

  if (avgMarksPct < 45) {
    riskScore += 40;
    factors.push(`Failing average exam score (${avgMarksPct}%)`);
    recommendations.push("Enroll student in remedial peer-tutoring sessions.");
  } else if (avgMarksPct < 65) {
    riskScore += 20;
    factors.push(`Sub-optimal academic assessment score (${avgMarksPct}%)`);
    recommendations.push("Assign targeted practice modules in weak subjects.");
  }

  if (previousGpa < 6.0) {
    riskScore += 15;
    factors.push(`Historical GPA trend below 6.0 (${previousGpa})`);
  }

  riskScore = Math.min(100, riskScore);

  let riskLevel: "Low" | "Moderate" | "High" | "Critical" = "Low";
  if (riskScore >= 75) riskLevel = "Critical";
  else if (riskScore >= 50) riskLevel = "High";
  else if (riskScore >= 25) riskLevel = "Moderate";

  if (factors.length === 0) {
    factors.push("Consistent attendance and healthy academic scores.");
    recommendations.push("Encourage participation in advanced research or honors projects.");
  }

  return { riskScore, riskLevel, factors, recommendations };
};

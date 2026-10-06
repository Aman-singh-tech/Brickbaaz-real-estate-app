export const CRM_STAGES = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  VISIT_SCHEDULED: "Visit scheduled",
  NEGOTIATION: "Negotiation",
  CONVERTED: "Converted",
  LOST: "Lost",
};
export const LEAD_TYPES = {
  PROPERTY: "Property",
  PROJECT: "Project",
  LOAN: "Loan",
  OTHER: "Other",
};
export const LOANS = [
  "Home Loan",
  "Loan Against Property",
  "Personal Loan",
  "Business Loan",
  "Vehicle Loan",
  "Education Loan",
  "Gold Loan",
  "Other Loan",
];
export const CLOSED_STAGES = ["CONVERTED", "LOST"];
export const legacyStage = (stage) =>
  stage === "BOOKED"
    ? "CONVERTED"
    : stage === "VISIT_COMPLETED"
      ? "FOLLOW_UP"
      : stage;

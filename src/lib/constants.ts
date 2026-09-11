export const CATEGORIES = [
  { name: "Beauty", slug: "beauty", icon: "sparkles", description: "Hair, nails, makeup and more" },
  { name: "Health", slug: "health", icon: "heart-pulse", description: "Doctors, clinics and wellness" },
  { name: "Fitness", slug: "fitness", icon: "dumbbell", description: "Personal trainers and gyms" },
  { name: "Education", slug: "education", icon: "graduation-cap", description: "Tutors and consultants" },
  { name: "Consulting", slug: "consulting", icon: "briefcase", description: "Business and career advisors" },
  { name: "Photography", slug: "photography", icon: "camera", description: "Photographers and studios" },
  { name: "Home Services", slug: "home-services", icon: "home", description: "Repair and maintenance" },
  { name: "Beauty & Spa", slug: "beauty-spa", icon: "flower", description: "Spa and relaxation" },
  { name: "Other", slug: "other", icon: "grid", description: "All other services" },
] as const;

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAYMENT_PENDING: "Payment Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  RESCHEDULED: "Rescheduled",
  NO_SHOW: "No Show",
  EXPIRED: "Expired",
};

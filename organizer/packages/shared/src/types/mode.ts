/** The three top-level personalization modes Organizer adapts around. */
export type AppMode = "student" | "business" | "personal";

/** Sub-role inside Business mode, decided during onboarding ("Do you own a business?"). */
export type BusinessRole = "owner" | "employee";

/** Personal-mode improvement focus areas selected during onboarding. */
export type PersonalFocus =
  | "lose_weight"
  | "gain_muscle"
  | "fitness"
  | "productivity"
  | "habits"
  | "reading"
  | "mental_wellness"
  | "learning_skills";

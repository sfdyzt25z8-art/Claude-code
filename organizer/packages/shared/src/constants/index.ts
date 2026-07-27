export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

/** Minimal country -> currency map for onboarding localization; extend as needed. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  EG: "EGP",
  SA: "SAR",
  AE: "AED",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  CA: "CAD",
  AU: "AUD",
  IN: "INR",
  JO: "JOD",
  QA: "QAR",
  KW: "KWD",
};

export const DEFAULT_CURRENCY = "USD";

export function currencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY[countryCode.toUpperCase()] ?? DEFAULT_CURRENCY;
}

export const XP_REWARDS = {
  quizCompleted: 30,
  perfectQuiz: 20,
  homeworkCompleted: 10,
  habitLogged: 5,
  studySessionCompleted: 15,
  miniGamePlayed: 8,
  goalCompleted: 25,
  dailyLoginStreak: 5,
} as const;

export const COIN_REWARDS = {
  quizCompleted: 10,
  perfectQuiz: 15,
  habitLogged: 2,
  goalCompleted: 15,
} as const;

export const API_ROUTES = {
  auth: "/api/auth",
  onboarding: "/api/onboarding",
  profile: "/api/profile",
  ai: "/api/ai",
  student: "/api/student",
  business: "/api/business",
  personal: "/api/personal",
  calendar: "/api/calendar",
  notifications: "/api/notifications",
  statistics: "/api/statistics",
  admin: "/api/admin",
  uploads: "/api/uploads",
} as const;

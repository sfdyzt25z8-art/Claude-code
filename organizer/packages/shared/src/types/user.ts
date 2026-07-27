import type { AppMode, BusinessRole, PersonalFocus } from "./mode";

export type AuthProvider = "password" | "google" | "apple";

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  role: "user" | "admin";
}

export interface UserProfile {
  userId: string;
  name: string;
  age: number | null;
  country: string | null;
  countryCode: string | null;
  language: string;
  currency: string;
  mode: AppMode | null;
  businessRole: BusinessRole | null;
  personalFocus: PersonalFocus[];
  ownsBusiness: boolean | null;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  tutorialCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingInput {
  name: string;
  age: number;
  country: string;
  countryCode: string;
  language: string;
  mode: AppMode;
  ownsBusiness?: boolean;
  personalFocus?: PersonalFocus[];
}

export interface AuthSession {
  user: User;
  profile: UserProfile | null;
  accessToken: string;
}

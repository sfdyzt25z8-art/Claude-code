"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/layout/PageHeader";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import { BusinessDashboard } from "@/components/dashboards/BusinessDashboard";
import { PersonalDashboard } from "@/components/dashboards/PersonalDashboard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function DashboardPage() {
  const { profile } = useAuth();

  if (!profile) return <LoadingSpinner label="Loading dashboard" />;

  const greetingName = profile.name?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader title={`Welcome back, ${greetingName}`} subtitle="Here's what's happening in your world today." />
      {profile.mode === "student" && <StudentDashboard />}
      {profile.mode === "business" && <BusinessDashboard />}
      {profile.mode === "personal" && <PersonalDashboard />}
      {!profile.mode && <PersonalDashboard />}
    </div>
  );
}

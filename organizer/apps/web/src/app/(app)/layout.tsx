"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile, loading } = useAuth();
  const { setMode } = useTheme();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (!profile?.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
    if (profile.mode) setMode(profile.mode);
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, firebaseUser, profile, router]);

  if (loading || !checked) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Loading your workspace" />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopNav />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <TutorialOverlay />
    </div>
  );
}

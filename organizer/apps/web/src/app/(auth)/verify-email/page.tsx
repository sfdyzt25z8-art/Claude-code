"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { resendVerificationEmail } from "@/lib/firebaseClient";

export default function VerifyEmailPage() {
  const { firebaseUser, refreshProfile } = useAuth();
  const router = useRouter();
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      router.replace("/login");
    }
  }, [firebaseUser, router]);

  const handleResend = async () => {
    setResent(false);
    await resendVerificationEmail();
    setResent(true);
  };

  const handleContinue = async () => {
    setChecking(true);
    try {
      await firebaseUser?.reload();
      await refreshProfile();
      router.push("/onboarding");
    } finally {
      setChecking(false);
    }
  };

  return (
    <AuthCard title="Verify your email" subtitle="We sent a verification link to your inbox.">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <MailCheck className="h-10 w-10 text-[var(--color-accent)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Please confirm your email address at <strong>{firebaseUser?.email}</strong>. Once
          verified, continue to set up your Organizer profile.
        </p>
        {resent && <p className="text-xs font-medium text-emerald-500">Verification email resent.</p>}
        <div className="flex w-full flex-col gap-2">
          <Button fullWidth loading={checking} onClick={handleContinue}>
            I&apos;ve verified — continue
          </Button>
          <Button fullWidth variant="outline" onClick={handleResend}>
            Resend verification email
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}

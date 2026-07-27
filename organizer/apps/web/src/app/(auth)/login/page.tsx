"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/auth/AuthCard";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { signIn, signInWithGoogle, signInWithApple, refreshProfile } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const goPostAuth = async () => {
    await refreshProfile();
    router.push("/dashboard");
  };

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      await goPostAuth();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not sign in. Please try again.");
    }
  };

  const handleGoogle = async () => {
    setFormError(null);
    try {
      await signInWithGoogle();
      await goPostAuth();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  };

  const handleApple = async () => {
    setFormError(null);
    try {
      await signInWithApple();
      await goPostAuth();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Apple sign-in failed.");
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue organizing your life."
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[var(--color-accent)] hover:underline">
            Sign up
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="text-xs font-medium text-[var(--color-accent)] hover:underline">
            Forgot password?
          </Link>
        </div>
        {formError && <p className="text-sm font-medium text-red-500">{formError}</p>}
        <Button type="submit" fullWidth loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
        or continue with
        <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
      </div>

      <SocialAuthButtons onGoogle={handleGoogle} onApple={handleApple} />
    </AuthCard>
  );
}

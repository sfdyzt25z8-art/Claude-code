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

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const { signUp, signInWithGoogle, signInWithApple, refreshProfile } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await signUp(values.email, values.password, values.name);
      router.push("/verify-email");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create your account.");
    }
  };

  const goPostAuth = async () => {
    await refreshProfile();
    router.push("/onboarding");
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
      title="Create your account"
      subtitle="Set up your AI-powered life operating system."
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--color-accent)] hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        {formError && <p className="text-sm font-medium text-red-500">{formError}</p>}
        <Button type="submit" fullWidth loading={isSubmitting}>
          Create account
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

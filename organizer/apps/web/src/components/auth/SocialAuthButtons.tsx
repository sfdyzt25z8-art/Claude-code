"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function SocialAuthButtons({
  onGoogle,
  onApple,
  disabled,
}: {
  onGoogle: () => Promise<void>;
  onApple: () => Promise<void>;
  disabled?: boolean;
}) {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);

  const handle = async (provider: "google" | "apple", action: () => Promise<void>) => {
    setLoadingProvider(provider);
    try {
      await action();
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        loading={loadingProvider === "google"}
        onClick={() => handle("google", onGoogle)}
      >
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        loading={loadingProvider === "apple"}
        onClick={() => handle("apple", onApple)}
      >
        Apple
      </Button>
    </div>
  );
}

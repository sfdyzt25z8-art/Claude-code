"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  padded?: boolean;
  hoverable?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, padded = true, hoverable = false, children, onClick, onKeyDown, ...props }, ref) => {
    const isInteractive = !!onClick;
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        whileHover={hoverable ? { y: -2, transition: { duration: 0.2 } } : undefined}
        className={cn(
          "glass rounded-2xl border shadow-glass",
          padded && "p-5",
          hoverable && "cursor-pointer transition-shadow hover:shadow-glass-lg",
          isInteractive && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
          className
        )}
        style={{ borderColor: "var(--color-border)" }}
        onClick={onClick}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (isInteractive && onClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";

"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResultStatus } from "@/types/database";

type PassFailToggleProps = {
  value: ResultStatus;
  onChange: (v: Exclude<ResultStatus, null>) => void;
  disabled?: boolean;
};

export function PassFailToggle({
  value,
  onChange,
  disabled,
}: PassFailToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.button
        type="button"
        disabled={disabled}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={() => onChange("pass")}
        className={cn(
          "flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 text-base font-semibold transition-colors",
          value === "pass"
            ? "border-primary bg-accent text-accent-foreground"
            : "border-border bg-card text-muted-foreground hover:border-primary/40"
        )}
      >
        <Check className="h-6 w-6" />
        Pass
      </motion.button>
      <motion.button
        type="button"
        disabled={disabled}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={() => onChange("fail")}
        className={cn(
          "flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-2 text-base font-semibold transition-colors",
          value === "fail"
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-border bg-card text-muted-foreground hover:border-destructive/40"
        )}
      >
        <X className="h-6 w-6" />
        Fail
      </motion.button>
    </div>
  );
}

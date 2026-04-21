import { Suspense } from "react";
import { SignupGate } from "@/components/auth/signup-gate";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md rounded-lg border border-border/80 p-8 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SignupGate />
    </Suspense>
  );
}

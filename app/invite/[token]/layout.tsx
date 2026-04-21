import { Logo } from "@/components/shared/logo";

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-[#0f3e18]/[0.09] via-background to-background px-4 py-10 font-sans text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <div className="mb-8">
          <Logo withLink={false} height={44} />
        </div>
        {children}
      </div>
    </div>
  );
}

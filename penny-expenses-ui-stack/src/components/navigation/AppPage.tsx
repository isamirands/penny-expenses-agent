import type { ReactNode } from "react";

import { AppShell } from "@/components/navigation/AppShell";
import { Onboarding } from "@/components/navigation/Onboarding";
import { useProfile } from "@/hooks/useProfile";

/** Gate: no identity, no data. Keeps every page consistent. */
export function AppPage({ children }: { children: ReactNode }) {
  const { profile, ready } = useProfile();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="size-10 animate-pulse rounded-2xl bg-butter" />
      </div>
    );
  }

  if (!profile) return <Onboarding />;

  return <AppShell>{children}</AppShell>;
}

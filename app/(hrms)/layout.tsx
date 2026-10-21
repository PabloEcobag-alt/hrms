import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getShell } from "@/lib/portal/staff";

async function Shell({ children }: { children: React.ReactNode }) {
  const { staff, permittedPages } = await getShell();

  return (
    <AppShell staff={staff} permittedPages={permittedPages}>
      {children}
    </AppShell>
  );
}

export default function HrmsLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

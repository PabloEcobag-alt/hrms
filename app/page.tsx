import { Suspense } from "react";
import { redirect } from "next/navigation";
import { homePage } from "@/lib/portal/staff";

async function Home(): Promise<never> {
  redirect(await homePage());
}

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}

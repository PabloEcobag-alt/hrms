import { requireModule } from "@/lib/portal/staff";

export default async function Page() {
  await requireModule("Dashboard");

  return (
    <div className="p-md sm:p-lg">
      <h1 className="text-headline-md">Dashboard</h1>
    </div>
  );
}

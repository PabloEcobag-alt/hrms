import { BackLink, PAGE } from "@/components/hiring/parts";

export default function NotFound() {
  return (
    <div className={PAGE}>
      <BackLink href="/applicants">Applicants</BackLink>
      <h1 className="text-2xl font-semibold text-foreground">Applicant not found</h1>
      <p className="text-sm text-muted-foreground">This application does not exist or was removed.</p>
    </div>
  );
}

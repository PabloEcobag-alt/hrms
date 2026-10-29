import { notFound } from "next/navigation";
import {
  Check,
  Download,
  FileText,
  Lock,
  Send,
  UserCheck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BackLink,
  CardTitle,
  PAGE,
  PageHeader,
} from "@/components/hiring/parts";
import {
  OfferResponseDialog,
  RequestDocumentsDialog,
} from "@/components/hiring/dialogs";
import { OFFERS, PRE_EMPLOYMENT_DOCS } from "@/lib/hiring-mock";
import { requireModule } from "@/lib/portal/staff";
import { cn } from "@/lib/utils";

type Stage = "waiting" | "ready";

function StageStep({
  title,
  caption,
  state,
}: {
  title: string;
  caption: string;
  state: "done" | "current" | "todo";
}) {
  return (
    <div className="flex shrink-0 items-center gap-[10px]">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px]",
          state === "done" && "border-primary bg-primary text-primary-foreground",
          state === "current" && "border-primary bg-white",
          state === "todo" && "border-zinc-200 bg-white",
        )}
      >
        {state === "done" && <Check className="size-3" />}
        {state === "current" && <span className="size-2 rounded-full bg-primary" />}
        {state === "todo" && <span className="size-2 rounded-full bg-zinc-200" />}
      </span>
      <span className="flex flex-col gap-px leading-[normal]">
        <span
          className={cn(
            "text-sm",
            state === "todo" ? "font-medium text-zinc-500" : "font-semibold text-zinc-900",
          )}
        >
          {title}
        </span>
        <span className="text-xs text-zinc-500">{caption}</span>
      </span>
    </div>
  );
}

function StageLine({ done }: { done: boolean }) {
  return (
    <span
      className={cn("h-[2px] min-w-6 flex-1 rounded-[1px]", done ? "bg-primary" : "bg-zinc-200")}
    />
  );
}

function StageTracker({ stage }: { stage: Stage }) {
  const waiting = stage === "waiting";
  return (
    <Card className="flex items-center gap-[12px] overflow-x-auto rounded-xl px-[24px] py-[18px] shadow-none">
      <StageStep title="Applied" caption="12 Oct" state="done" />
      <StageLine done />
      <StageStep title="Screening" caption="15 Oct" state="done" />
      <StageLine done />
      <StageStep title="Interview" caption="21 Oct · passed" state="done" />
      <StageLine done />
      <StageStep title="Offer" caption={waiting ? "Sent 22 Oct" : "Accepted 24 Oct"} state="current" />
      <StageLine done={false} />
      <StageStep title="Hired" caption={waiting ? "—" : "Ready to hire"} state="todo" />
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function OfferDetailsCard({
  name,
  salary,
  startDate,
  fileCaption,
}: {
  name: string;
  salary: string;
  startDate: string;
  fileCaption: string;
}) {
  return (
    <Card className="flex flex-col gap-[14px] rounded-xl px-[20px] py-[18px] shadow-none">
      <CardTitle>Offer details</CardTitle>
      <div className="flex gap-md">
        <Detail label="Monthly salary" value={salary} />
        <Detail label="Start date" value={startDate} />
        <Detail label="Employment type" value="Full-time" />
      </div>
      <div className="flex gap-md">
        <Detail label="Schedule" value="Mon–Sat · 8:00 AM – 5:00 PM" />
        <Detail label="Probation" value="6 months" />
        <Detail label="Reports to" value="Paolo Garcia" />
      </div>
      <div className="flex items-center gap-[12px] rounded-lg border border-zinc-200 py-[9px] pl-[9px] pr-[12px]">
        <span className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100">
          <FileText className="size-4 text-zinc-500" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="truncate text-[13px] font-medium text-zinc-900">
            Offer_Letter_{name.replace(/\s+/g, "_")}.pdf
          </span>
          <span className="text-xs text-zinc-500">{fileCaption}</span>
        </span>
        <Download className="size-4 shrink-0 text-zinc-500" />
      </div>
    </Card>
  );
}

function DocumentsCard({ stage }: { stage: Stage }) {
  const waiting = stage === "waiting";
  const total = PRE_EMPLOYMENT_DOCS.length;
  const submitted = waiting
    ? PRE_EMPLOYMENT_DOCS.filter((doc) => doc.fromApplication).length
    : total;
  return (
    <Card className="flex flex-col gap-[14px] rounded-xl px-[20px] py-[18px] shadow-none">
      <CardTitle
        aside={
          <>
            <span
              className={cn(
                "whitespace-nowrap text-[13px] font-medium",
                waiting ? "text-muted-foreground" : "text-[#1e6b3a]",
              )}
            >
              {submitted} of {total} submitted
            </span>
            {waiting && (
              <RequestDocumentsDialog
                trigger={
                  <Button
                    variant="outline"
                    className="h-auto gap-[6px] rounded-lg px-[12px] py-[6px] text-[13px] shadow-none [&_svg]:size-[14px]"
                  >
                    <Send /> Request documents
                  </Button>
                }
              />
            )}
          </>
        }
      >
        Pre-employment documents
      </CardTitle>
      <div className="h-[6px] rounded-full bg-zinc-100">
        <div
          className={cn("h-[6px] rounded-full", waiting ? "bg-primary" : "bg-[#16a34a]")}
          style={{ width: `${(submitted / total) * 100}%` }}
        />
      </div>
      <ul>
        {PRE_EMPLOYMENT_DOCS.map((doc) => {
          const isSubmitted = !waiting || doc.fromApplication;
          return (
            <li
              key={doc.name}
              className="flex items-center gap-[12px] border-b border-border-subtle py-[10px] last:border-b-0"
            >
              <FileText className={cn("size-4 shrink-0", isSubmitted ? "text-zinc-900" : "text-zinc-400")} />
              <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="text-sm font-medium text-zinc-900">{doc.name}</span>
                <span className="text-xs text-zinc-500">{doc.hint}</span>
              </span>
              <Badge variant={isSubmitted ? "success" : "secondary"}>
                {isSubmitted ? "Submitted" : "Not requested"}
              </Badge>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Check20({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
        done ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-zinc-300 bg-white",
      )}
    >
      {done && <Check className="size-3" />}
    </span>
  );
}

function HireCard({
  stage,
  first,
  possessive,
}: {
  stage: Stage;
  first: string;
  possessive: string;
}) {
  const ready = stage === "ready";
  const rowText = (done: boolean) => cn("text-sm font-medium", done ? "text-zinc-900" : "text-zinc-500");
  return (
    <Card className="flex flex-col gap-[14px] rounded-xl px-[20px] py-[18px] shadow-none">
      <CardTitle>Hire</CardTitle>
      <div className="flex items-center gap-[10px]">
        <Check20 done={ready} />
        <span className={rowText(ready)}>Offer accepted</span>
      </div>
      <div className="flex items-center gap-[10px]">
        <Check20 done={ready} />
        <span className={rowText(ready)}>
          All 7 documents submitted ({ready ? 7 : 2}/7)
        </span>
      </div>
      {ready ? (
        <Button className="h-auto w-full gap-[6px] rounded-lg px-[14px] py-[9px] font-medium shadow-none">
          <UserCheck /> Mark as hired
        </Button>
      ) : (
        <Button
          disabled
          className="h-auto w-full gap-[6px] rounded-lg bg-zinc-100 px-[14px] py-[9px] font-medium text-zinc-400 shadow-none !text-zinc-400 disabled:opacity-100"
        >
          <Lock /> Mark as hired
        </Button>
      )}
      <p className="text-xs text-zinc-500">
        {ready
          ? `Moves ${first} to Hired and creates ${possessive} employee record with these documents. ${possessive === "her" ? "She gets" : "They get"} a welcome email.`
          : "Available once the offer is accepted and all documents are in."}
      </p>
    </Card>
  );
}

const DOT = { blue: "bg-[#1d4f91]", green: "bg-[#16a34a]", purple: "bg-primary" } as const;

function ActivityCard({
  entries,
}: {
  entries: { title: string; caption: string; dot: keyof typeof DOT }[];
}) {
  return (
    <Card className="flex flex-col gap-[14px] rounded-xl px-[20px] py-[18px] shadow-none">
      <CardTitle>Activity</CardTitle>
      {entries.map((entry) => (
        <div key={entry.title} className="flex items-start gap-[10px]">
          <span className="flex h-[13px] w-2 shrink-0 items-center">
            <span className={cn("size-2 rounded-full", DOT[entry.dot])} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="text-sm font-medium text-zinc-900">{entry.title}</span>
            <span className="text-xs text-zinc-500">{entry.caption}</span>
          </span>
        </div>
      ))}
    </Card>
  );
}

export default async function Page({ params }: PageProps<"/offers/[id]">) {
  await requireModule("Recruitment and Hiring");
  const { id } = await params;
  const offer = OFFERS.find((candidate) => candidate.id === id);
  if (!offer || (offer.status !== "Sent" && offer.status !== "Accepted")) notFound();

  const stage: Stage = offer.status === "Accepted" ? "ready" : "waiting";
  const first = offer.name.split(" ")[0];
  // Sample copy only: the design is written for Ellaine, so everyone else gets neutral wording.
  const possessive = offer.name === "Ellaine Torres" ? "her" : "their";
  const branch = offer.role === "Branch Cashier" ? "Cainta branch" : "Main kitchen";
  const replyBy = offer.replyBy?.replace(/ 2026$/, "");
  const sent = offer.sent?.replace(/ 2026$/, "");

  return (
    <div className={`${PAGE} !pt-[20px]`}>
      <div className="flex flex-col gap-xs">
        <BackLink href="/offers">Offers</BackLink>
        <PageHeader
          title={offer.name}
          badge={<Badge variant="success">{offer.status}</Badge>}
          subtitle={
            stage === "waiting"
              ? `Offer for ${offer.role} · ${branch} · sent ${offer.sent} · reply by ${replyBy}`
              : `Offer for ${offer.role} · ${branch} · accepted 24 Oct 2026`
          }
        >
          {stage === "waiting" ? (
            <>
              <OfferResponseDialog
                defaultAnswer="declined"
                trigger={
                  <Button
                    variant="outline"
                    className="h-auto gap-[6px] rounded-lg px-[14px] py-[9px] text-red-700 shadow-none"
                  >
                    <X /> Mark as declined
                  </Button>
                }
              />
              <OfferResponseDialog
                trigger={
                  <Button className="h-auto gap-[6px] rounded-lg px-[14px] py-[9px] font-medium shadow-none">
                    <Check /> Mark as accepted
                  </Button>
                }
              />
            </>
          ) : (
            <RequestDocumentsDialog
              trigger={
                <Button variant="outline" className="h-auto gap-[6px] rounded-lg px-[14px] py-[9px] shadow-none">
                  <Send /> Request documents
                </Button>
              }
            />
          )}
        </PageHeader>
      </div>
      <StageTracker stage={stage} />
      <div className="grid items-start gap-md lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-md">
          <OfferDetailsCard
            name={offer.name}
            salary={offer.salary}
            startDate={offer.startDate}
            fileCaption={
              stage === "waiting"
                ? `Sent ${sent} · opened 23 Oct`
                : "Signed copy uploaded 24 Oct"
            }
          />
          <DocumentsCard stage={stage} />
        </div>
        <div className="flex flex-col gap-md">
          <HireCard stage={stage} first={first} possessive={possessive} />
          <ActivityCard
            entries={
              stage === "waiting"
                ? [
                    { title: "Offer opened", caption: "23 Oct · 8:12 PM", dot: "blue" },
                    { title: "Offer sent", caption: `${sent} · by Paolo Garcia`, dot: "blue" },
                    { title: "Interview passed", caption: "21 Oct · score 5 / 5 · email sent 22 Oct", dot: "green" },
                  ]
                : [
                    { title: "All documents submitted", caption: "3 Nov · last one: Pag-IBIG MID and TIN", dot: "green" },
                    { title: "Documents requested", caption: "24 Oct · due 5 Nov · email sent", dot: "purple" },
                    { title: "Offer accepted", caption: "24 Oct · welcome email sent 6:00 PM", dot: "green" },
                    { title: "Offer sent", caption: `${sent} · by Paolo Garcia`, dot: "blue" },
                  ]
            }
          />
        </div>
      </div>
    </div>
  );
}

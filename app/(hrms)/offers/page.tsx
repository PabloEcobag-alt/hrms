import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CELL,
  HEAD,
  InfoNote,
  PAGE,
  PageHeader,
  PersonCell,
  PillTabs,
} from "@/components/hiring/parts";
import { OFFERS, OFFER_TABS, type OfferStatus } from "@/lib/hiring-mock";
import { requireModule } from "@/lib/portal/staff";

const OFFER_BADGE = {
  Draft: "secondary",
  Sent: "success",
  Accepted: "success",
  Declined: "destructive",
} as const satisfies Record<OfferStatus, "secondary" | "success" | "destructive">;

const dash = (value: string | null) => value ?? "—";

export default async function Page() {
  await requireModule("Recruitment and Hiring");

  return (
    <div className={PAGE}>
      <PageHeader title="Offers" subtitle="3 waiting for a reply">
        <Button className="h-auto rounded-lg px-[14px] py-[9px] font-medium shadow-none">
          New offer
        </Button>
      </PageHeader>
      <PillTabs tabs={OFFER_TABS} />
      <Card className="flex flex-col gap-[14px] overflow-auto rounded-xl p-[20px] shadow-none">
        <Table className="table-fixed min-w-[1000px]">
          <TableHeader>
            <TableRow className="border-border-subtle hover:bg-transparent">
              <TableHead className={`${HEAD} w-[250px]`}>Applicant</TableHead>
              <TableHead className={`${HEAD} w-[200px]`}>Role</TableHead>
              <TableHead className={`${HEAD} w-[130px]`}>Monthly salary</TableHead>
              <TableHead className={`${HEAD} w-[120px]`}>Start date</TableHead>
              <TableHead className={`${HEAD} w-[110px]`}>Sent</TableHead>
              <TableHead className={`${HEAD} w-[110px]`}>Reply by</TableHead>
              <TableHead className={HEAD}>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {OFFERS.map((offer) => {
              const hasDetail = offer.status === "Sent" || offer.status === "Accepted";
              return (
                <TableRow key={offer.id} className="relative border-border-subtle">
                  <TableCell className={CELL}>
                    <PersonCell
                      name={offer.name}
                      subtitle={offer.email}
                      href={hasDetail ? `/offers/${offer.id}` : undefined}
                    />
                  </TableCell>
                  <TableCell className={CELL}>{offer.role}</TableCell>
                  <TableCell className={CELL}>{offer.salary}</TableCell>
                  <TableCell className={CELL}>{offer.startDate}</TableCell>
                  <TableCell className={`${CELL} ${offer.sent ? "" : "text-muted-foreground"}`}>
                    {dash(offer.sent)}
                  </TableCell>
                  <TableCell className={`${CELL} ${offer.replyBy ? "" : "text-muted-foreground"}`}>
                    {dash(offer.replyBy)}
                  </TableCell>
                  <TableCell className={CELL}>
                    <Badge variant={OFFER_BADGE[offer.status]}>{offer.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <InfoNote>
          When an offer is accepted, the applicant moves to Hired and their
          details carry over to the employee record.
        </InfoNote>
      </Card>
    </div>
  );
}

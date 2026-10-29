import { Download, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { EMPLOYEES } from "@/lib/hiring-mock";
import { requireModule } from "@/lib/portal/staff";

export default async function Page() {
  await requireModule("Recruitment and Hiring");

  return (
    <div className={PAGE}>
      <PageHeader title="Hired" subtitle="42 employees · 3 starting this month">
        <Button variant="outline" className="h-auto rounded-lg px-[14px] py-[9px] shadow-none">
          <Download /> Export
        </Button>
      </PageHeader>
      <div className="flex flex-col gap-[12px] sm:flex-row sm:items-center">
        <PillTabs
          className="flex-1"
          tabs={[
            { label: "All", count: 42 },
            { label: "Onboarding", count: 3 },
            { label: "Active", count: 39 },
          ]}
        />
        <div className="relative w-full sm:w-[260px]">
          <Search className="absolute left-[12px] top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            aria-label="Search employees"
            placeholder="Search employees"
            className="h-auto rounded-lg border-zinc-200 bg-white py-[9px] pl-[36px] pr-[12px] text-sm shadow-none placeholder:text-zinc-400"
          />
        </div>
      </div>
      <Card className="flex flex-col gap-[14px] overflow-auto rounded-xl p-[20px] shadow-none">
        <Table className="table-fixed min-w-[980px]">
          <TableHeader>
            <TableRow className="border-border-subtle hover:bg-transparent">
              <TableHead className={`${HEAD} w-[260px]`}>Employee</TableHead>
              <TableHead className={`${HEAD} w-[130px]`}>Employee ID</TableHead>
              <TableHead className={`${HEAD} w-[220px]`}>Position</TableHead>
              <TableHead className={`${HEAD} w-[170px]`}>Branch</TableHead>
              <TableHead className={`${HEAD} w-[120px]`}>Start date</TableHead>
              <TableHead className={HEAD}>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EMPLOYEES.map((employee) => (
              <TableRow key={employee.employeeId} className="border-border-subtle">
                <TableCell className={CELL}>
                  <PersonCell name={employee.name} subtitle={employee.email} />
                </TableCell>
                <TableCell className={`${CELL} font-medium`}>{employee.employeeId}</TableCell>
                <TableCell className={CELL}>
                  <div className="flex flex-col gap-[2px]">
                    <span>{employee.position}</span>
                    <span className="text-xs text-muted-foreground">{employee.department}</span>
                  </div>
                </TableCell>
                <TableCell className={CELL}>{employee.branch}</TableCell>
                <TableCell className={CELL}>{employee.startDate}</TableCell>
                <TableCell className={CELL}>
                  <Badge variant={employee.status === "Onboarding" ? "info" : "success"}>
                    {employee.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <InfoNote>
          Hired applicants keep their application, interview notes and
          documents in their employee record. Onboarding switches to Active on
          their start date.
        </InfoNote>
      </Card>
    </div>
  );
}

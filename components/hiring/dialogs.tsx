"use client";

import { useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Link2,
  Map as MapIcon,
  MapPin,
  Video,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EmailPreview,
  Field,
  FieldBox,
  HiringDialog,
  OptionGroup,
  ToggleRow,
} from "./dialog-parts";
import { PRE_EMPLOYMENT_DOCS } from "@/lib/hiring-mock";

type Trigger = { trigger: React.ReactNode };

const TEXT_FIELD = "h-auto rounded-lg border-zinc-200 bg-white px-[12px] py-[9px] text-sm text-zinc-900 shadow-none";

export function ScheduleInterviewDialog({ trigger }: Trigger) {
  const [mode, setMode] = useState<"online" | "in-person">("online");

  return (
    <HiringDialog
      trigger={trigger}
      title="Schedule interview"
      subtitle="Mylene Santos · Branch Cashier · Cainta branch"
      footerNote="Mylene moves to Scheduled."
      submitLabel="Schedule & send invite"
    >
      <Field label="Interview type" required>
        <OptionGroup
          value={mode}
          onChange={setMode}
          options={[
            { value: "online", title: "Online", description: "Send a video call link", icon: <Video className="text-primary" /> },
            { value: "in-person", title: "In person", description: "Share the place and a map link", icon: <MapPin className="text-primary" /> },
          ]}
        />
      </Field>
      <div className="flex gap-[12px]">
        <div className="min-w-0 flex-1">
          <Field label="Date" required>
            <FieldBox trailing={<Calendar className="size-4" />}>29 Oct 2026</FieldBox>
          </Field>
        </div>
        <div className="min-w-0 flex-1">
          <Field label="Time" required>
            <FieldBox trailing={<Clock className="size-4" />}>3:00 – 3:30 PM</FieldBox>
          </Field>
        </div>
      </div>
      <Field label="Interviewer" required>
        <FieldBox trailing="chevron">Paolo Garcia · Cainta Branch Head</FieldBox>
      </Field>
      {mode === "online" ? (
        <Field
          label="Meeting link"
          required
          hint="Paste a Google Meet or Zoom link. It goes in the invite email."
        >
          <FieldBox icon={<Link2 className="size-4" />} valueClassName="text-primary">
            https://meet.google.com/xqp-rtke-vbn
          </FieldBox>
        </Field>
      ) : (
        <>
          <Field label="Location" required>
            <FieldBox icon={<MapPin className="size-4" />} trailing="chevron">
              Cainta branch · 2/F, 118 A. Bonifacio Ave., Cainta, Rizal
            </FieldBox>
          </Field>
          <Field
            label="Map link"
            hint="Filled in from the branch. Change it if they should go somewhere else."
          >
            <FieldBox icon={<MapIcon className="size-4" />} valueClassName="text-primary">
              https://maps.app.goo.gl/BrenRaphaelsCainta
            </FieldBox>
          </Field>
        </>
      )}
      <ToggleRow
        title="Email the invite to Mylene"
        description={
          mode === "online"
            ? "Sent right away to mylene.santos@gmail.com with the date, time and link."
            : "Sent right away to mylene.santos@gmail.com with the address and map link."
        }
      />
      {mode === "online" ? (
        <EmailPreview
          subject="Your online interview for Branch Cashier"
          body="Hi Mylene, you’re invited to an online interview on Thu, 29 Oct at 3:00 PM with Paolo Garcia. Join here: meet.google.com/xqp-rtke-vbn"
        />
      ) : (
        <EmailPreview
          subject="Your interview for Branch Cashier"
          body="Hi Mylene, please come to our Cainta branch (2/F, 118 A. Bonifacio Ave.) on Thu, 29 Oct at 3:00 PM for your interview with Paolo Garcia. Directions: maps.app.goo.gl/BrenRaphaelsCainta"
        />
      )}
    </HiringDialog>
  );
}

export function InterviewResultDialog({ trigger }: Trigger) {
  const [result, setResult] = useState<"passed" | "not-passed">("passed");

  return (
    <HiringDialog
      trigger={trigger}
      title="Interview result"
      subtitle="Kristine Aquino · Branch Cashier · 30 Oct, in person with Paolo Garcia"
      footerNote="The offer is drafted in Offers."
      submitLabel="Save result"
    >
      <Field label="Result" required>
        <OptionGroup
          value={result}
          onChange={setResult}
          options={[
            { value: "passed", title: "Passed", description: "Moves to Offers", icon: <Check className="text-[#1e6b3a]" /> },
            { value: "not-passed", title: "Not passed", description: "Moves to Rejected", icon: <X className="text-red-700" /> },
          ]}
        />
      </Field>
      <Field label="Score">
        <FieldBox trailing="chevron">4 / 5 · Strong</FieldBox>
      </Field>
      <Field label="Interview notes" optionalHint="(private)">
        <Textarea
          defaultValue="Confident with cash handling and POS. Can start 10 Nov. Prefers the morning shift."
          className={`${TEXT_FIELD} h-16 min-h-0 resize-none leading-5`}
        />
      </Field>
      <ToggleRow
        title="Email the result to Kristine"
        description="Applicants get a result email whether they pass or not."
      />
      <Field
        label="Send email"
        hint="Sent later, not right away, so you have time to change your mind. You can edit or cancel it until then."
      >
        <FieldBox icon={<Clock className="size-4" />} trailing="chevron">
          Tomorrow, 31 Oct · 9:00 AM
        </FieldBox>
      </Field>
    </HiringDialog>
  );
}

export function OfferResponseDialog({
  trigger,
  defaultAnswer = "accepted",
}: Trigger & { defaultAnswer?: "accepted" | "declined" }) {
  const [answer, setAnswer] = useState(defaultAnswer);

  return (
    <HiringDialog
      trigger={trigger}
      title="Offer response"
      subtitle="Ellaine Torres · Branch Cashier · ₱15,500 / month · start 10 Nov"
      footerNote={answer === "accepted" ? "The offer moves to Accepted." : "The offer moves to Declined."}
      submitLabel="Save response"
    >
      <Field label="Ellaine’s answer" required>
        <OptionGroup
          value={answer}
          onChange={setAnswer}
          options={[
            { value: "accepted", title: "Accepted", description: "Next, request her documents", icon: <Check className="text-[#1e6b3a]" /> },
            { value: "declined", title: "Declined", description: "Moves to Rejected", icon: <X className="text-red-700" /> },
          ]}
        />
      </Field>
      <Field label="Reply received">
        <FieldBox trailing={<Calendar className="size-4" />}>24 Oct 2026 · by phone</FieldBox>
      </Field>
      <ToggleRow
        title="Email Ellaine"
        description="A welcome email if accepted, a thank-you email if declined."
      />
      <Field label="Send email" hint="Sent later, not right away. You can edit or cancel it until then.">
        <FieldBox icon={<Clock className="size-4" />} trailing="chevron">
          Today, 24 Oct · 6:00 PM
        </FieldBox>
      </Field>
      <EmailPreview
        subject="Welcome to Bren Raphael’s, Ellaine!"
        body="Thank you for accepting our offer for Branch Cashier. We’ll send you a list of documents to submit before your first day on 10 Nov."
      />
    </HiringDialog>
  );
}

export function RequestDocumentsDialog({ trigger }: Trigger) {
  return (
    <HiringDialog
      trigger={trigger}
      title="Request documents"
      subtitle="Ellaine Torres · Branch Cashier · start 10 Nov"
      footerNote="5 documents · due 5 Nov"
      submitLabel="Send request"
    >
      <div className="flex flex-col gap-sm">
        <Field label="Documents to request" required>
          <ul className="overflow-hidden rounded-[10px] border border-zinc-200">
            {PRE_EMPLOYMENT_DOCS.map((doc) => (
              <li
                key={doc.name}
                className={`flex items-center gap-[12px] border-b border-border-subtle px-[14px] py-[10px] last:border-b-0 ${
                  doc.fromApplication ? "bg-zinc-50" : "bg-white"
                }`}
              >
                <Checkbox
                  aria-label={doc.name}
                  defaultChecked
                  disabled={doc.fromApplication}
                  className="size-4 rounded-[4px] shadow-none disabled:opacity-100 data-[state=checked]:disabled:border-zinc-200 data-[state=checked]:disabled:bg-zinc-200 data-[state=checked]:disabled:text-zinc-400 [&_svg]:size-3"
                />
                <span
                  className={`flex-1 text-sm font-medium ${doc.fromApplication ? "text-zinc-500" : "text-zinc-900"}`}
                >
                  {doc.name}
                </span>
                <span className="text-xs text-zinc-500">
                  {doc.fromApplication ? "Already submitted" : doc.hint}
                </span>
              </li>
            ))}
          </ul>
        </Field>
        <button type="button" className="cursor-pointer self-start text-[13px] font-medium text-primary hover:underline">
          + Add another document
        </button>
      </div>
      <Field label="Submit by" required hint="Five days before the start date.">
        <FieldBox trailing={<Calendar className="size-4" />}>5 Nov 2026</FieldBox>
      </Field>
      <Field label="Message" optionalHint="(optional)">
        <Textarea
          defaultValue="Hi Ellaine, please upload these before 5 Nov so we can prepare your first day. Thank you!"
          className={`${TEXT_FIELD} h-14 min-h-0 resize-none leading-5`}
        />
      </Field>
      <ToggleRow
        title="Email the request to Ellaine"
        description="Sent right away with a secure link to upload from her phone."
      />
    </HiringDialog>
  );
}


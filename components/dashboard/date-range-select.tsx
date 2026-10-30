"use client";

import { useState, useSyncExternalStore } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRangeNavigation } from "@/components/dashboard/range-pending";
import { customRangeProblem, RANGE_OPTIONS, type CustomRangeDates, type RangeId } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

// The calendar works in plain calendar days; "YYYY-MM-DD" is the only form that leaves this file.
const toDate = (value: string) => new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)));
const toValue = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The first click starts a range, the second ends it (the same day twice is a one-day range), the next starts over. */
const pick = (range: DateRange | undefined, clicked: Date): DateRange => {
  if (!range?.from || range.to) return { from: clicked, to: undefined };
  return clicked < range.from ? { from: clicked, to: range.from } : { from: range.from, to: clicked };
};

const WIDE = "(min-width: 640px)";
const subscribeToWidth = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const ROW = "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none";

/** The Dashboard Range lives in the URL, so a refresh or a shared link keeps it; a preset applies at once, a Custom range on Apply. */
export function DateRangeSelect({ selected, label, today, custom }: { selected: RangeId; label: string; today: string; custom: CustomRangeDates }) {
  const { go } = useRangeNavigation();
  const wide = useSyncExternalStore(subscribeToWidth, () => window.matchMedia(WIDE).matches, () => true);
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<DateRange | undefined>(
    selected === "custom" ? { from: toDate(custom.from), to: toDate(custom.to) } : undefined,
  );

  const complete = picked?.from && picked.to ? { from: toValue(picked.from), to: toValue(picked.to) } : null;
  const problem = complete ? customRangeProblem(complete.from, complete.to, new Date()) : null;

  function choose(href: string) {
    setOpen(false);
    go(href);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setPicking(false);
      }}
    >
      <PopoverTrigger className="flex h-[34px] w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm sm:w-auto data-[state=open]:border-[#8b5cf6] data-[state=open]:shadow-[0_0_0_.5px_#8b5cf6]">
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{label}</span>
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          "gap-[2px] rounded-[10px] border-[#e4e4e7] p-[6px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06),0_8px_12px_rgba(0,0,0,0.1)]",
          picking ? "w-auto max-w-[calc(100vw-2rem)] p-3" : "w-[min(220px,calc(100vw-2rem))]",
        )}
      >
        {picking ? (
          <div className="flex flex-col gap-3">
            <Calendar
              mode="range"
              numberOfMonths={wide ? 2 : 1}
              selected={picked}
              onDayClick={(clicked) => setPicked(pick(picked, clicked))}
              defaultMonth={picked?.from ?? toDate(today)}
              disabled={{ after: toDate(today) }}
              endMonth={toDate(today)}
            />
            {problem === "too-long" && <p role="alert" className="text-label-sm text-red-600">Pick a range of up to a year</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPicking(false)}>
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!complete || problem !== null}
                onClick={() => complete && choose(`/dashboard?range=custom&from=${complete.from}&to=${complete.to}`)}
              >
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <>
            {RANGE_OPTIONS.map((option) => (
              <button key={option.id} type="button" className={ROW} onClick={() => choose(`/dashboard?range=${option.id}`)}>
                {option.name}
                {option.id === selected && <Check className="size-4" aria-label="Selected" />}
              </button>
            ))}
            <button type="button" className={ROW} onClick={() => setPicking(true)}>
              Custom range
              {selected === "custom" && <Check className="size-4" aria-label="Selected" />}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

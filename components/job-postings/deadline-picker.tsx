"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deadlineInputValue } from "@/lib/job-posting-form";

/** Submits the chosen day as `YYYY-MM-DD` under `name`; blank when none is chosen. */
export function DeadlinePicker({
  name,
  defaultValue,
  onChange,
  ...aria
}: {
  name: string;
  defaultValue: Date | null;
  /** Called with the chosen `YYYY-MM-DD`, or "" when cleared. */
  onChange?: (value: string) => void;
} & React.AriaAttributes) {
  const initial = deadlineInputValue(defaultValue);
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  // Parsed at local noon so the day never shifts with the time zone.
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={value} />
      <PopoverTrigger asChild>
        <Button
          id={name}
          type="button"
          variant="outline"
          className="h-auto w-full justify-between rounded-lg border-[#e4e4e7] px-[12px] py-[10px] font-normal shadow-none"
          {...aria}
        >
          <span className={selected ? "text-[#18181b]" : "text-[#a1a1aa]"}>
            {selected
              ? selected.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "Select date"}
          </span>
          <CalendarIcon className="size-4 text-[#71717a]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-sm" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(day) => {
            const next = day ? `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}` : "";
            setValue(next);
            onChange?.(next);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

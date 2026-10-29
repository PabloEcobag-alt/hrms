"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Mail, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** The 580px dialog from the Figma: header, body and a grey footer with Cancel + primary action. */
export function HiringDialog({
  trigger,
  title,
  subtitle,
  footerNote,
  submitLabel,
  children,
}: {
  trigger: React.ReactNode;
  title: string;
  subtitle: string;
  footerNote: string;
  submitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        showClose={false}
        overlayClassName="bg-[rgba(18,13,26,0.45)]"
        className="w-[calc(100vw-32px)] max-w-[580px] gap-0 rounded-2xl border-0 p-0 shadow-[0_20px_24px_rgba(0,0,0,0.2)] sm:max-w-[580px] sm:rounded-2xl sm:p-0 md:max-w-[580px] lg:max-w-[580px]"
      >
        <div className="flex items-start gap-[12px] border-b border-[#ebebeb] pb-[16px] pl-[24px] pr-[18px] pt-[20px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <DialogTitle className="text-[17px] font-semibold leading-[normal] tracking-normal text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-[normal] text-zinc-500">
              {subtitle}
            </DialogDescription>
          </div>
          <DialogClose aria-label="Close" className="cursor-pointer text-zinc-500 hover:text-foreground">
            <X className="size-[18px]" />
          </DialogClose>
        </div>
        <div className="flex flex-col gap-md px-[24px] py-[20px]">{children}</div>
        <div className="flex items-center gap-sm border-t border-[#ebebeb] bg-zinc-50 px-[24px] py-[14px]">
          <p className="flex-1 text-xs text-zinc-500">{footerNote}</p>
          <DialogClose asChild>
            <Button variant="outline" className="h-auto rounded-lg border-zinc-200 px-[16px] py-[9px] text-sm font-medium shadow-none">
              Cancel
            </Button>
          </DialogClose>
          <Button className="h-auto rounded-lg px-[16px] py-[9px] text-sm font-medium shadow-none">
            {submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  required,
  optionalHint,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optionalHint?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <p className="flex gap-[3px] text-[13px] font-medium text-zinc-800">
        {label}
        {required && <span className="text-red-600">*</span>}
        {optionalHint && <span className="font-normal text-zinc-400">{optionalHint}</span>}
      </p>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

/** A read-only field box: optional leading icon, value, optional trailing icon. */
export function FieldBox({
  icon,
  trailing,
  valueClassName,
  children,
}: {
  icon?: React.ReactNode;
  trailing?: "chevron" | React.ReactNode;
  valueClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-sm rounded-lg border border-zinc-200 bg-white px-[12px] py-[9px] text-zinc-500">
      {icon}
      <span className={cn("flex-1 truncate text-sm text-zinc-900", valueClassName)}>{children}</span>
      {trailing === "chevron" ? <ChevronDown className="size-4" /> : trailing}
    </div>
  );
}

export function OptionGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; title: string; description: string; icon: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" className="flex gap-[10px]">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-w-0 flex-1 cursor-pointer items-center gap-[12px] rounded-[10px] px-[14px] py-[12px] text-left",
              selected
                ? "border-[1.5px] border-[#8b5cf6] bg-[#f5f0ff]"
                : "border border-zinc-200 bg-white",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border",
                selected ? "border-[#7c3aed] bg-[#7c3aed]" : "border-zinc-300 bg-white",
              )}
            >
              {selected && <span className="size-[6px] rounded-full bg-white" />}
            </span>
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4",
                selected ? "bg-white" : "bg-zinc-100",
              )}
            >
              {option.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="text-sm font-medium text-zinc-900">{option.title}</span>
              <span className="text-xs text-zinc-500">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ToggleRow({
  title,
  description,
  defaultChecked = true,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center gap-[12px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p className="text-sm font-medium text-zinc-900">{title}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <Switch
        aria-label={title}
        defaultChecked={defaultChecked}
        className="h-5 w-9 data-[state=checked]:bg-[#7c3aed] [&>span]:size-4 [&>span]:data-[state=checked]:translate-x-4"
      />
    </div>
  );
}

export function EmailPreview({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="flex flex-col gap-[6px] rounded-lg bg-muted px-[14px] py-[12px]">
      <p className="flex items-center gap-[6px] text-[11px] font-semibold uppercase text-muted-foreground">
        <Mail className="size-[14px]" />
        Email preview
      </p>
      <p className="text-[13px] font-semibold text-foreground">{subject}</p>
      <p className="text-[13px] leading-[19px] text-muted-foreground">{body}</p>
    </div>
  );
}

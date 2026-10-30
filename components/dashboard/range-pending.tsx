"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { KEY_SUMMARY_CARD_HEIGHT } from "@/components/dashboard/key-summary-card";

const RangeContext = createContext<{ pending: boolean; go: (href: string) => void }>({ pending: false, go: () => {} });

/** Holds the Dashboard Range change as a transition, so only the range-dependent cards need to show a skeleton while it reloads. */
export function RangeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <RangeContext value={{ pending, go: (href) => startTransition(() => router.push(href)) }}>{children}</RangeContext>;
}

export const useRangeNavigation = () => useContext(RangeContext);

/** A card the range changes: a skeleton at the card's own height while the new range loads. */
export function RangeDependent({ children }: { children: ReactNode }) {
  const { pending } = useRangeNavigation();
  return pending ? <Skeleton className={`${KEY_SUMMARY_CARD_HEIGHT} rounded-xl`} /> : children;
}

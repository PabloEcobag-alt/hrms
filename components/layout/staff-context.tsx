"use client";

import React, { createContext, useContext } from "react";
import type { Staff } from "@/lib/portal/client";

const StaffContext = createContext<Staff | null>(null);
const PermittedPagesContext = createContext<string[] | null>(null);

export function StaffProvider({
  staff,
  permittedPages = [],
  children,
}: {
  staff: Staff;
  permittedPages?: string[];
  children: React.ReactNode;
}) {
  return (
    <StaffContext.Provider value={staff}>
      <PermittedPagesContext.Provider value={permittedPages}>
        {children}
      </PermittedPagesContext.Provider>
    </StaffContext.Provider>
  );
}

/** The page addresses this Staff member holds a Module for. */
export function usePermittedPages(): string[] {
  return useContext(PermittedPagesContext) ?? [];
}

export function useStaff(): Staff {
  const staff = useContext(StaffContext);

  if (!staff) {
    throw new Error("useStaff must be used inside StaffProvider");
  }

  return staff;
}

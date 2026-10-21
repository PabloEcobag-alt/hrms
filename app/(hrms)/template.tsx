"use client";

import React from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="w-full h-full animate-page-in">{children}</div>;
}

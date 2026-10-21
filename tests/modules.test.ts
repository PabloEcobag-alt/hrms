import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MODULES } from "@/lib/modules";

describe("Modules", () => {
  it.each(MODULES)("$name has a page and a loading state at $href", ({ href }) => {
    const dir = join(process.cwd(), "app/(hrms)", href);
    expect(existsSync(join(dir, "page.tsx"))).toBe(true);
    expect(existsSync(join(dir, "loading.tsx"))).toBe(true);
  });
});

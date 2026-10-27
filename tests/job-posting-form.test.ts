import { describe, expect, it } from "vitest";
import { deadlineInputValue, fieldsFromForm } from "@/lib/job-posting-form";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

describe("job posting form", () => {
  it("reads every freehand field, trimming text and splitting one entry per line", () => {
    expect(
      fieldsFromForm(
        form({
          title: "  Cashier ",
          department: "Retail",
          employmentType: "Full-time",
          location: "Manila",
          description: "Serve customers",
          requirements: "Friendly",
          requiredDocuments: "Resume\r\n\n  NBI clearance \n",
          screeningCriteria: "Cash handling",
          deadline: "2026-12-31",
        }),
      ),
    ).toEqual({
      title: "Cashier",
      department: "Retail",
      employmentType: "Full-time",
      location: "Manila",
      description: "Serve customers",
      requirements: "Friendly",
      requiredDocuments: ["Resume", "NBI clearance"],
      screeningCriteria: ["Cash handling"],
      deadline: new Date("2026-12-31T23:59:59.999Z"),
    });
  });

  it("turns missing or invalid values into empty fields so a Draft can clear them", () => {
    expect(fieldsFromForm(form({ deadline: "not a date" }))).toEqual({
      title: "",
      department: "",
      employmentType: "",
      location: "",
      description: "",
      requirements: "",
      requiredDocuments: [],
      screeningCriteria: [],
      deadline: null,
    });
  });

  it("formats a deadline for a date input", () => {
    expect(deadlineInputValue(new Date("2026-12-31T23:59:59.999Z"))).toBe("2026-12-31");
    expect(deadlineInputValue(null)).toBe("");
  });
});

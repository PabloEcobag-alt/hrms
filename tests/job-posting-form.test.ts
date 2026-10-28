import { describe, expect, it } from "vitest";
import { deadlineInputValue, fieldsFromForm, templateFieldsFromForm } from "@/lib/job-posting-form";

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
      openings: null,
      salaryFrom: null,
      salaryTo: null,
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
      openings: null,
      salaryFrom: null,
      salaryTo: null,
    });
  });

  it("reads openings as a number, leaving bad input for the backend to reject", () => {
    expect(fieldsFromForm(form({ openings: " 3 " })).openings).toBe(3);
    expect(fieldsFromForm(form({ openings: "" })).openings).toBeNull();
    expect(fieldsFromForm(form({ openings: "2.5" })).openings).toBe(2.5);
    expect(fieldsFromForm(form({ openings: "abc" })).openings).toBeNaN();
  });

  it("reads the salary range in pesos, blank meaning unspecified and bad input left for the backend", () => {
    expect(fieldsFromForm(form({ salaryFrom: " 16000 ", salaryTo: "18500.5" }))).toMatchObject({ salaryFrom: 16000, salaryTo: 18500.5 });
    expect(fieldsFromForm(form({ salaryFrom: "", salaryTo: "  " }))).toMatchObject({ salaryFrom: null, salaryTo: null });
    expect(fieldsFromForm(form({ salaryFrom: "abc" })).salaryFrom).toBeNaN();
  });

  it("formats a deadline for a date input", () => {
    expect(deadlineInputValue(new Date("2026-12-31T23:59:59.999Z"))).toBe("2026-12-31");
    expect(deadlineInputValue(null)).toBe("");
  });
});

describe("job template form", () => {
  it("reads the content fields and never a deadline", () => {
    const fields = templateFieldsFromForm(form({ title: " Cashier ", deadline: "2026-12-31", requiredDocuments: "Resume\nNBI" }));
    expect(fields).toMatchObject({ title: "Cashier", requiredDocuments: ["Resume", "NBI"] });
    expect(fields).not.toHaveProperty("deadline");
    expect(templateFieldsFromForm(form({ openings: "4" })).openings).toBe(4);
    expect(templateFieldsFromForm(form({ salaryFrom: "100", salaryTo: "200" }))).toMatchObject({ salaryFrom: 100, salaryTo: 200 });
  });
});

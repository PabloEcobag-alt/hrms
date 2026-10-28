import { describe, expect, it } from "vitest";
import { addRequiredDocument, deadlineInputValue, editFooter, fieldsFromForm, joinRequirements, splitRequirements, templateFieldsFromForm } from "@/lib/job-posting-form";

const form = (entries: Record<string, string | string[]>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of [value].flat()) data.append(key, item);
  }
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
          summary: "Serve customers",
          responsibilities: "• Ring up sales",
          qualifications: "Friendly",
          requiredDocuments: ["Resume or CV", "", "  NBI clearance "],
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
      requirements: "Responsibilities:\n• Ring up sales\n\nQualifications:\nFriendly",
      requiredDocuments: ["Resume or CV", "NBI clearance"],
      screeningCriteria: ["Cash handling"],
      deadline: new Date("2026-12-31T23:59:59.999Z"),
      openings: null,
      salaryFrom: null,
      salaryTo: null,
      workSchedule: null,
    });
  });

  it("reads no Required Documents when none are ticked", () => {
    expect(fieldsFromForm(form({ title: "Cashier" })).requiredDocuments).toEqual([]);
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
      workSchedule: null,
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

  it("reads the work schedule trimmed, blank meaning unspecified", () => {
    expect(fieldsFromForm(form({ workSchedule: "  Mon–Fri, 9am–6pm " })).workSchedule).toBe("Mon–Fri, 9am–6pm");
    expect(fieldsFromForm(form({ workSchedule: "  " })).workSchedule).toBeNull();
  });

  it("formats a deadline for a date input", () => {
    expect(deadlineInputValue(new Date("2026-12-31T23:59:59.999Z"))).toBe("2026-12-31");
    expect(deadlineInputValue(null)).toBe("");
  });
});

describe("job description sections", () => {
  it("stores Summary as the description and the other two sections together as requirements", () => {
    const fields = fieldsFromForm(form({ summary: " Help out ", responsibilities: "", qualifications: " Diploma " }));
    expect(fields.description).toBe("Help out");
    expect(fields.requirements).toBe("Qualifications:\nDiploma");
    expect(fieldsFromForm(form({ responsibilities: "Pack" })).requirements).toBe("Responsibilities:\nPack");
    expect(fieldsFromForm(form({})).requirements).toBe("");
  });

  it("round-trips Responsibilities and Qualifications, including multiple lines", () => {
    const sections = { responsibilities: "• A\n• B", qualifications: "• C\n\n• D" };
    expect(splitRequirements(joinRequirements(sections))).toEqual(sections);
    expect(splitRequirements(joinRequirements({ responsibilities: "", qualifications: "Q" }))).toEqual({ responsibilities: "", qualifications: "Q" });
  });

  it("shows legacy unheaded requirements under Qualifications", () => {
    expect(splitRequirements("Experience needed")).toEqual({ responsibilities: "", qualifications: "Experience needed" });
    expect(splitRequirements("")).toEqual({ responsibilities: "", qualifications: "" });
  });
});

describe("job template form", () => {
  it("reads the content fields and never a deadline", () => {
    const fields = templateFieldsFromForm(form({ title: " Cashier ", deadline: "2026-12-31", requiredDocuments: ["Resume", "NBI"] }));
    expect(fields).toMatchObject({ title: "Cashier", requiredDocuments: ["Resume", "NBI"] });
    expect(fields).not.toHaveProperty("deadline");
    expect(templateFieldsFromForm(form({ openings: "4" })).openings).toBe(4);
    expect(templateFieldsFromForm(form({ salaryFrom: "100", salaryTo: "200" }))).toMatchObject({ salaryFrom: 100, salaryTo: 200 });
  });
});

describe("addRequiredDocument", () => {
  it("adds a trimmed custom document to the list", () => {
    expect(addRequiredDocument(["Resume or CV"], "  NBI clearance ")).toEqual({ documents: ["Resume or CV", "NBI clearance"] });
  });

  it("rejects a blank name", () => {
    expect(addRequiredDocument(["Resume or CV"], "   ")).toEqual({ error: "Enter a document name." });
  });

  it("rejects a duplicate regardless of case", () => {
    expect(addRequiredDocument(["Resume or CV"], "resume or cv")).toEqual({ error: "That document is already listed." });
  });
});

describe("editing a posting with the shared form", () => {
  it("offers Save as draft and Publish only while the posting is a Draft", () => {
    expect(editFooter("draft")).toEqual({ saveAsDraft: true, publish: true, saveChanges: false, delete: true, close: false, fill: false });
  });

  it("saves a Published posting live, with no Save as draft, and lets it be closed or filled", () => {
    expect(editFooter("open")).toEqual({ saveAsDraft: false, publish: false, saveChanges: true, delete: false, close: true, fill: true });
  });

  it("offers nothing on a Closed or Filled posting", () => {
    const none = { saveAsDraft: false, publish: false, saveChanges: false, delete: false, close: false, fill: false };
    expect(editFooter("closed")).toEqual(none);
    expect(editFooter("filled")).toEqual(none);
  });
});

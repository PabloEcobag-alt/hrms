// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApplicationDocuments } from "@/components/hiring/application-documents";
import type { ApplicationDocument } from "@/lib/applications";

afterEach(cleanup);

const submitted = (id: number, name: string, contentType: string): ApplicationDocument => ({
  id, name, contentType, size: 2048, uploadedAt: null, requiredFor: "Resume or CV", status: "Submitted",
  downloadUrl: `/api/applications/5/documents/${id}`,
});
const open = (documents: ApplicationDocument[]) => render(<ApplicationDocuments documents={documents} applicantName="Kristine Aquino" />);

it("opens a PDF in an iframe on the Document route, headed by file name and Applicant", async () => {
  open([submitted(7, "resume.pdf", "application/pdf")]);
  await userEvent.click(screen.getByRole("button", { name: "Open resume.pdf" }));
  const dialog = screen.getByRole("dialog");
  expect(dialog.querySelector("iframe")?.getAttribute("src")).toBe("/api/applications/5/documents/7");
  expect(dialog.querySelector("img")).toBeNull();
  expect(dialog.textContent).toContain("resume.pdf");
  expect(dialog.textContent).toContain("Kristine Aquino");
});

it("opens an image in an img", async () => {
  open([submitted(8, "id.png", "image/png")]);
  await userEvent.click(screen.getByRole("button", { name: "Open id.png" }));
  const dialog = screen.getByRole("dialog");
  expect(dialog.querySelector("img")?.getAttribute("src")).toBe("/api/applications/5/documents/8");
  expect(dialog.querySelector("iframe")).toBeNull();
});

it("downloads from the viewer and keeps the row's download icon on the Document route", async () => {
  open([submitted(7, "resume.pdf", "application/pdf")]);
  const rowDownload = screen.getByRole("link", { name: "Download resume.pdf" });
  expect(rowDownload.getAttribute("href")).toBe("/api/applications/5/documents/7");
  await userEvent.click(screen.getByRole("button", { name: "Open resume.pdf" }));
  const download = screen.getAllByRole("link", { name: "Download resume.pdf" }).find((link) => link.closest("[role=dialog]"));
  expect(download?.getAttribute("href")).toBe("/api/applications/5/documents/7");
  expect(download?.hasAttribute("download")).toBe(true);
});

it("prints the file from the viewer", async () => {
  open([submitted(7, "resume.pdf", "application/pdf")]);
  await userEvent.click(screen.getByRole("button", { name: "Open resume.pdf" }));
  const frame = screen.getByRole("dialog").querySelector("iframe")!;
  const print = vi.fn();
  Object.defineProperty(frame, "contentWindow", { value: { print } });
  await userEvent.click(screen.getByRole("button", { name: "Print" }));
  expect(print).toHaveBeenCalled();
});

it("falls back to opening the file when the frame cannot be printed", async () => {
  open([submitted(7, "resume.pdf", "application/pdf")]);
  await userEvent.click(screen.getByRole("button", { name: "Open resume.pdf" }));
  const frame = screen.getByRole("dialog").querySelector("iframe")!;
  Object.defineProperty(frame, "contentWindow", { value: { print: () => { throw new Error("cross-origin"); } } });
  const opened = vi.spyOn(window, "open").mockReturnValue(null);
  await userEvent.click(screen.getByRole("button", { name: "Print" }));
  expect(opened).toHaveBeenCalledWith("/api/applications/5/documents/7", "_blank");
});

it("closes with the Close button and with Escape", async () => {
  open([submitted(7, "resume.pdf", "application/pdf")]);
  await userEvent.click(screen.getByRole("button", { name: "Open resume.pdf" }));
  await userEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Open resume.pdf" }));
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("offers only a download for a file the browser cannot display", () => {
  open([submitted(9, "letter.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")]);
  expect(screen.queryByRole("button", { name: "Open letter.docx" })).toBeNull();
  expect(screen.getByRole("link", { name: "Download letter.docx" })).toBeTruthy();
});

it("opens an image in a new tab to print it", async () => {
  open([submitted(8, "id.png", "image/png")]);
  await userEvent.click(screen.getByRole("button", { name: "Open id.png" }));
  const opened = vi.spyOn(window, "open").mockReturnValue(null);
  await userEvent.click(screen.getByRole("button", { name: "Print" }));
  expect(opened).toHaveBeenCalledWith("/api/applications/5/documents/8", "_blank");
});

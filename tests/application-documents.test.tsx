// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApplicationDocuments } from "@/components/hiring/application-documents";
import type { ApplicationDocument } from "@/lib/applications";

const redirect = () => ({ type: "opaqueredirect", ok: false, status: 0 });
beforeEach(() => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(redirect())); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const submitted = (id: number, name: string, contentType: string, uploadedAt: Date | null = null): ApplicationDocument => ({
  id, name, contentType, size: 2048, uploadedAt, requiredFor: "Resume or CV", status: "Submitted",
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

const WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

it("opens a Word file to a can't-preview state with download and no print", async () => {
  open([submitted(9, "letter.docx", WORD)]);
  await userEvent.click(screen.getByRole("button", { name: "Open letter.docx" }));
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByText("Can't preview this file")).toBeTruthy();
  expect(dialog.queryByRole("button", { name: "Print" })).toBeNull();
  expect(dialog.getByRole("link", { name: "Download letter.docx" }).getAttribute("href")).toBe("/api/applications/5/documents/9");
  expect(screen.getByRole("dialog").querySelector("iframe, img")).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

it("keeps a Requested row greyed and closed", async () => {
  open([{ status: "Requested", requiredFor: "NBI clearance" } as ApplicationDocument]);
  expect(screen.getByText("Requested")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
});

it("says the file can't be opened on a not-found answer, keeps download and close, and retries", async () => {
  vi.mocked(fetch).mockResolvedValue({ type: "basic", ok: false, status: 404 } as Response);
  open([submitted(7, "resume.pdf", "application/pdf")]);
  await userEvent.click(screen.getByRole("button", { name: "Open resume.pdf" }));
  const dialog = within(screen.getByRole("dialog"));
  expect(await dialog.findByText("Can't open this file right now")).toBeTruthy();
  expect(screen.getByRole("dialog").querySelector("iframe")).toBeNull();
  expect(dialog.queryByRole("button", { name: "Print" })).toBeNull();
  expect(dialog.getByRole("link", { name: "Download resume.pdf" })).toBeTruthy();
  vi.mocked(fetch).mockResolvedValue(redirect() as unknown as Response);
  await userEvent.click(dialog.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(screen.getByRole("dialog").querySelector("iframe")).not.toBeNull());
  await userEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("says the file can't be opened when an image fails to load", async () => {
  open([submitted(8, "id.png", "image/png")]);
  await userEvent.click(screen.getByRole("button", { name: "Open id.png" }));
  fireEvent.error(screen.getByRole("dialog").querySelector("img")!);
  expect(await screen.findByText("Can't open this file right now")).toBeTruthy();
});

it("opens an image in a new tab to print it", async () => {
  open([submitted(8, "id.png", "image/png")]);
  await userEvent.click(screen.getByRole("button", { name: "Open id.png" }));
  const opened = vi.spyOn(window, "open").mockReturnValue(null);
  await userEvent.click(screen.getByRole("button", { name: "Print" }));
  expect(opened).toHaveBeenCalledWith("/api/applications/5/documents/8", "_blank");
});

it("shows File details with only the data we hold", async () => {
  open([submitted(7, "resume.pdf", "application/pdf", new Date("2026-10-28T12:05:00Z"))]);
  await userEvent.click(screen.getByRole("button", { name: "Open resume.pdf" }));
  const panel = within(screen.getByRole("dialog")).getByRole("complementary", { name: "File details" });
  const rows = Object.fromEntries([...panel.querySelectorAll("dt")].map((dt) => [dt.textContent, dt.nextElementSibling?.textContent]));
  expect(rows).toEqual({
    Type: "PDF document",
    Size: "2 KB",
    Requirement: "Resume or CV",
    "Uploaded by": "Kristine Aquino · with application",
    Uploaded: "28 Oct 2026, 8:05 PM",
  });
  expect(within(panel).getByText("Submitted")).toBeTruthy();
  for (const absent of ["Folder", "Valid until", "Activity", "Replace"]) expect(within(panel).queryByText(absent)).toBeNull();
});

it("names an image's type and leaves the upload date out when we do not hold it", async () => {
  open([submitted(8, "id.png", "image/png")]);
  await userEvent.click(screen.getByRole("button", { name: "Open id.png" }));
  const panel = within(screen.getByRole("dialog")).getByRole("complementary", { name: "File details" });
  expect(within(panel).getByText("PNG image")).toBeTruthy();
  expect(within(panel).queryByText("Uploaded")).toBeNull();
});

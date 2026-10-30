// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangeSelect } from "@/components/dashboard/date-range-select";
import { RangeProvider } from "@/components/dashboard/range-pending";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  cleanup();
  push.mockReset();
  vi.unstubAllGlobals();
});

const TODAY = "2026-10-28";
const open = (props: Partial<Parameters<typeof DateRangeSelect>[0]> = {}) =>
  render(
    <RangeProvider>
      <DateRangeSelect selected="this-month" label="This month · 1–28 Oct 2026" today={TODAY} custom={{ from: "2026-10-01", to: "2026-10-28" }} {...props} />
    </RangeProvider>,
  );
const day = (name: RegExp) => screen.getByRole("button", { name });
const apply = () => screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement;

async function openCalendar() {
  await userEvent.click(screen.getByRole("button", { name: /This month/ }));
  await userEvent.click(screen.getByRole("button", { name: /^Custom range/ }));
}

it("applies a preset at once", async () => {
  open();
  await userEvent.click(screen.getByRole("button", { name: /This month/ }));
  await userEvent.click(screen.getByRole("button", { name: "Last 30 days" }));
  expect(push).toHaveBeenCalledWith("/dashboard?range=last-30-days");
});

it("offers Custom range, with Apply disabled until both dates are chosen", async () => {
  open();
  await openCalendar();
  expect(apply().disabled).toBe(true);
  await userEvent.click(day(/October 5th, 2026/));
  expect(apply().disabled).toBe(true);
  await userEvent.click(day(/October 15th, 2026/));
  expect(apply().disabled).toBe(false);
});

it("puts the two dates in the URL on Apply", async () => {
  open();
  await openCalendar();
  await userEvent.click(day(/October 5th, 2026/));
  await userEvent.click(day(/October 15th, 2026/));
  await userEvent.click(apply());
  expect(push).toHaveBeenCalledWith("/dashboard?range=custom&from=2026-10-05&to=2026-10-15");
  expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
});

it("disables the days after today", async () => {
  open();
  await openCalendar();
  expect((day(/October 28th, 2026/) as HTMLButtonElement).disabled).toBe(false);
  expect((day(/October 29th, 2026/) as HTMLButtonElement).disabled).toBe(true);
});

it("does not let a range over a year be applied", async () => {
  open({ selected: "custom", label: "Custom · 1 Sep – 15 Oct 2026", custom: { from: "2025-01-01", to: "2026-10-15" } });
  await userEvent.click(screen.getByRole("button", { name: /^Custom ·/ }));
  await userEvent.click(screen.getByRole("button", { name: /^Custom range/ }));
  expect(screen.getByRole("alert").textContent).toBe("Pick a range of up to a year");
  expect(apply().disabled).toBe(true);
});

it("starts the calendar on the applied Custom range", async () => {
  open({ selected: "custom", label: "Custom · 1–15 Sep 2026", custom: { from: "2026-09-01", to: "2026-09-15" } });
  await userEvent.click(screen.getByRole("button", { name: /^Custom ·/ }));
  await userEvent.click(screen.getByRole("button", { name: /^Custom range/ }));
  expect(apply().disabled).toBe(false);
});

it("closes on Escape", async () => {
  open();
  await openCalendar();
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
});

it("takes the same day twice as a one-day range, and the two dates in either order", async () => {
  open();
  await openCalendar();
  await userEvent.click(day(/October 5th, 2026/));
  await userEvent.click(day(/October 5th, 2026/));
  await userEvent.click(apply());
  expect(push).toHaveBeenLastCalledWith("/dashboard?range=custom&from=2026-10-05&to=2026-10-05");

  await openCalendar();
  await userEvent.click(day(/October 20th, 2026/));
  await userEvent.click(day(/October 10th, 2026/));
  await userEvent.click(apply());
  expect(push).toHaveBeenLastCalledWith("/dashboard?range=custom&from=2026-10-10&to=2026-10-20");
});

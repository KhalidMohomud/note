import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getNote: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/lib/notes/data", () => ({
  getNoteForCurrentUser: mocks.getNote,
}));
vi.mock("@/app/actions/notes", () => ({
  deleteNoteAction: vi.fn(),
}));

import NotePage from "@/app/(authenticated)/notes/[id]/page";

describe("note success alerts", () => {
  beforeEach(() => {
    mocks.getNote.mockResolvedValue({
      id: 9,
      title: "Interview notes",
      body: "Details",
      createdAt: new Date("2026-01-01T09:00:00Z"),
      updatedAt: new Date("2026-01-02T09:00:00Z"),
    });
  });

  it.each([
    ["created", "Note created successfully."],
    ["updated", "Note updated successfully."],
  ])("shows the %s alert", async (status, message) => {
    const page = await NotePage({
      params: Promise.resolve({ id: "9" }),
      searchParams: Promise.resolve({ status }),
    });

    render(page);

    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  it("allows the success alert to be dismissed", async () => {
    const page = await NotePage({
      params: Promise.resolve({ id: "9" }),
      searchParams: Promise.resolve({ status: "created" }),
    });
    render(page);

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ignores unknown status values", async () => {
    const page = await NotePage({
      params: Promise.resolve({ id: "9" }),
      searchParams: Promise.resolve({ status: "unknown" }),
    });
    render(page);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

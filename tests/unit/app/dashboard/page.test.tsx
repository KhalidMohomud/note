import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ listNotes: vi.fn() }));

vi.mock("@/lib/notes/data", () => ({
  listNotesForCurrentUser: mocks.listNotes,
}));

import DashboardPage from "@/app/(authenticated)/dashboard/page";

describe("notes search", () => {
  beforeEach(() => {
    mocks.listNotes.mockResolvedValue([]);
  });

  it("shows the normal empty state for an empty search", async () => {
    const page = await DashboardPage({
      searchParams: Promise.resolve({ q: "   " }),
    });

    render(page);

    expect(mocks.listNotes).toHaveBeenCalledWith("");
    expect(
      screen.getByRole("heading", { name: "No notes yet" }),
    ).toBeInTheDocument();
  });

  it("shows a distinct no-results state and a clear link", async () => {
    const page = await DashboardPage({
      searchParams: Promise.resolve({ q: "  roadmap  " }),
    });

    render(page);

    expect(mocks.listNotes).toHaveBeenCalledWith("roadmap");
    expect(
      screen.getByRole("heading", { name: "No notes found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No notes match “roadmap”.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("lists the notes returned for the authenticated user", async () => {
    mocks.listNotes.mockResolvedValue([
      {
        id: 17,
        title: "Merhaba interview",
        createdAt: new Date("2026-01-01T09:00:00Z"),
        updatedAt: new Date("2026-01-02T09:00:00Z"),
      },
      {
        id: 22,
        title: "Team roadmap",
        createdAt: new Date("2026-01-03T09:00:00Z"),
        updatedAt: new Date("2026-01-04T09:00:00Z"),
      },
    ]);

    const page = await DashboardPage({
      searchParams: Promise.resolve({ q: "roadmap" }),
    });

    render(page);

    expect(mocks.listNotes).toHaveBeenCalledWith("roadmap");
    expect(
      screen.getByRole("link", { name: /Merhaba interview/ }),
    ).toHaveAttribute("href", "/notes/17");
    expect(screen.getByRole("link", { name: /Team roadmap/ })).toHaveAttribute(
      "href",
      "/notes/22",
    );
  });
});

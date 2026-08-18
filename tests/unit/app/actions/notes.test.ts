import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  redirect: vi.fn(),
  unstableRethrow: vi.fn(),
  updateNote: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  unstable_rethrow: mocks.unstableRethrow,
}));

vi.mock("@/lib/notes/data", () => ({
  createNoteForCurrentUser: mocks.createNote,
  deleteNoteForCurrentUser: mocks.deleteNote,
  updateNoteForCurrentUser: mocks.updateNote,
}));

import {
  createNoteAction,
  deleteNoteAction,
  updateNoteAction,
} from "@/app/actions/notes";

function noteForm(title: string, body: string) {
  const formData = new FormData();
  formData.set("title", title);
  formData.set("body", body);
  return formData;
}

describe("note actions", () => {
  beforeEach(() => {
    mocks.createNote.mockResolvedValue({ id: 8 });
    mocks.updateNote.mockResolvedValue(true);
    mocks.deleteNote.mockResolvedValue(true);
  });

  it("returns validation errors before creating a note", async () => {
    const result = await createNoteAction({}, noteForm("", ""));

    expect(result.errors?.title).toBeDefined();
    expect(result.errors?.body).toBeDefined();
    expect(mocks.createNote).not.toHaveBeenCalled();
  });

  it("creates a valid note and redirects to it", async () => {
    await createNoteAction({}, noteForm(" Title ", " Body "));

    expect(mocks.createNote).toHaveBeenCalledWith({
      title: "Title",
      body: "Body",
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/notes/8?status=created");
  });

  it("does not update a note that is missing or not owned", async () => {
    mocks.updateNote.mockResolvedValue(false);

    const result = await updateNoteAction(
      99,
      {},
      noteForm("Title", "Body"),
    );

    expect(result).toEqual({ message: "Note not found." });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("updates an owned note and redirects to it", async () => {
    await updateNoteAction(9, {}, noteForm("Updated", "Body"));

    expect(mocks.updateNote).toHaveBeenCalledWith(9, {
      title: "Updated",
      body: "Body",
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/notes/9?status=updated");
  });

  it("does not delete a note that is missing or not owned", async () => {
    mocks.deleteNote.mockResolvedValue(false);

    const result = await deleteNoteAction(99, {}, new FormData());

    expect(result).toEqual({ message: "Note not found." });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("deletes an owned note and redirects to the list", async () => {
    await deleteNoteAction(9, {}, new FormData());

    expect(mocks.deleteNote).toHaveBeenCalledWith(9);
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard?status=deleted");
  });

  it("preserves authentication redirects from every write action", async () => {
    const authenticationRedirect = new Error("NEXT_REDIRECT:/login");
    mocks.createNote.mockRejectedValue(authenticationRedirect);
    mocks.updateNote.mockRejectedValue(authenticationRedirect);
    mocks.deleteNote.mockRejectedValue(authenticationRedirect);
    mocks.unstableRethrow.mockImplementation((error: unknown) => {
      throw error;
    });

    await expect(
      createNoteAction({}, noteForm("Title", "Body")),
    ).rejects.toBe(authenticationRedirect);
    await expect(
      updateNoteAction(9, {}, noteForm("Title", "Body")),
    ).rejects.toBe(authenticationRedirect);
    await expect(
      deleteNoteAction(9, {}, new FormData()),
    ).rejects.toBe(authenticationRedirect);

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

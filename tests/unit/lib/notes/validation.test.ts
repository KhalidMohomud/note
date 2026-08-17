import { describe, expect, it } from "vitest";

import { noteIdSchema, noteSchema } from "@/lib/notes/validation";

describe("note validation", () => {
  it("trims valid note content", () => {
    expect(
      noteSchema.parse({ title: "  Interview notes  ", body: "  Details  " }),
    ).toEqual({ title: "Interview notes", body: "Details" });
  });

  it.each([
    { title: "", body: "Body" },
    { title: "Title", body: "   " },
    { title: "x".repeat(201), body: "Body" },
    { title: "Title", body: "x".repeat(10_001) },
  ])("rejects invalid note input: $title", (input) => {
    expect(noteSchema.safeParse(input).success).toBe(false);
  });

  it.each(["1", 42])("accepts a positive note ID: %s", (id) => {
    expect(noteIdSchema.parse(id)).toBe(Number(id));
  });

  it.each(["not-a-number", "0", -1, 1.5])(
    "rejects an invalid note ID: %s",
    (id) => {
      expect(noteIdSchema.safeParse(id).success).toBe(false);
    },
  );
});

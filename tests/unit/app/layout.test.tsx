import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import RootLayout, { metadata } from "@/app/layout";

describe("Root layout", () => {
  it("provides the application metadata", () => {
    expect(metadata).toMatchObject({
      title: "Welcome Notes",
      description:
        "A simple notes application for the Merhaba developer assignment.",
    });
  });

  it("wraps content in an English document", () => {
    const child = <main>Test content</main>;
    const document = RootLayout({ children: child, params: Promise.resolve({}) });
    const body = document.props.children as ReactElement<{
      children: ReactElement;
    }>;

    expect(document.type).toBe("html");
    expect(document.props.lang).toBe("en");
    expect(body.type).toBe("body");
    expect(body.props.children).toBe(child);
  });
});

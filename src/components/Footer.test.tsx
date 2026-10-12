import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("links to the club's terms and privacy pages", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "https://devdogsuga.org/legal/terms",
    );
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "https://devdogsuga.org/legal/privacy",
    );
  });
});

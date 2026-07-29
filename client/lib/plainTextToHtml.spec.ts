import { describe, it, expect } from "vitest";
import { plainTextToHtml } from "./plainTextToHtml";

describe("plainTextToHtml", () => {
  it("returns an empty string for empty input", () => {
    expect(plainTextToHtml("")).toBe("");
  });

  it("wraps a single paragraph in one <p>", () => {
    expect(plainTextToHtml("Hello there")).toBe("<p>Hello there</p>");
  });

  it("splits two blocks separated by a blank line into two <p> elements", () => {
    const out = plainTextToHtml("First paragraph.\n\nSecond paragraph.");
    expect(out).toBe("<p>First paragraph.</p>\n<p>Second paragraph.</p>");
  });

  it("converts a single newline inside a block to <br>, keeping one <p>", () => {
    const out = plainTextToHtml("Line one\nLine two");
    expect(out).toBe("<p>Line one<br>Line two</p>");
    expect(out.match(/<p>/g)?.length).toBe(1);
  });

  it("escapes &, <, and >", () => {
    const out = plainTextToHtml("Smith & Sons <Holdings>");
    expect(out).toBe("<p>Smith &amp; Sons &lt;Holdings&gt;</p>");
  });

  it("escapes a typed <script> tag instead of emitting a live tag", () => {
    const out = plainTextToHtml("<script>alert(1)</script>");
    expect(out).not.toContain("<script");
    expect(out).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("turns a bare URL into an anchor whose href and text both carry it", () => {
    const url = "https://connect.intuit.com/pay/abc";
    const out = plainTextToHtml(url);
    expect(out).toBe(`<p><a href="${url}">${url}</a></p>`);
  });

  it("escapes query-param ampersands to &amp; in the href", () => {
    const url = "https://x/y?a=1&b=2";
    const out = plainTextToHtml(url);
    expect(out).toBe(
      '<p><a href="https://x/y?a=1&amp;b=2">https://x/y?a=1&amp;b=2</a></p>',
    );
  });

  it("keeps a trailing period after a URL outside the anchor", () => {
    const out = plainTextToHtml("Visit https://connect.intuit.com/pay/abc.");
    expect(out).toBe(
      '<p>Visit <a href="https://connect.intuit.com/pay/abc">https://connect.intuit.com/pay/abc</a>.</p>',
    );
  });

  it("normalizes \\r\\n input", () => {
    const out = plainTextToHtml("First\r\n\r\nSecond");
    expect(out).toBe("<p>First</p>\n<p>Second</p>");
  });
});

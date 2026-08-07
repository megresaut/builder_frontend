import { describe, it, expect } from "vitest";
import { encodeObjectKey, fileUrl, parseAttachmentId } from "@/api/fileUrl";

// The real key that broke previews in production: `maintenance_attachments`
// keeps the uploader's original filename, and vendor PDFs are named `Inv#...`.
const REAL_KEY =
  "maintenance/tmp/c62f07e9-8585-409a-b969-2ccc3d7e99e8/28 Coleytown - Edgerton - Inv#1175398478 - 8.5.26 - $14,713.pdf";

describe("encodeObjectKey", () => {
  it("encodes `#` so the browser cannot truncate the path at a fragment", () => {
    // Unencoded, everything from `#` onward never reaches the server and the
    // static file server answers `404 page not found`.
    expect(encodeObjectKey(REAL_KEY)).not.toContain("#");
    expect(encodeObjectKey(REAL_KEY)).toContain("%23");
  });

  it("keeps `/` as a path separator rather than encoding it away", () => {
    expect(encodeObjectKey("maintenance/tmp/abc/file.pdf")).toBe(
      "maintenance/tmp/abc/file.pdf",
    );
  });

  it("encodes `?` so a filename cannot start a query string", () => {
    expect(encodeObjectKey("a/b?c.pdf")).toBe("a/b%3Fc.pdf");
  });

  it("encodes spaces and other characters that are illegal raw in a path", () => {
    expect(encodeObjectKey("a/two words.pdf")).toBe("a/two%20words.pdf");
  });

  it("survives a round trip back to the on-disk key", () => {
    const decoded = encodeObjectKey(REAL_KEY)
      .split("/")
      .map(decodeURIComponent)
      .join("/");
    expect(decoded).toBe(REAL_KEY);
  });

  it("strips a leading slash so the key cannot double up the separator", () => {
    expect(encodeObjectKey("/maintenance/a.pdf")).toBe("maintenance/a.pdf");
  });

  it("returns an empty string for a missing key instead of throwing", () => {
    expect(encodeObjectKey(undefined)).toBe("");
    expect(encodeObjectKey(null)).toBe("");
    expect(encodeObjectKey("")).toBe("");
  });
});

describe("fileUrl", () => {
  it("builds a /files/ URL whose path the server can actually resolve", () => {
    const url = fileUrl(REAL_KEY);
    expect(url).toContain("/files/");
    expect(url).not.toContain("#");
    expect(url.endsWith("%2414%2C713.pdf")).toBe(true);
  });

  it("does not double the slash before /files/", () => {
    expect(fileUrl("a.pdf")).not.toContain("//files/");
  });
});

describe("parseAttachmentId", () => {
  it("accepts a real numeric attachment id", () => {
    expect(parseAttachmentId(590)).toBe(590);
    expect(parseAttachmentId("590")).toBe(590);
    expect(parseAttachmentId(" 590 ")).toBe(590);
  });

  it("rejects the synthetic ids getAttachmentData fabricates for unsaved files", () => {
    // `${fileName}-${index}` for a file that has no row yet. parseInt() would
    // read this as attachment 28 and serve a completely unrelated document.
    expect(parseAttachmentId("28 Coleytown - Edgerton - Inv#1175398478.pdf-0")).toBeNull();
    expect(parseAttachmentId("proposal.pdf-3")).toBeNull();
    expect(parseAttachmentId("file-0")).toBeNull();
  });

  it("rejects ids that merely start with digits", () => {
    expect(parseAttachmentId("123abc")).toBeNull();
    expect(parseAttachmentId("12.5")).toBeNull();
    expect(parseAttachmentId("-4")).toBeNull();
  });

  it("rejects empty and missing ids", () => {
    expect(parseAttachmentId(undefined)).toBeNull();
    expect(parseAttachmentId(null)).toBeNull();
    expect(parseAttachmentId("")).toBeNull();
    expect(parseAttachmentId("   ")).toBeNull();
  });
});

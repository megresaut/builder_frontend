/**
 * Parse an .eml (RFC822/MIME) file and return displayable fields in the same shape as ParsedMsg.
 */

import type { ParsedMsg } from "@/utils/parseMsgFile";

export async function parseEmlFile(input: File | Blob | ArrayBuffer): Promise<ParsedMsg> {
  const text =
    typeof input === "string"
      ? input
      : input instanceof ArrayBuffer
        ? new TextDecoder("utf-8", { fatal: false }).decode(input)
        : await (input as File | Blob).text();

  const { headers, body: rawBody } = splitHeadersAndBody(text);
  const subject = getHeader(headers, "subject") ?? "";
  const from = formatAddress(getHeader(headers, "from")) || "—";
  const to = formatAddressList(getHeader(headers, "to")) || "—";
  const dateStr = getHeader(headers, "date");
  const date = formatDate(dateStr ?? "");

  const { html: extractedHtml, plain: extractedPlain } = extractBodyParts(headers, rawBody);
  let bodyHtml = extractedHtml;
  let bodyPlain = extractedPlain;
  if (!bodyHtml && bodyPlain) bodyHtml = escapeHtml(bodyPlain);
  if (!bodyPlain && bodyHtml) bodyPlain = stripHtml(bodyHtml);

  return {
    subject: decodeMimeWords(subject),
    from: decodeMimeWords(from),
    to: decodeMimeWords(to),
    date,
    bodyHtml: bodyHtml || bodyPlain || "",
    bodyPlain: bodyPlain || undefined,
  };
}

// Recursively walks MIME parts to find the text/html and text/plain bodies.
// Needed because many transactional/billing senders wrap the actual
// alternative parts a level deeper than the top level, e.g.
// multipart/mixed (or multipart/related) > multipart/alternative >
// text/html + text/plain. A single non-recursive pass over the outer
// boundary only sees a "multipart/alternative" part and never opens it,
// leaving both bodies empty even though the mail has content.
function extractBodyParts(headers: string, rawBody: string, depth = 0): { html: string; plain: string } {
  if (depth > 5) return { html: "", plain: "" };

  const contentTypeRaw = getHeader(headers, "content-type") ?? "";
  const contentType = contentTypeRaw.toLowerCase();
  const contentTransferEncoding = (getHeader(headers, "content-transfer-encoding") ?? "").toLowerCase();

  if (contentType.includes("multipart/")) {
    // Match against the original-case header, not the lowercased `contentType`
    // above — real boundary tokens (e.g. Outlook's "..._CH3PR13MB6410...")
    // are mixed-case, and delimiters in the body are case-sensitive, so a
    // lowercased boundary silently fails to match any "--boundary" line.
    const boundaryMatch = contentTypeRaw.match(/boundary\s*=\s*["']?([^"'\s;]+)["']?/i);
    const boundary = boundaryMatch ? boundaryMatch[1].trim() : null;
    let html = "";
    let plain = "";
    if (boundary) {
      const parts = splitMultipart(rawBody, boundary);
      for (const part of parts) {
        const { headers: partHeaders, body: partBody } = splitHeadersAndBody(part);
        const nested = extractBodyParts(partHeaders, partBody, depth + 1);
        if (nested.html && !html) html = nested.html;
        if (nested.plain && !plain) plain = nested.plain;
      }
    }
    return { html, plain };
  }

  if (contentType.includes("text/html")) {
    return { html: decodeBody(rawBody, contentTransferEncoding), plain: "" };
  }
  if (contentType.includes("text/") || !contentType) {
    return { html: "", plain: decodeBody(rawBody, contentTransferEncoding) };
  }
  // Non-text leaf part (attachment, image, etc.) — not a body candidate.
  return { html: "", plain: "" };
}

function splitHeadersAndBody(raw: string): { headers: string; body: string } {
  const re = /\r?\n\r?\n/;
  const idx = raw.search(re);
  if (idx === -1) return { headers: raw, body: "" };
  return {
    headers: raw.slice(0, idx),
    body: raw.slice(idx + (raw[idx + 1] === "\r" ? 4 : 2)),
  };
}

function parseHeaders(headerSection: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = headerSection.split(/\r?\n/);
  let currentKey: string | null = null;
  let currentValue: string[] = [];

  for (const line of lines) {
    const folded = /^\s/.test(line);
    if (folded && currentKey !== null) {
      currentValue.push(line.trimStart());
      continue;
    }
    if (currentKey !== null && currentValue.length > 0) {
      map.set(currentKey.toLowerCase(), currentValue.join(" ").trim());
    }
    const colon = line.indexOf(":");
    if (colon === -1) {
      currentKey = null;
      currentValue = [];
      continue;
    }
    currentKey = line.slice(0, colon).trim();
    currentValue = [line.slice(colon + 1).trim()];
  }
  if (currentKey !== null && currentValue.length > 0) {
    map.set(currentKey.toLowerCase(), currentValue.join(" ").trim());
  }
  return map;
}

function getHeader(headerSection: string, name: string): string | null {
  const map = parseHeaders(headerSection);
  return map.get(name.toLowerCase()) ?? null;
}

function formatAddress(value: string | null): string {
  if (!value || !value.trim()) return "";
  const trimmed = value.trim();
  const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return `${match[1].trim()} <${match[2].trim()}>`;
  return trimmed;
}

function formatAddressList(value: string | null): string {
  if (!value || !value.trim()) return "";
  return value
    .split(/,\s*/)
    .map((a) => formatAddress(a.trim()))
    .filter(Boolean)
    .join(", ");
}

function formatDate(value: string): string {
  if (!value || !value.trim()) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function decodeBody(body: string, encoding: string): string {
  const trimmed = body.replace(/\s+$/, "");
  if (!trimmed) return "";
  if (encoding.includes("base64")) {
    try {
      const binary = atob(trimmed.replace(/\s/g, ""));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch {
      return body;
    }
  }
  if (encoding.includes("quoted-printable")) {
    return decodeQuotedPrintable(trimmed);
  }
  return trimmed;
}

function decodeQuotedPrintable(str: string): string {
  return str
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function splitMultipart(body: string, boundary: string): string[] {
  const b = boundary.replace(/^["']|["']$/g, "").trim();
  // Truncate at the closing "--boundary--" delimiter first, otherwise it
  // doesn't match the opening-delimiter regex below and ends up appended to
  // the last part's content instead of being dropped.
  const closeMatch = body.match(new RegExp(`--${escapeRe(b)}--`));
  const trimmedBody = closeMatch ? body.slice(0, closeMatch.index) : body;
  const regex = new RegExp(`--${escapeRe(b)}\\r?\\n`, "g");
  const parts = trimmedBody.split(regex).map((p) => p.replace(/\r?\n$/, "").trim());
  return parts.filter((p) => p.length > 0 && !p.startsWith("--"));
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeMimeWords(str: string): string {
  return str.replace(/\=\?([^?]+)\?([BQbq])\?([^?]*)\?\=/g, (_, charset, enc, payload) => {
    try {
      if (enc.toUpperCase() === "B") {
        const binary = atob(payload.replace(/\s/g, ""));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder(charset || "utf-8", { fatal: false }).decode(bytes);
      }
      if (enc.toUpperCase() === "Q") {
        return decodeQuotedPrintable(payload.replace(/_/g, " "));
      }
    } catch {}
    return payload;
  });
}

function stripHtml(html: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.innerHTML = html;
    return (div.textContent || div.innerText || "").trim();
  }
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(text: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

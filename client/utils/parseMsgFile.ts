/**
 * Parse an Outlook .msg file and return displayable fields.
 * Uses wl-msg-reader (named export MSGReader).
 */

import { MSGReader } from "wl-msg-reader";

export interface ParsedMsg {
  subject: string;
  from: string;
  to: string;
  date: string;
  bodyHtml: string;
  bodyPlain?: string;
}

export async function parseMsgFile(input: File | Blob | ArrayBuffer): Promise<ParsedMsg> {
  const buffer =
    input instanceof ArrayBuffer
      ? input
      : await (input as File | Blob).arrayBuffer();

  const reader = new MSGReader(buffer);
  const data = reader.getFileData();

  if (data && "error" in data) {
    throw new Error((data as { error: string }).error);
  }

  const fileData = data as {
    subject?: string;
    senderName?: string;
    senderEmail?: string;
    recipients?: Array<{ name?: string; email?: string }>;
    body?: string;
  };

  const subject = (fileData.subject ?? "") as string;
  const from = formatEmail(fileData.senderName, fileData.senderEmail);
  const to = formatRecipients(fileData.recipients);
  const body = (fileData.body ?? "") as string;
  // wl-msg-reader returns body (plain/text); no creationTime or bodyHTML in its type
  const date = "";
  const bodyHtml = body;
  const bodyPlain = body;

  return {
    subject,
    from,
    to,
    date,
    bodyHtml: body || "",
    bodyPlain: body || undefined,
  };
}

function formatEmail(name: unknown, email: unknown): string {
  const n = String(name ?? "").trim();
  const e = String(email ?? "").trim();
  if (n && e) return `${n} <${e}>`;
  return e || n || "—";
}

function formatRecipients(recipients: unknown): string {
  if (!recipients || !Array.isArray(recipients)) return "—";
  return (recipients as Array<{ name?: string; email?: string }>)
    .map((r) => formatEmail(r.name, r.email))
    .filter(Boolean)
    .join(", ") || "—";
}

function formatDate(value: string | Date): string {
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

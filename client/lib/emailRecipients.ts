// Parses the To / Cc boxes of the invoice email modals, which accept a
// comma-separated list — a property or project can have more than one owner on
// the invoice. Mirrors the server's own parsing (splitAddresses in
// invoicing/service/email.go and splitProjectEmailAddresses in
// projects/http/invoice_email_platform.go): comma separated, each address
// trimmed and validated on its own, repeats collapsed case-insensitively with
// the first spelling kept. Keeping the two in step means a list the browser
// accepts is a list the server accepts.
const ADDRESS_PATTERN = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

export type ParsedRecipients =
  | { addresses: string[]; error?: undefined }
  | { addresses?: undefined; error: string };

export function parseRecipients(input: string): ParsedRecipients {
  const addresses: string[] = [];
  const seen = new Set<string>();

  for (const part of input.split(",")) {
    const address = part.trim();
    if (!address) continue;
    if (!ADDRESS_PATTERN.test(address)) {
      return { error: `“${address}” is not a valid email address.` };
    }
    const key = address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    addresses.push(address);
  }

  if (addresses.length === 0) {
    return { error: "Enter at least one email address." };
  }
  return { addresses };
}

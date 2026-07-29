// Converts the plain-text invoice email compose box into the HTML the
// server transmits verbatim. The server no longer renders or escapes
// anything for the email body — it substitutes raw values into a plain-text
// template and the manager edits plain text in the modal — so this browser
// step is the only place HTML escaping happens before the message is sent
// via Microsoft Graph. Get the ordering right: escape before linkifying, or
// a URL's own "&" gets double-escaped.
//
// Matches https?:// URLs, excluding trailing sentence punctuation so a link
// at the end of a sentence (e.g. "...:8080/pay/abc.") doesn't swallow the
// period into the anchor.
const URL_PATTERN = /(https?:\/\/[^\s<]*[^\s<.,;:!?)\]])/g;

function escapeHtml(text: string): string {
  // "&" must be replaced first, or the entities inserted by the later
  // replacements would themselves get re-escaped.
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function linkify(escaped: string): string {
  return escaped.replace(URL_PATTERN, (url) => `<a href="${url}">${url}</a>`);
}

export function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n");

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return blocks
    .map((block) => {
      const escaped = escapeHtml(block);
      const linked = linkify(escaped);
      const withBreaks = linked.replace(/\n/g, "<br>");
      return `<p>${withBreaks}</p>`;
    })
    .join("\n");
}

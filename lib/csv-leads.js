// RFC-style CSV parsing, including quoted commas, escaped quotes and multiline cells.
export function parseCsv(text) {
  if (typeof text !== "string" || text.length > 1_000_000)
    throw Error("CSV must be under 1 MB.");
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [],
    cell = "",
    quoted = false,
    ended = false;
  const push = () => {
    row.push(cell);
    cell = "";
    ended = false;
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
        ended = true;
      } else cell += c;
    } else if (c === '"') {
      if (cell || ended) throw Error("Invalid CSV quoting.");
      quoted = true;
    } else if (c === ",") push();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      push();
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      if (rows.length > 1001)
        throw Error("Import up to 1,000 leads at a time.");
    } else {
      if (ended && c.trim()) throw Error("Invalid CSV after closing quote.");
      if (!ended) cell += c;
    }
  }
  if (quoted) throw Error("CSV has an unclosed quote.");
  push();
  if (row.some((v) => v.trim())) rows.push(row);
  if (rows.length < 2 || rows.length > 1001)
    throw Error("CSV needs headers and 1–1,000 data rows.");
  if (rows[0].length > 50) throw Error("CSV has too many columns.");
  if (rows.slice(1).some((r) => r.length !== rows[0].length))
    throw Error("Each CSV row must match the header columns.");
  return { headers: rows[0], rows: rows.slice(1) };
}

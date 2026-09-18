export const REQUIRED_COLUMNS = [
  "service_id",
  "service_name",
  "timestamp",
  "status_code",
  "latency",
  "latency_unit",
  "agent",
  "region",
] as const;

export type CsvRow = {
  values: string[];
  malformed: boolean;
};

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

export function parseCsv(text: string): ParsedCsv {
  const source = text.replace(/^\uFEFF/, "");
  const table: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      table.push(row);
      row = [];
      field = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    field += char;
  }

  if (inQuotes) {
    row.push(field);
    table.push(row);
  } else if (field.length > 0 || row.length > 0) {
    row.push(field);
    table.push(row);
  }

  if (
    table.length > 0 &&
    table[table.length - 1].length === 1 &&
    table[table.length - 1][0] === ""
  ) {
    table.pop();
  }

  if (table.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = table[0].map((header) => header.trim());
  const rows = table.slice(1).map((values) => ({
    values,
    malformed: values.length !== headers.length,
  }));

  return { headers, rows };
}

export function missingRequiredColumns(headers: string[]): string[] {
  const present = new Set(headers);
  return REQUIRED_COLUMNS.filter((column) => !present.has(column));
}

export function rowToRecord(
  headers: string[],
  values: string[],
): Record<string, string> {
  const record: Record<string, string> = {};
  for (let i = 0; i < headers.length; i += 1) {
    record[headers[i]] = values[i] ?? "";
  }
  return record;
}

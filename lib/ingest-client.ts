export type ImportSummary = {
  rowsReceived: number;
  rowsInserted: number;
  duplicatesRemoved: number;
  invalidRows: number;
  invalidTimestamps: number;
  missingLatency: number;
  invalidLatency: number;
  unknownStatuses: number;
  malformedRows: number;
};

export type ProcessCsvResponse =
  | { success: true; summary: ImportSummary }
  | { success: false; error: string };

export async function uploadMonitoringCsv(
  file: File,
): Promise<ProcessCsvResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    return {
      success: false,
      error: "Supabase is not configured.",
    };
  }

  const body = new FormData();
  body.append("file", file);

  let response: Response;
  try {
    response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/functions/v1/process-csv`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body,
      },
    );
  } catch {
    return {
      success: false,
      error: "Could not reach the processing service.",
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      success: false,
      error: "The processing service returned an unexpected response.",
    };
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload)
  ) {
    return {
      success: false,
      error: "The processing service returned an unexpected response.",
    };
  }

  const data = payload as ProcessCsvResponse;
  if (!data.success) {
    return {
      success: false,
      error: data.error || "Could not process the CSV.",
    };
  }

  return data;
}

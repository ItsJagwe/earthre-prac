import { createClient } from "@supabase/supabase-js";
import { processCsvText, type MonitoringRecord } from "./process.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INSERT_BATCH_SIZE = 500;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Use POST to upload a CSV." }, 405);
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return jsonResponse({ success: false, error: "No file was uploaded." }, 400);
    }

    if (typeof file === "string") {
      return jsonResponse(
        { success: false, error: "Upload a CSV file in the `file` field." },
        400,
      );
    }

    if (file.size === 0) {
      return jsonResponse({ success: false, error: "The CSV file is empty." }, 400);
    }

    if (file.size > MAX_FILE_BYTES) {
      return jsonResponse(
        { success: false, error: "The CSV file is larger than 10 MB." },
        400,
      );
    }

    const filename = file.name || "upload.csv";
    if (!filename.toLowerCase().endsWith(".csv")) {
      return jsonResponse({ success: false, error: "Select a .csv file." }, 400);
    }

    const text = await file.text();
    const result = processCsvText(text);
    if (!result.ok) {
      return jsonResponse({ success: false, error: result.error }, 400);
    }

    if (result.records.length === 0) {
      return jsonResponse(
        { success: false, error: "No valid monitoring rows were found." },
        400,
      );
    }

    await replaceMonitoringChecks(result.records);

    return jsonResponse({ success: true, summary: result.summary }, 200);
  } catch (error) {
    const message =
      error instanceof PersistError
        ? error.message
        : "Could not process the CSV.";
    return jsonResponse({ success: false, error: message }, 500);
  }
});

class PersistError extends Error {}

async function replaceMonitoringChecks(records: MonitoringRecord[]) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    throw new PersistError("Processing service is not configured.");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: deleteError } = await supabase
    .from("monitoring_checks")
    .delete()
    .gte("id", 1);

  if (deleteError) {
    throw new PersistError("Could not replace existing monitoring checks.");
  }

  for (let i = 0; i < records.length; i += INSERT_BATCH_SIZE) {
    const batch = records.slice(i, i + INSERT_BATCH_SIZE);
    const { error: insertError } = await supabase
      .from("monitoring_checks")
      .insert(batch);

    if (insertError) {
      await supabase.from("monitoring_checks").delete().gte("id", 1);
      throw new PersistError("Could not save monitoring checks.");
    }
  }
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

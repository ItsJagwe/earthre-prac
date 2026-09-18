import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { MonitoringCheck } from "@/lib/monitoring";

const FETCH_PAGE_SIZE = 1000;

export async function fetchMonitoringChecks(): Promise<MonitoringCheck[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const rows: MonitoringCheck[] = [];
  let from = 0;

  while (true) {
    const to = from + FETCH_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("monitoring_checks")
      .select(
        "id, service_id, service_name, timestamp, status_code, latency_ms, agent, region, is_available",
      )
      .order("timestamp", { ascending: true })
      .order("service_id", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error("Could not load monitoring checks.");
    }

    if (!data || data.length === 0) break;
    rows.push(...(data as MonitoringCheck[]));
    if (data.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }

  return rows;
}

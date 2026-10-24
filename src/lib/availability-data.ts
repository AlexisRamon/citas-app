import { cache } from "react";
import type { AvailabilityRule } from "@/lib/availability";
import { createClient } from "@/lib/supabase/server";

type RuleRow = { weekday: number; start_time: string; end_time: string };

/** Horario semanal del consultorio (solo servidor). */
export const getAvailabilityRules = cache(
  async (tenantId: string): Promise<AvailabilityRule[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("availability_rules")
      .select("weekday, start_time, end_time")
      .eq("tenant_id", tenantId)
      .order("weekday")
      .order("start_time");

    if (error || !data) return [];

    return (data as RuleRow[]).map((row) => ({
      weekday: row.weekday,
      start: row.start_time.slice(0, 5),
      end: row.end_time.slice(0, 5),
    }));
  },
);

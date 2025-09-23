// src/services/backends/supabase/rfqs/seed.js
import { supabase } from "../../supabase.js";
import { makeUUID } from "../../../ids";

/** Demo seed used by Diag/hooks */
export async function seedDemoRFQs({ user_id } = {}) {
  const { count, error } = await supabase
    .from("rfqs")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  if (typeof count === "number" && count > 0) return 0;

  const now = new Date().toISOString();
  const rows = [1, 2, 3].map((i) => ({
    id: makeUUID(),
    user_id: user_id || "demo-user",
    title: `Demo RFQ #${i}`,
    status: "active",
    posted_time: now,
    created_at: now,
    updated_at: now,
  }));
  const { error: insErr } = await supabase.from("rfqs").insert(rows);
  if (insErr) throw new Error(insErr.message);
  return rows.length;
}

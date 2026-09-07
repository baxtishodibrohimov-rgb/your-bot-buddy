// Configurable planner-assignment algorithm (spec section 5).
//
// This intentionally lives in code (not a SQL function) so the algorithm is
// easy to extend later (e.g. add "on duty today" or skill-based routing)
// without another migration. tp_assignment_config only stores the knobs an
// admin can turn from the UI: mode (manual/auto) and strategy.
// deno-lint-ignore-file no-explicit-any

export async function autoAssignPlanner(supabase: any, caseId: string): Promise<string | null> {
  const { data: config } = await supabase
    .from("tp_assignment_config")
    .select("mode, strategy")
    .eq("id", 1)
    .maybeSingle();

  if (!config || config.mode !== "auto") return null;

  const { data: roleRows } = await supabase
    .from("tp_staff_roles")
    .select("staff_id, staff:staff_id(id, full_name, is_active, max_workload)")
    .eq("role", "planner");

  const planners = (roleRows ?? [])
    .map((r: any) => r.staff)
    .filter((s: any) => s && s.is_active);
  if (planners.length === 0) return null;

  const { data: activeCases } = await supabase
    .from("tp_cases")
    .select("responsible_planner_staff_id")
    .not("responsible_planner_staff_id", "is", null)
    .not("status", "in", "(READY,CONSULTATION_COMPLETED)");

  const workload = new Map<string, number>();
  for (const row of activeCases ?? []) {
    const id = row.responsible_planner_staff_id as string;
    workload.set(id, (workload.get(id) ?? 0) + 1);
  }

  const eligible = planners.filter(
    (s: any) => s.max_workload == null || (workload.get(s.id) ?? 0) < s.max_workload,
  );
  if (eligible.length === 0) return null;

  let chosen: any;
  if (config.strategy === "round_robin") {
    // Least-recently-assigned planner among eligible ones.
    const { data: lastAssigned } = await supabase
      .from("tp_audit_log")
      .select("details, created_at")
      .eq("action", "auto_assigned")
      .order("created_at", { ascending: false })
      .limit(50);
    const lastAssignedAt = new Map<string, string>();
    for (const row of lastAssigned ?? []) {
      const staffId = row.details?.planner_staff_id;
      if (staffId && !lastAssignedAt.has(staffId)) lastAssignedAt.set(staffId, row.created_at);
    }
    chosen = [...eligible].sort((a, b) => {
      const ta = lastAssignedAt.get(a.id) ?? "";
      const tb = lastAssignedAt.get(b.id) ?? "";
      return ta.localeCompare(tb);
    })[0];
  } else {
    // least_workload (default): fewest currently-active cases first.
    chosen = [...eligible].sort((a, b) => (workload.get(a.id) ?? 0) - (workload.get(b.id) ?? 0))[0];
  }

  await supabase
    .from("tp_cases")
    .update({ responsible_planner_staff_id: chosen.id, status: "ASSIGNED" })
    .eq("id", caseId);

  await supabase.from("tp_audit_log").insert({
    case_id: caseId,
    action: "auto_assigned",
    details: { planner_staff_id: chosen.id, strategy: config.strategy },
  });

  await supabase.from("tp_notifications").insert({
    case_id: caseId,
    recipient_staff_id: chosen.id,
    channel: "telegram",
    type: "case_assigned",
    payload: { case_id: caseId },
  });

  return chosen.id;
}

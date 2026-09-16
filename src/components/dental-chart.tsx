// Interactive FDI dental chart (mixed dentition aware).
//
// Reconstructed mechanics (see the migration header comment in
// 20260916100000_tp_phase5_manual_case_and_pool_upload.sql for why this is a
// best-effort reconstruction, not a verbatim spec — correct in this file,
// not by inventing new clinical rules elsewhere):
//   - 32 canonical positions, keyed by their PERMANENT FDI code (11-18, 21-28,
//     31-38, 41-48). Positions 1-5 in each quadrant can be a primary tooth;
//     positions 6-8 (molars) have no primary predecessor and are always shown
//     as permanent.
//   - A per-case global "Sut tish / Doimiy tish" toggle (tp_dental_charts.
//     default_dentition) sets what an untouched position 1-5 shows.
//   - Single click on a present tooth marks it missing; clicking a missing
//     tooth again restores it (to the chart's current default for that
//     position, clearing any prior per-tooth override).
//   - Double click on a present tooth at position 1-5 flips that one
//     position between primary/permanent, independent of the global
//     default — this is what models mixed dentition (some teeth already
//     exchanged, others not). No-op on positions 6-8 and on missing teeth.
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DOUBLE_CLICK_MS = 300;

async function loadChart(caseId: string) {
  let { data: chart } = await (supabase.from("tp_dental_charts" as any) as any)
    .select("*").eq("case_id", caseId).maybeSingle();

  if (!chart) {
    const { data: created, error } = await (supabase.from("tp_dental_charts" as any) as any)
      .insert({ case_id: caseId })
      .select()
      .single();
    if (error) throw error;
    chart = created;
  }

  const { data: statuses } = await (supabase.from("tp_tooth_status" as any) as any)
    .select("*").eq("dental_chart_id", chart.id);

  return { chart, statuses: statuses ?? [] };
}

function primaryCode(toothCode: string) {
  const quadrant = Number(toothCode[0]);
  const position = toothCode[1];
  return `${quadrant + 4}${position}`;
}

function effectiveState(toothCode: string, defaultDentition: string, statusRow: any) {
  const position = Number(toothCode[1]);
  const missing = statusRow?.status === "missing";
  let dentition: "permanent" | "primary" = "permanent";
  if (position <= 5) {
    if (statusRow?.status === "primary_override") dentition = "primary";
    else if (statusRow?.status === "permanent_override") dentition = "permanent";
    else dentition = defaultDentition as "permanent" | "primary";
  }
  const displayCode = dentition === "primary" ? primaryCode(toothCode) : toothCode;
  return { missing, dentition, displayCode, canToggleDentition: position <= 5 };
}

const UPPER_LEFT_TO_RIGHT = ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"];
const LOWER_LEFT_TO_RIGHT = ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"];

export function DentalChart({ caseId }: { caseId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["tp-dental-chart", caseId], queryFn: () => loadChart(caseId) });
  const clickTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tp-dental-chart", caseId] });

  const setDefaultDentition = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await (supabase.from("tp_dental_charts" as any) as any)
        .update({ default_dentition: value }).eq("id", data!.chart.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const upsertStatus = useMutation({
    mutationFn: async ({ toothCode, status }: { toothCode: string; status: string | null }) => {
      if (status === null) {
        const { error } = await (supabase.from("tp_tooth_status" as any) as any)
          .delete().eq("dental_chart_id", data!.chart.id).eq("tooth_code", toothCode);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("tp_tooth_status" as any) as any)
          .upsert({ dental_chart_id: data!.chart.id, tooth_code: toothCode, status }, { onConflict: "dental_chart_id,tooth_code" });
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Tish jadvali yuklanmoqda...</p>;

  const statusByCode = new Map(data.statuses.map((s: any) => [s.tooth_code, s]));

  function handleSingleClick(toothCode: string, missing: boolean) {
    upsertStatus.mutate({ toothCode, status: missing ? null : "missing" });
  }

  function handleDoubleClick(toothCode: string, state: ReturnType<typeof effectiveState>) {
    if (state.missing || !state.canToggleDentition) return;
    const newDentition = state.dentition === "permanent" ? "primary" : "permanent";
    const isDefault = newDentition === data!.chart.default_dentition;
    upsertStatus.mutate({ toothCode, status: isDefault ? null : `${newDentition}_override` });
  }

  function onToothClick(toothCode: string) {
    const state = effectiveState(toothCode, data!.chart.default_dentition, statusByCode.get(toothCode));
    if (clickTimers.current[toothCode]) {
      clearTimeout(clickTimers.current[toothCode]);
      delete clickTimers.current[toothCode];
      handleDoubleClick(toothCode, state);
    } else {
      clickTimers.current[toothCode] = setTimeout(() => {
        delete clickTimers.current[toothCode];
        handleSingleClick(toothCode, state.missing);
      }, DOUBLE_CLICK_MS);
    }
  }

  function renderRow(codes: string[]) {
    return (
      <div className="flex gap-1 justify-center flex-wrap">
        {codes.map((code) => {
          const state = effectiveState(code, data!.chart.default_dentition, statusByCode.get(code));
          return (
            <button
              key={code}
              onClick={() => onToothClick(code)}
              title={state.missing ? `${code} — yo'q` : `${state.displayCode}${state.dentition === "primary" ? " (sut tish)" : ""}`}
              className={cn(
                "h-9 w-9 rounded border text-xs font-medium flex items-center justify-center transition-colors",
                state.missing
                  ? "bg-muted text-muted-foreground line-through border-dashed"
                  : state.dentition === "primary"
                    ? "bg-amber-100 border-amber-400 hover:border-primary"
                    : "bg-background hover:border-primary",
              )}
            >
              {state.missing ? "×" : state.displayCode}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Standart holat:</span>
          <Select value={data.chart.default_dentition} onValueChange={(v) => setDefaultDentition.mutate(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="permanent">Doimiy tish</SelectItem>
              <SelectItem value="primary">Sut tish</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          1 marta bosish = yo'q qilish/tiklash. 2 marta bosish (1-5 pozitsiya) = sut/doimiy tishni almashtirish.
        </p>
      </div>
      <div className="space-y-2 rounded-md border p-3">
        {renderRow(UPPER_LEFT_TO_RIGHT)}
        <div className="border-t my-2" />
        {renderRow(LOWER_LEFT_TO_RIGHT)}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-100 border border-amber-400 inline-block" /> Sut tish</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted border border-dashed inline-block" /> Yo'q</span>
      </div>
    </div>
  );
}

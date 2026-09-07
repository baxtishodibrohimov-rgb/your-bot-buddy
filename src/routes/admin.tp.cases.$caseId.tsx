import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/tp/cases/$caseId")({
  component: CaseDetail,
});

async function loadCase(caseId: string) {
  const { data: caseRow, error } = await (supabase.from("tp_cases" as any) as any)
    .select("*")
    .eq("id", caseId)
    .single();
  if (error) throw error;

  const [{ data: patient }, { data: images }, { data: imageTypes }, { data: findings }, { data: audit }, { data: planners }] =
    await Promise.all([
      (supabase.from("tp_cliniccards_patients" as any) as any)
        .select("*")
        .eq("cliniccards_patient_id", caseRow.cliniccards_patient_id)
        .maybeSingle(),
      (supabase.from("tp_clinical_images" as any) as any).select("*").eq("case_id", caseId),
      (supabase.from("tp_image_types" as any) as any).select("*").eq("is_active", true).order("sort_order"),
      (supabase.from("tp_findings" as any) as any).select("*").eq("case_id", caseId).order("sort_order"),
      (supabase.from("tp_audit_log" as any) as any).select("*").eq("case_id", caseId).order("created_at", { ascending: true }),
      (supabase.from("tp_staff_roles" as any) as any).select("staff_id, staff:staff_id(id, full_name, is_active)").eq("role", "planner"),
    ]);

  const staffIds = [caseRow.responsible_planner_staff_id, caseRow.primary_doctor_staff_id].filter(Boolean);
  const { data: staffRows } = staffIds.length
    ? await (supabase.from("staff" as any) as any).select("id, full_name").in("id", staffIds)
    : { data: [] as any[] };
  const staffMap = new Map((staffRows ?? []).map((s: any) => [s.id, s.full_name]));

  return {
    caseRow,
    patient,
    images: images ?? [],
    imageTypes: imageTypes ?? [],
    findings: findings ?? [],
    audit: audit ?? [],
    planners: (planners ?? []).map((p: any) => p.staff).filter((s: any) => s?.is_active),
    plannerName: caseRow.responsible_planner_staff_id ? staffMap.get(caseRow.responsible_planner_staff_id) : null,
    doctorName: caseRow.primary_doctor_name ?? (caseRow.primary_doctor_staff_id ? staffMap.get(caseRow.primary_doctor_staff_id) : null),
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  extraoral: "Extraoral",
  intraoral: "Intraoral",
  radiology: "Radiology",
};

function CaseDetail() {
  const { caseId } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["tp-case", caseId], queryFn: () => loadCase(caseId) });

  const assign = useMutation({
    mutationFn: async (plannerStaffId: string) => {
      const { error } = await supabase.rpc("tp_assign_case" as any, {
        p_case_id: caseId,
        p_planner_staff_id: plannerStaffId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Planner biriktirildi");
      qc.invalidateQueries({ queryKey: ["tp-case", caseId] });
      qc.invalidateQueries({ queryKey: ["tp-cases-dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Yuklanmoqda...</p>;
  }

  const { caseRow, patient, images, imageTypes, findings, audit, planners, plannerName, doctorName } = data;
  const imagesByType = new Map(images.map((img: any) => [img.image_type_id, img]));
  const categories = ["extraoral", "intraoral", "radiology"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/tp"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{patient?.full_name ?? "Noma'lum bemor"}</h1>
          <p className="text-sm text-muted-foreground">
            2-konsultatsiya: {caseRow.consultation_datetime ? format(new Date(caseRow.consultation_datetime), "dd.MM.yyyy HH:mm") : "—"}
          </p>
        </div>
        <Badge className="text-xs">{caseRow.status}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Case ma'lumotlari</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Doktor:</span> {doctorName ?? "—"}</div>
            <div><span className="text-muted-foreground">Telefon:</span> {patient?.phone ?? "—"}</div>
            <div><span className="text-muted-foreground">Tug'ilgan sana:</span> {patient?.birth_date ?? "—"}</div>
            <div><span className="text-muted-foreground">Deadline:</span> {caseRow.deadline ? format(new Date(caseRow.deadline), "dd.MM.yyyy HH:mm") : "—"}</div>
            <div><span className="text-muted-foreground">Priority:</span> {caseRow.priority}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Mas'ul planner</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">{plannerName ?? <span className="text-muted-foreground">Biriktirilmagan</span>}</div>
            <Select onValueChange={(v) => assign.mutate(v)} disabled={assign.isPending}>
              <SelectTrigger><SelectValue placeholder="Planner tanlash / o'zgartirish" /></SelectTrigger>
              <SelectContent>
                {planners.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Diagnostika progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Progress value={caseRow.images_progress_percent ?? 0} />
            <div className="text-sm text-muted-foreground">{caseRow.images_progress_percent ?? 0}% majburiy rasmlar tayyor</div>
            <Button className="w-full" disabled title="Clinical Analysis Wizard — Phase 5da qo'shiladi">
              TAHLILNI BOSHLASH
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Diagnostik rasmlar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat) => {
            const typesInCat = imageTypes.filter((t: any) => t.category === cat);
            if (typesInCat.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <h4 className="text-sm font-semibold">{CATEGORY_LABELS[cat] ?? cat}</h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {typesInCat.map((t: any) => {
                    const img = imagesByType.get(t.id);
                    return (
                      <div key={t.id} className="rounded-md border p-2 space-y-1">
                        <div className="aspect-square rounded bg-muted flex items-center justify-center overflow-hidden">
                          {img ? (
                            <img
                              src={img.external_url}
                              alt={t.label}
                              className="h-full w-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <ImageOff className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-xs font-medium truncate">{t.label}</div>
                        {t.is_required && !img && <Badge variant="destructive" className="text-[10px]">Majburiy — yo'q</Badge>}
                        {img && <Badge variant="secondary" className="text-[10px]">Bor</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Master Problem List</CardTitle></CardHeader>
        <CardContent>
          {findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Hali muammolar aniqlanmagan — Clinical Analysis Wizard (Phase 5-7) orqali to'ldiriladi.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {findings.map((f: any) => (
                <li key={f.id} className="border-b pb-2 last:border-0">
                  <span className="font-medium">{f.category}:</span> {f.description}
                  {!f.is_confirmed && <Badge variant="outline" className="ml-2 text-[10px]">Tasdiqlanmagan</Badge>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tarix (Audit log)</CardTitle></CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali harakat yo'q</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {audit.map((a: any) => (
                <li key={a.id} className="flex gap-3">
                  <span className="text-muted-foreground shrink-0">{format(new Date(a.created_at), "dd.MM HH:mm")}</span>
                  <span>{a.action}{a.details ? ` — ${JSON.stringify(a.details)}` : ""}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

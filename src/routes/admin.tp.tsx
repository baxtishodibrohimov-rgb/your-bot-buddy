import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNowStrict, isPast } from "date-fns";

export const Route = createFileRoute("/admin/tp")({
  component: TreatmentPlanDashboard,
});

const STATUS_COLUMNS = [
  { status: "NEW", label: "Yangi" },
  { status: "WAITING_ASSIGNMENT", label: "Biriktirish kutilmoqda" },
  { status: "ASSIGNED", label: "Biriktirilgan" },
  { status: "IMAGES_READY", label: "Rasmlar tayyor" },
  { status: "ANALYSIS_IN_PROGRESS", label: "Tahlil qilinmoqda" },
  { status: "PLAN_IN_PROGRESS", label: "Plan tayyorlanmoqda" },
  { status: "REVIEW_REQUIRED", label: "Review kutilmoqda" },
  { status: "READY", label: "Tayyor" },
  { status: "OVERDUE", label: "Kechikkan" },
  { status: "CONSULTATION_COMPLETED", label: "Yakunlangan" },
] as const;

async function loadCases() {
  const { data: cases, error } = await (supabase.from("tp_cases" as any) as any)
    .select("*")
    .order("consultation_datetime", { ascending: true })
    .limit(300);
  if (error) throw error;

  const rows = cases ?? [];
  const patientIds = [...new Set(rows.map((c: any) => c.cliniccards_patient_id).filter(Boolean))];
  const staffIds = [
    ...new Set(
      rows.flatMap((c: any) => [c.responsible_planner_staff_id, c.primary_doctor_staff_id]).filter(Boolean),
    ),
  ];

  const [{ data: patients }, { data: staff }] = await Promise.all([
    patientIds.length
      ? (supabase.from("tp_cliniccards_patients" as any) as any)
          .select("cliniccards_patient_id, full_name")
          .in("cliniccards_patient_id", patientIds)
      : Promise.resolve({ data: [] as any[] }),
    staffIds.length
      ? (supabase.from("staff" as any) as any).select("id, full_name").in("id", staffIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const patientMap = new Map((patients ?? []).map((p: any) => [p.cliniccards_patient_id, p.full_name]));
  const staffMap = new Map((staff ?? []).map((s: any) => [s.id, s.full_name]));

  return rows.map((c: any) => ({
    ...c,
    patientName: patientMap.get(c.cliniccards_patient_id) ?? "Noma'lum bemor",
    plannerName: c.responsible_planner_staff_id ? staffMap.get(c.responsible_planner_staff_id) : null,
    doctorName: c.primary_doctor_name ?? (c.primary_doctor_staff_id ? staffMap.get(c.primary_doctor_staff_id) : null),
  }));
}

function timeLeftLabel(consultationAt: string | null) {
  if (!consultationAt) return "—";
  const d = new Date(consultationAt);
  const label = formatDistanceToNowStrict(d);
  return isPast(d) ? `${label} oldin` : `${label} qoldi`;
}

function TreatmentPlanDashboard() {
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["tp-cases-dashboard"],
    queryFn: loadCases,
    refetchInterval: 30_000,
  });

  const todayConsultations = cases.filter((c: any) => {
    if (!c.consultation_datetime) return false;
    const d = new Date(c.consultation_datetime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const stats = [
    { label: "Bugungi 2-konsultatsiyalar", value: todayConsultations },
    {
      label: "Yangi case'lar",
      value: cases.filter((c: any) => c.status === "NEW" || c.status === "WAITING_ASSIGNMENT").length,
    },
    {
      label: "Ishlanayotgan",
      value: cases.filter((c: any) =>
        ["ASSIGNED", "IMAGES_READY", "ANALYSIS_IN_PROGRESS", "PLAN_IN_PROGRESS"].includes(c.status),
      ).length,
    },
    { label: "Review kutayotgan", value: cases.filter((c: any) => c.status === "REVIEW_REQUIRED").length },
    { label: "Tayyor", value: cases.filter((c: any) => c.status === "READY").length },
    { label: "Kechikkan", value: cases.filter((c: any) => c.status === "OVERDUE").length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Treatment Planning Dashboard</h1>
        <p className="text-sm text-muted-foreground">2-konsultatsiyaga tayyorgarlik holati</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{isLoading ? "…" : s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {STATUS_COLUMNS.map((col) => {
          const items = cases.filter((c: any) => c.status === col.status);
          return (
            <div key={col.status} className="min-w-[240px] w-[240px] shrink-0 space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((c: any) => (
                  <Link key={c.id} to="/admin/tp/cases/$caseId" params={{ caseId: c.id }}>
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                      <CardContent className="p-3 space-y-1.5">
                        <div className="font-medium text-sm">{c.patientName}</div>
                        <div className="text-xs text-muted-foreground">{timeLeftLabel(c.consultation_datetime)}</div>
                        <div className="text-xs text-muted-foreground">Dr: {c.doctorName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">Planner: {c.plannerName ?? "—"}</div>
                        <Progress value={c.images_progress_percent ?? 0} className="h-1.5" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {items.length === 0 && <p className="text-xs text-muted-foreground px-1">Bo'sh</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

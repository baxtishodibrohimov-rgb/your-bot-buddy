import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, CalendarCheck, FlaskConical, GraduationCap, UserCog } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

async function loadStats() {
  const tables = [
    "patients",
    "complaints",
    "appointments",
    "lab_orders",
    "residents",
    "staff",
  ] as const;

  const counts = await Promise.all(
    tables.map((t) =>
      supabase.from(t).select("*", { count: "exact", head: true }).then((r) => r.count ?? 0),
    ),
  );

  const [newComplaints, openLab] = await Promise.all([
    supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "new").then((r) => r.count ?? 0),
    supabase.from("lab_orders").select("*", { count: "exact", head: true }).neq("status", "completed").then((r) => r.count ?? 0),
  ]);

  return {
    patients: counts[0],
    complaints: counts[1],
    appointments: counts[2],
    labOrders: counts[3],
    residents: counts[4],
    staff: counts[5],
    newComplaints,
    openLab,
  };
}

async function loadRecent() {
  const [patients, complaints, appts] = await Promise.all([
    supabase.from("patients").select("id, first_name, last_name, telegram_username, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("complaints").select("id, type, message, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("appointments").select("id, full_name, phone, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  return {
    patients: patients.data ?? [],
    complaints: complaints.data ?? [],
    appointments: appts.data ?? [],
  };
}

function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: loadStats });
  const { data: recent } = useQuery({ queryKey: ["dashboard-recent"], queryFn: loadRecent });

  const cards = [
    { label: "Bemorlar", value: stats?.patients, icon: Users, color: "text-blue-500" },
    { label: "Uchrashuvlar", value: stats?.appointments, icon: CalendarCheck, color: "text-emerald-500" },
    { label: "Shikoyatlar", value: stats?.complaints, icon: MessageSquare, color: "text-amber-500", sub: stats ? `${stats.newComplaints} yangi` : undefined },
    { label: "Lab buyurtmalar", value: stats?.labOrders, icon: FlaskConical, color: "text-purple-500", sub: stats ? `${stats.openLab} ochiq` : undefined },
    { label: "Rezidentlar", value: stats?.residents, icon: GraduationCap, color: "text-pink-500" },
    { label: "Xodimlar", value: stats?.staff, icon: UserCog, color: "text-cyan-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Klinika faoliyati bo'yicha umumiy ko'rinish</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <c.icon className={`h-5 w-5 ${c.color}`} />
              <div className="mt-3 text-2xl font-bold">{c.value ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
              {c.sub && <div className="text-xs text-amber-600 mt-1">{c.sub}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Yangi bemorlar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recent?.patients.length === 0 && <p className="text-sm text-muted-foreground">Bo'sh</p>}
            {recent?.patients.map((p) => (
              <div key={p.id} className="text-sm border-b pb-2 last:border-0">
                <div className="font-medium">{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.telegram_username || "Noma'lum"}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(p.created_at), "dd.MM.yyyy HH:mm")}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Yangi shikoyatlar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recent?.complaints.length === 0 && <p className="text-sm text-muted-foreground">Bo'sh</p>}
            {recent?.complaints.map((c) => (
              <div key={c.id} className="text-sm border-b pb-2 last:border-0">
                <div className="font-medium line-clamp-1">{c.message}</div>
                <div className="text-xs text-muted-foreground">{c.type} · {c.status} · {format(new Date(c.created_at), "dd.MM HH:mm")}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Yangi uchrashuvlar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recent?.appointments.length === 0 && <p className="text-sm text-muted-foreground">Bo'sh</p>}
            {recent?.appointments.map((a) => (
              <div key={a.id} className="text-sm border-b pb-2 last:border-0">
                <div className="font-medium">{a.full_name}</div>
                <div className="text-xs text-muted-foreground">{a.phone} · {a.status}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

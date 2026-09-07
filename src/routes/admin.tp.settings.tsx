import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/tp/settings")({
  component: TpSettingsPage,
});

async function loadSettings() {
  const [{ data: config }, { data: settings }, { data: log }] = await Promise.all([
    (supabase.from("tp_assignment_config" as any) as any).select("*").eq("id", 1).maybeSingle(),
    (supabase.from("tp_settings" as any) as any).select("*").order("key"),
    (supabase.from("tp_integration_sync_log" as any) as any).select("*").order("created_at", { ascending: false }).limit(20),
  ]);
  return { config, settings: settings ?? [], log: log ?? [] };
}

function AssignmentConfigCard({ config, onSaved }: { config: any; onSaved: () => void }) {
  const save = useMutation({
    mutationFn: async (values: { mode: string; strategy: string }) => {
      const { error } = await (supabase.from("tp_assignment_config" as any) as any).update(values).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saqlandi"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Biriktirish algoritmi</CardTitle>
        <CardDescription>Case kelganda planner qo'lda yoki avtomatik biriktirilsinmi</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <Label>Rejim</Label>
          <Select
            value={config?.mode ?? "manual"}
            onValueChange={(mode) => save.mutate({ mode, strategy: config?.strategy ?? "least_workload" })}
          >
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual (qo'lda)</SelectItem>
              <SelectItem value="auto">Auto (avtomatik)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Strategiya</Label>
          <Select
            value={config?.strategy ?? "least_workload"}
            onValueChange={(strategy) => save.mutate({ mode: config?.mode ?? "manual", strategy })}
          >
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="least_workload">Eng kam workload'li planner</SelectItem>
              <SelectItem value="round_robin">Round-robin (navbat bilan)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingRow({ setting, onSaved }: { setting: any; onSaved: () => void }) {
  const [value, setValue] = React.useState(JSON.stringify(setting.value));
  const save = useMutation({
    mutationFn: async () => {
      let parsed: unknown;
      try { parsed = JSON.parse(value); } catch { throw new Error("JSON formatda emas"); }
      const { error } = await (supabase.from("tp_settings" as any) as any).update({ value: parsed }).eq("key", setting.key);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saqlandi"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{setting.key}</TableCell>
      <TableCell>
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono text-xs" />
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Saqlash</Button>
      </TableCell>
    </TableRow>
  );
}

function TpSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["tp-settings"], queryFn: loadSettings });

  const syncNow = useMutation({
    mutationFn: async () => {
      const { data: res, error } = await supabase.functions.invoke("cliniccards-sync", { body: { manual: true } });
      if (error) throw new Error(error.message);
      return res;
    },
    onSuccess: (res: any) => {
      toast.success(`Sync tugadi: ${res?.casesCreated ?? 0} yangi case, ${res?.recordsSeen ?? 0} appointment ko'rildi`);
      qc.invalidateQueries({ queryKey: ["tp-settings"] });
      qc.invalidateQueries({ queryKey: ["tp-cases-dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tp-settings"] });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Treatment Plan — Sozlamalar</h1>
          <p className="text-sm text-muted-foreground">
            Cliniccards API kaliti va Telegram token bu yerda emas — ular faqat Supabase Edge Function
            secret sifatida saqlanadi (frontendga hech qachon yuborilmaydi).
          </p>
        </div>
        <Button onClick={() => syncNow.mutate()} disabled={syncNow.isPending}>
          <RefreshCw className={`h-4 w-4 mr-1 ${syncNow.isPending ? "animate-spin" : ""}`} /> Cliniccards sync
        </Button>
      </div>

      {data?.config !== undefined && <AssignmentConfigCard config={data.config} onSaved={invalidate} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sozlamalar (non-secret)</CardTitle>
          <CardDescription>Qiymatlar JSON formatda (masalan: matn uchun "consultation_2", son uchun 5)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kalit</TableHead>
                <TableHead>Qiymat</TableHead>
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.settings ?? []).map((s: any) => (
                <SettingRow key={s.key} setting={s} onSaved={invalidate} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Sync log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vaqt</TableHead>
                <TableHead>Turi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ko'rilgan</TableHead>
                <TableHead>Yaratilgan case</TableHead>
                <TableHead>Xato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Yuklanmoqda...</TableCell></TableRow>
              )}
              {!isLoading && (data?.log ?? []).length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Hali sync bo'lmagan</TableCell></TableRow>
              )}
              {(data?.log ?? []).map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{format(new Date(l.created_at), "dd.MM HH:mm:ss")}</TableCell>
                  <TableCell className="text-xs">{l.sync_type}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === "success" ? "secondary" : l.status === "error" ? "destructive" : "outline"}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{l.records_seen}</TableCell>
                  <TableCell>{l.cases_created}</TableCell>
                  <TableCell className="text-xs text-destructive max-w-xs truncate">{l.error ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/tp/staff")({
  component: TpStaffPage,
});

const TP_ROLES = ["planner", "doctor", "consultant"] as const;

async function loadStaffWithRoles() {
  const [{ data: staff }, { data: roles }] = await Promise.all([
    (supabase.from("staff" as any) as any).select("id, full_name, telegram_id, position, is_active, max_workload").order("full_name"),
    (supabase.from("tp_staff_roles" as any) as any).select("staff_id, role"),
  ]);
  const rolesByStaff = new Map<string, Set<string>>();
  for (const r of roles ?? []) {
    if (!rolesByStaff.has(r.staff_id)) rolesByStaff.set(r.staff_id, new Set());
    rolesByStaff.get(r.staff_id)!.add(r.role);
  }
  return (staff ?? []).map((s: any) => ({ ...s, roles: rolesByStaff.get(s.id) ?? new Set<string>() }));
}

function StaffRow({ staff, onSaved }: { staff: any; onSaved: () => void }) {
  const [roles, setRoles] = React.useState<Set<string>>(new Set(staff.roles));
  const [maxWorkload, setMaxWorkload] = React.useState<string>(staff.max_workload?.toString() ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const { error: staffErr } = await (supabase.from("staff" as any) as any)
        .update({ max_workload: maxWorkload === "" ? null : Number(maxWorkload) })
        .eq("id", staff.id);
      if (staffErr) throw staffErr;

      const toAdd = TP_ROLES.filter((r) => roles.has(r) && !staff.roles.has(r));
      const toRemove = TP_ROLES.filter((r) => !roles.has(r) && staff.roles.has(r));

      if (toAdd.length) {
        const { error } = await (supabase.from("tp_staff_roles" as any) as any).insert(
          toAdd.map((role) => ({ staff_id: staff.id, role })),
        );
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await (supabase.from("tp_staff_roles" as any) as any)
          .delete()
          .eq("staff_id", staff.id)
          .in("role", toRemove as string[]);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Saqlandi"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = (role: string, checked: boolean) => {
    setRoles((prev) => {
      const next = new Set(prev);
      if (checked) next.add(role); else next.delete(role);
      return next;
    });
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{staff.full_name}</TableCell>
      <TableCell>{staff.telegram_id}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{staff.position}</TableCell>
      {TP_ROLES.map((role) => (
        <TableCell key={role} className="text-center">
          <Checkbox checked={roles.has(role)} onCheckedChange={(c) => toggle(role, !!c)} />
        </TableCell>
      ))}
      <TableCell>
        <Input
          type="number"
          className="w-20"
          placeholder="∞"
          value={maxWorkload}
          onChange={(e) => setMaxWorkload(e.target.value)}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Saqlash</Button>
      </TableCell>
    </TableRow>
  );
}

function TpStaffPage() {
  const qc = useQueryClient();
  const { data: staffList = [], isLoading } = useQuery({ queryKey: ["tp-staff-roles"], queryFn: loadStaffWithRoles });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Treatment Plan — Xodimlar va rollar</h1>
        <p className="text-sm text-muted-foreground">
          Har bir xodimga Planner / Doctor / Consultant rolini va maksimal workload'ni belgilang.
          Yangi xodim qo'shish uchun "Xodimlar" bo'limidan foydalaning, so'ng bu yerda rol belgilang.
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Xodimlar</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>F.I.Sh</TableHead>
                <TableHead>Telegram ID</TableHead>
                <TableHead>Lavozim</TableHead>
                <TableHead className="text-center">Planner</TableHead>
                <TableHead className="text-center">Doctor</TableHead>
                <TableHead className="text-center">Consultant</TableHead>
                <TableHead>Max workload</TableHead>
                <TableHead className="text-right">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Yuklanmoqda...</TableCell></TableRow>
              )}
              {!isLoading && staffList.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Xodim yo'q</TableCell></TableRow>
              )}
              {staffList.map((s: any) => (
                <StaffRow key={s.id} staff={s} onSaved={() => qc.invalidateQueries({ queryKey: ["tp-staff-roles"] })} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

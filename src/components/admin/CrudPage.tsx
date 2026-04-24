import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "date" | "datetime";

export interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  hideInTable?: boolean;
  hideInForm?: boolean;
  format?: (v: any, row: any) => React.ReactNode;
  placeholder?: string;
}

interface Props {
  table: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  searchFields?: string[];
  orderBy?: { column: string; ascending?: boolean };
  defaultValues?: Record<string, any>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  rowKey?: string;
  /** Extra select clause, e.g. "*, related(name)" */
  selectClause?: string;
}

export function CrudPage({
  table,
  title,
  description,
  fields,
  searchFields = [],
  orderBy = { column: "created_at", ascending: false },
  defaultValues = {},
  canCreate = true,
  canEdit = true,
  canDelete = true,
  rowKey = "id",
  selectClause = "*",
}: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Record<string, any> | null>(null);

  const queryKey = [table, search, orderBy] as const;

  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let q = (supabase.from(table as any) as any).select(selectClause).order(orderBy.column, { ascending: orderBy.ascending ?? false }).limit(200);
      if (search && searchFields.length) {
        const or = searchFields.map((f) => `${f}.ilike.%${search}%`).join(",");
        q = q.or(or);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const payload: Record<string, any> = {};
      for (const f of fields) {
        if (f.hideInForm) continue;
        let v = values[f.name];
        if (v === "" || v === undefined) v = null;
        if (f.type === "number" && v !== null) v = Number(v);
        payload[f.name] = v;
      }
      if (editing?.[rowKey]) {
        const { error } = await (supabase.from(table as any) as any).update(payload).eq(rowKey, editing[rowKey]);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from(table as any) as any).insert({ ...defaultValues, ...payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Yangilandi" : "Qo'shildi");
      qc.invalidateQueries({ queryKey: [table] });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: any) => {
      const { error } = await (supabase.from(table as any) as any).delete().eq(rowKey, id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("O'chirildi");
      qc.invalidateQueries({ queryKey: [table] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const visibleFields = fields.filter((f) => !f.hideInTable);
  const formFields = fields.filter((f) => !f.hideInForm);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values: Record<string, any> = {};
    for (const f of formFields) {
      if (f.type === "boolean") {
        values[f.name] = fd.get(f.name) === "on";
      } else {
        values[f.name] = fd.get(f.name);
      }
    }
    upsert.mutate(values);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1" /> Qo'shish</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? "Tahrirlash" : "Yangi"}</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {formFields.map((f) => {
                  const val = editing?.[f.name];
                  const defaultVal = val ?? defaultValues[f.name] ?? "";
                  if (f.type === "boolean") {
                    return (
                      <div key={f.name} className="flex items-center justify-between rounded-md border p-3">
                        <Label htmlFor={f.name}>{f.label}</Label>
                        <Switch id={f.name} name={f.name} defaultChecked={!!val} />
                      </div>
                    );
                  }
                  if (f.type === "textarea") {
                    return (
                      <div key={f.name} className="space-y-1">
                        <Label htmlFor={f.name}>{f.label}{f.required && " *"}</Label>
                        <Textarea id={f.name} name={f.name} defaultValue={defaultVal as string} required={f.required} placeholder={f.placeholder} rows={3} />
                      </div>
                    );
                  }
                  return (
                    <div key={f.name} className="space-y-1">
                      <Label htmlFor={f.name}>{f.label}{f.required && " *"}</Label>
                      <Input
                        id={f.name}
                        name={f.name}
                        type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : "text"}
                        defaultValue={defaultVal as string}
                        required={f.required}
                        placeholder={f.placeholder}
                      />
                    </div>
                  );
                })}
                <DialogFooter>
                  <Button type="submit" disabled={upsert.isPending}>{upsert.isPending ? "..." : "Saqlash"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {searchFields.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="pl-8" />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleFields.map((f) => <TableHead key={f.name}>{f.label}</TableHead>)}
                {(canEdit || canDelete) && <TableHead className="w-24 text-right">Amal</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={visibleFields.length + 1} className="text-center text-muted-foreground py-8">Yuklanmoqda...</TableCell></TableRow>
              )}
              {!isLoading && rows.length === 0 && (
                <TableRow><TableCell colSpan={visibleFields.length + 1} className="text-center text-muted-foreground py-8">Bo'sh</TableCell></TableRow>
              )}
              {rows.map((row: any) => (
                <TableRow key={row[rowKey]}>
                  {visibleFields.map((f) => (
                    <TableCell key={f.name} className="max-w-xs truncate">
                      {f.format ? f.format(row[f.name], row) : renderCell(row[f.name], f.type)}
                    </TableCell>
                  ))}
                  {(canEdit || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button size="icon" variant="ghost" onClick={() => { setEditing(row); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>O'chirilsinmi?</AlertDialogTitle>
                                <AlertDialogDescription>Bu amalni qaytarib bo'lmaydi.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Bekor</AlertDialogCancel>
                                <AlertDialogAction onClick={() => del.mutate(row[rowKey])}>O'chirish</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function renderCell(v: any, type?: FieldType) {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
  if (type === "boolean") return v ? "✓" : "✗";
  if (type === "datetime" || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v))) {
    try { return format(new Date(v), "dd.MM.yyyy HH:mm"); } catch { return String(v); }
  }
  if (type === "date") {
    try { return format(new Date(v), "dd.MM.yyyy"); } catch { return String(v); }
  }
  return String(v);
}

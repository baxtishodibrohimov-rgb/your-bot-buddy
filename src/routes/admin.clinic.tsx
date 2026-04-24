import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as React from "react";

export const Route = createFileRoute("/admin/clinic")({
  component: ClinicPage,
});

const fields: Array<{ name: keyof Row; label: string; type?: "text" | "textarea" }> = [
  { name: "name_uz", label: "Nomi (UZ)" },
  { name: "name_ru", label: "Nomi (RU)" },
  { name: "phone", label: "Telefon" },
  { name: "address_uz", label: "Manzil (UZ)" },
  { name: "address_ru", label: "Manzil (RU)" },
  { name: "working_hours_uz", label: "Ish vaqti (UZ)" },
  { name: "working_hours_ru", label: "Ish vaqti (RU)" },
  { name: "about_uz", label: "Klinika haqida (UZ)", type: "textarea" },
  { name: "about_ru", label: "Klinika haqida (RU)", type: "textarea" },
  { name: "instagram", label: "Instagram" },
  { name: "telegram_channel", label: "Telegram kanal" },
  { name: "location_url", label: "Lokatsiya URL" },
];

interface Row {
  id: number;
  name_uz: string; name_ru: string;
  phone: string;
  address_uz: string; address_ru: string;
  working_hours_uz: string; working_hours_ru: string;
  about_uz: string; about_ru: string;
  instagram: string | null; telegram_channel: string | null; location_url: string | null;
}

function ClinicPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["clinic_info"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinic_info").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as Row | null;
    },
  });

  const save = useMutation({
    mutationFn: async (values: Partial<Row>) => {
      const { error } = await supabase.from("clinic_info").upsert({ id: 1, ...values });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saqlandi"); qc.invalidateQueries({ queryKey: ["clinic_info"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values: any = {};
    for (const f of fields) values[f.name] = fd.get(f.name) || null;
    save.mutate(values);
  };

  if (isLoading) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Klinika ma'lumotlari</h1>
        <p className="text-sm text-muted-foreground">Bot bemorlarga ko'rsatadigan asosiy ma'lumotlar</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Tahrirlash</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            {fields.map((f) => (
              <div key={f.name as string} className="space-y-1">
                <Label htmlFor={f.name as string}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea id={f.name as string} name={f.name as string} defaultValue={(data?.[f.name] as string) ?? ""} rows={3} />
                ) : (
                  <Input id={f.name as string} name={f.name as string} defaultValue={(data?.[f.name] as string) ?? ""} />
                )}
              </div>
            ))}
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "..." : "Saqlash"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

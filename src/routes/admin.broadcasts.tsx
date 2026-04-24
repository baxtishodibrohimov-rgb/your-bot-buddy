import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import * as React from "react";

export const Route = createFileRoute("/admin/broadcasts")({
  component: BroadcastsPage,
});

function BroadcastsPage() {
  const qc = useQueryClient();
  const [text, setText] = React.useState("");
  const [lang, setLang] = React.useState<string>("all");

  const { data: list = [] } = useQuery({
    queryKey: ["broadcasts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("broadcasts").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth yo'q");

      const { data: admin } = await supabase.from("admins").select("id, telegram_id").eq("user_id", user.id).maybeSingle();
      if (!admin) throw new Error("Admin topilmadi");

      // Recipientlarni hisoblash
      let q = supabase.from("patients").select("telegram_id", { count: "exact" });
      if (lang !== "all") q = q.eq("language", lang);
      const { count } = await q;

      const { error } = await supabase.from("broadcasts").insert({
        message_text: text,
        language_filter: lang === "all" ? null : lang,
        sent_by_admin_id: admin.id,
        sent_by_telegram_id: admin.telegram_id,
        total_recipients: count ?? 0,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Broadcast navbatga qo'shildi. Bot uni keyingi pollda yuboradi.");
      setText("");
      qc.invalidateQueries({ queryKey: ["broadcasts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Broadcast</h1>
        <p className="text-sm text-muted-foreground">Barcha bemorlarga ommaviy xabar yuborish</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Yangi broadcast</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Til filteri</Label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="uz">🇺🇿 O'zbek</SelectItem>
                <SelectItem value="ru">🇷🇺 Rus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Xabar matni</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Salom! Bizning yangi aksiyamiz..." />
          </div>
          <Button onClick={() => send.mutate()} disabled={!text.trim() || send.isPending}>
            {send.isPending ? "Yuborilmoqda..." : "Yuborish"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tarix</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {list.length === 0 && <p className="text-sm text-muted-foreground">Bo'sh</p>}
          {list.map((b: any) => (
            <div key={b.id} className="border-b pb-2 last:border-0 text-sm">
              <div className="line-clamp-2">{b.message_text}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(b.created_at), "dd.MM.yyyy HH:mm")} · {b.status} ·
                {" "}{b.sent_count}/{b.total_recipients} yuborildi
                {b.failed_count > 0 && ` · ${b.failed_count} xato`}
                {b.language_filter && ` · ${b.language_filter}`}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

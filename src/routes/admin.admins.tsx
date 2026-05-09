import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage } from "@/components/admin/CrudPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/admins")({
  component: AdminsPage,
});

function AdminsPage() {
  return (
    <div className="space-y-6">
      <CreateWebAdminCard />
      <CrudPage
        table="admins"
        title="Adminlar"
        description="Web panel va Telegram adminlari"
        searchFields={["full_name"]}
        fields={[
          { name: "full_name", label: "F.I.Sh" },
          { name: "telegram_id", label: "Telegram ID", type: "number", required: true },
          { name: "user_id", label: "Auth user ID (kabinetga ulash uchun)", placeholder: "Auth UUID" },
          { name: "is_super_admin", label: "Super admin", type: "boolean" },
          { name: "created_at", label: "Yaratildi", type: "datetime", hideInForm: true },
        ]}
      />
    </div>
  );
}

function CreateWebAdminCard() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [telegramId, setTelegramId] = React.useState("");
  const [isSuper, setIsSuper] = React.useState(false);

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        body: {
          email,
          password,
          full_name: fullName || null,
          telegram_id: telegramId ? Number(telegramId) : null,
          is_super_admin: isSuper,
        },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast.success("Yangi web admin yaratildi");
      qc.invalidateQueries({ queryKey: ["admins"] });
      setOpen(false);
      setEmail(""); setPassword(""); setFullName(""); setTelegramId(""); setIsSuper(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
      <div>
        <h2 className="font-semibold">Web admin yaratish</h2>
        <p className="text-sm text-muted-foreground">
          Email va parol bilan yangi admin hisobi yarating. U darhol panelga kira oladi.
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button><UserPlus className="h-4 w-4 mr-1" /> Yangi web admin</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi web admin</DialogTitle>
            <DialogDescription>
              Email/parol bilan kira oladigan yangi admin yaratiladi va admins jadvaliga qo'shiladi.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label htmlFor="ca-email">Email *</Label>
              <Input id="ca-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ca-pass">Parol * (≥6)</Label>
              <Input id="ca-pass" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ca-name">F.I.Sh</Label>
              <Input id="ca-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ca-tg">Telegram ID *</Label>
              <Input id="ca-tg" type="number" required value={telegramId} onChange={(e) => setTelegramId(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="ca-super">Super admin</Label>
              <Switch id="ca-super" checked={isSuper} onCheckedChange={setIsSuper} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "..." : "Yaratish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

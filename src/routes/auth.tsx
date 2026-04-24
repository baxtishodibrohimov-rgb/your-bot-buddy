import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Kirish — Biodent admin" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && session && isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [loading, session, isAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (mode === "signup") {
      toast.success("Hisob yaratildi. Endi admin sifatida ulanish uchun super-admin sizni admins jadvaliga qo'shishi kerak.");
    } else {
      toast.success("Xush kelibsiz");
    }
  };

  if (session && !isAdmin && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Ruxsat yo'q</CardTitle>
            <CardDescription>
              Sizning hisobingiz admin emas. Super-admin sizni admins jadvaliga qo'shishi kerak.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Foydalanuvchi ID (super-adminga yuboring):</p>
            <code className="block break-all rounded-md bg-muted p-2 text-xs">{session.user.id}</code>
            <Button variant="outline" className="w-full" onClick={() => useAuth().signOut()}>
              Chiqish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Biodent Admin</CardTitle>
          <CardDescription>
            {mode === "signin" ? "Hisobingizga kiring" : "Yangi hisob yarating"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "..." : mode === "signin" ? "Kirish" : "Ro'yxatdan o'tish"}
            </Button>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "signin" ? "Hisob yo'qmi? Ro'yxatdan o'ting" : "Hisob bormi? Kiring"}
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/">← Bosh sahifaga qaytish</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

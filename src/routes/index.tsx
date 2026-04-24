import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Biodent — Telegram bot boshqaruv paneli" },
      { name: "description", content: "Biodent stomatologiya klinikasi uchun Telegram bot va admin paneli." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
              <span className="size-2 rounded-full bg-emerald-500" />
              Bot ishga tushirildi
            </div>
            <h1 className="mt-6 text-5xl font-bold tracking-tight">
              Biodent <span className="text-muted-foreground">bot</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Stomatologiya klinikasi uchun Telegram bot va admin paneli.
            </p>
          </div>
          <a
            href="/admin"
            className="shrink-0 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Admin panel
          </a>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <Card title="Telegram bot ✅" status="ready">
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• Bemorlar bilan ishlash, tibbiy karta, shikoyatlar</li>
              <li>• Xodimlar, checklist, davomat</li>
              <li>• Laboratoriya buyurtmalari</li>
              <li>• Rezidentura bo'limi (himoyalangan kontent)</li>
            </ul>
          </Card>
          <Card title="Web admin paneli ✅" status="ready">
            <p className="text-sm text-muted-foreground">
              Barcha ma'lumotlarni boshqarish, statistika, broadcast.
            </p>
            <a href="/auth" className="mt-3 inline-block text-sm text-primary hover:underline">
              Kirish →
            </a>
          </Card>
        </section>
      </div>
    </div>
  );
}

function Card({
  title,
  status,
  children,
}: {
  title: string;
  status: "ready" | "pending";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            status === "ready"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {status === "ready" ? "Tayyor" : "Kutmoqda"}
        </span>
      </div>
      {children}
    </div>
  );
}

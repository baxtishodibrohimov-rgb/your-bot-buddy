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
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
            <span className="size-2 rounded-full bg-emerald-500" />
            Bot ishga tushirildi
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight">
            Biodent <span className="text-muted-foreground">bot</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Stomatologiya klinikasi uchun Telegram bot. Bemorlar bilan ishlash, tibbiy kartalar,
            shikoyatlar va xodimlar boshqaruvi.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <Card title="1-bosqich ✅ Bemorlar qismi" status="ready">
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• Til tanlash (O'zbek / Rus)</li>
              <li>• Klinika haqida, xizmatlar, shifokorlar</li>
              <li>• Manzil va bog'lanish</li>
              <li>• Tibbiy karta to'ldirish</li>
              <li>• Shikoyat va takliflar</li>
            </ul>
          </Card>

          <Card title="2-bosqich ⏳ Xodimlar" status="pending">
            <p className="text-sm text-muted-foreground">
              Xodimlar uchun rolli kirish, davomat, lavozimga mos menyu.
            </p>
          </Card>

          <Card title="3-bosqich ⏳ Admin paneli" status="pending">
            <p className="text-sm text-muted-foreground">
              Web paneldan ma'lumot qo'shish, statistika, tahrirlash.
            </p>
          </Card>

          <Card title="4-bosqich ⏳ Sayqal" status="pending">
            <p className="text-sm text-muted-foreground">
              Bildirishnomalar, hisobotlar, qo'shimcha funksiyalar.
            </p>
          </Card>
        </section>

        <section className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Botni sinash</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Telegram'da botingizni oching va <code className="rounded bg-muted px-1.5 py-0.5">/start</code> buyrug'ini yuboring.
            Bot har daqiqada yangi xabarlarni qabul qiladi.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-1">Admin Telegram ID: 527846754</span>
            <span className="rounded-md bg-muted px-2 py-1">Tillar: 🇺🇿 / 🇷🇺</span>
            <span className="rounded-md bg-muted px-2 py-1">Polling: har 1 daqiqada</span>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h3 className="font-semibold text-amber-600 dark:text-amber-400">⚠️ Token xavfsizligi</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tokenni chatda yuborgan edingiz. Iltimos, @BotFather'da <code className="rounded bg-muted px-1.5 py-0.5">/revoke</code> qilib,
            yangi token oling. Yangi token Cloud → Secrets → <code className="rounded bg-muted px-1.5 py-0.5">TELEGRAM_API_KEY</code> orqali yangilanadi.
          </p>
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

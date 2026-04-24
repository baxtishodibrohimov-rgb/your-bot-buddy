import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/patients")({
  component: () => (
    <CrudPage
      table="patients"
      title="Bemorlar"
      description="Telegram orqali ro'yxatdan o'tgan bemorlar"
      searchFields={["first_name", "last_name", "phone", "telegram_username"]}
      canCreate={false}
      fields={[
        { name: "first_name", label: "Ism" },
        { name: "last_name", label: "Familiya" },
        { name: "phone", label: "Telefon" },
        { name: "telegram_username", label: "Username" },
        { name: "telegram_id", label: "Telegram ID", type: "number" },
        { name: "language", label: "Til" },
        { name: "created_at", label: "Yaratildi", type: "datetime", hideInForm: true },
        { name: "state", label: "State", hideInTable: true },
      ]}
    />
  ),
});

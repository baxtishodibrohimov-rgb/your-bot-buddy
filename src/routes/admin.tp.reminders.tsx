import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/tp/reminders")({
  component: () => (
    <CrudPage
      table="tp_reminder_rules"
      title="Eslatma qoidalari"
      description="Qachon va kimga Telegram eslatma yuborilishini boshqaring (vaqtlar hardcode emas)"
      orderBy={{ column: "sort_order", ascending: true }}
      searchFields={["name"]}
      fields={[
        { name: "name", label: "Nomi", required: true },
        { name: "trigger_type", label: "Trigger", required: true, placeholder: "on_assignment / before_consultation / after_deadline" },
        { name: "offset_minutes", label: "Necha daqiqa oldin", type: "number", placeholder: "1440 = 24 soat" },
        { name: "is_active", label: "Faol", type: "boolean" },
        { name: "sort_order", label: "Tartib", type: "number", hideInTable: true },
      ]}
    />
  ),
});

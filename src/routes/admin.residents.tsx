import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/residents")({
  component: () => (
    <CrudPage
      table="residents"
      title="Rezidentlar"
      searchFields={["full_name"]}
      fields={[
        { name: "full_name", label: "F.I.Sh" },
        { name: "telegram_id", label: "Telegram ID", type: "number", required: true },
        { name: "notes", label: "Izoh", type: "textarea", hideInTable: true },
        { name: "is_active", label: "Faol", type: "boolean" },
      ]}
    />
  ),
});

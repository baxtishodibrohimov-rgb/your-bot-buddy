import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/lab-workers")({
  component: () => (
    <CrudPage
      table="lab_workers"
      title="Laboratoriya xodimlari"
      searchFields={["full_name"]}
      fields={[
        { name: "full_name", label: "F.I.Sh", required: true },
        { name: "telegram_id", label: "Telegram ID", type: "number", required: true },
        { name: "is_active", label: "Faol", type: "boolean" },
      ]}
    />
  ),
});

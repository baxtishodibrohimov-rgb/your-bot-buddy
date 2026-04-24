import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/checklists")({
  component: () => (
    <CrudPage
      table="staff_checklists"
      title="Checklistlar"
      description="Xodimlarga biriktirilgan kunlik checklistlar. Itemlarni keyin batafsil sahifada tahrirlash mumkin."
      fields={[
        { name: "staff_id", label: "Xodim ID", required: true },
        { name: "title", label: "Sarlavha", required: true },
        { name: "is_daily_required", label: "Har kuni majburiy", type: "boolean" },
        { name: "sort_order", label: "Tartib", type: "number", hideInTable: true },
      ]}
    />
  ),
});

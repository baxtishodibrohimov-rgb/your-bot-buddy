import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/resident-sections")({
  component: () => (
    <CrudPage
      table="resident_sections"
      title="Rezidentura bo'limlari"
      description="Iyerarxik bo'limlar. parent_id orqali ichki bo'limlar yaratiladi."
      searchFields={["title"]}
      fields={[
        { name: "title", label: "Sarlavha", required: true },
        { name: "description", label: "Tavsif", type: "textarea", hideInTable: true },
        { name: "parent_id", label: "Ota bo'lim ID (bo'sh = ildiz)" },
        { name: "is_root", label: "Ildiz", type: "boolean" },
        { name: "sort_order", label: "Tartib", type: "number", hideInTable: true },
      ]}
    />
  ),
});

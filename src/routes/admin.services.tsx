import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/services")({
  component: () => (
    <CrudPage
      table="services"
      title="Xizmatlar va narxlar"
      searchFields={["name_uz", "name_ru"]}
      fields={[
        { name: "name_uz", label: "Nomi (UZ)", required: true },
        { name: "name_ru", label: "Nomi (RU)", required: true },
        { name: "price_from", label: "Narx (dan)", type: "number" },
        { name: "price_to", label: "Narx (gacha)", type: "number" },
        { name: "description_uz", label: "Tavsif (UZ)", type: "textarea", hideInTable: true },
        { name: "description_ru", label: "Tavsif (RU)", type: "textarea", hideInTable: true },
        { name: "sort_order", label: "Tartib", type: "number", hideInTable: true },
        { name: "is_active", label: "Faol", type: "boolean" },
      ]}
    />
  ),
});

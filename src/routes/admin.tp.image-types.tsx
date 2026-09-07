import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/tp/image-types")({
  component: () => (
    <CrudPage
      table="tp_image_types"
      title="Rasm turlari"
      description="Har bir bemor uchun talab qilinadigan diagnostik rasm turlari (extraoral / intraoral / radiology)"
      orderBy={{ column: "sort_order", ascending: true }}
      searchFields={["code", "label"]}
      fields={[
        { name: "code", label: "Kod", required: true, placeholder: "face_frontal" },
        { name: "label", label: "Nomi", required: true },
        { name: "category", label: "Kategoriya", required: true, placeholder: "extraoral / intraoral / radiology" },
        { name: "is_required", label: "Majburiy", type: "boolean" },
        { name: "is_active", label: "Faol", type: "boolean" },
        { name: "sort_order", label: "Tartib", type: "number" },
      ]}
    />
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/staff")({
  component: () => (
    <CrudPage
      table="staff"
      title="Xodimlar"
      searchFields={["full_name", "phone"]}
      fields={[
        { name: "full_name", label: "F.I.Sh", required: true },
        { name: "telegram_id", label: "Telegram ID", type: "number", required: true },
        { name: "position", label: "Lavozim", required: true, placeholder: "registratura / koordinator / shifokor / shifokor_yordamchisi / hisobchi / sterilizatsiya" },
        { name: "phone", label: "Telefon" },
        { name: "specialty_uz", label: "Mutaxassislik (UZ)", hideInTable: true },
        { name: "specialty_ru", label: "Mutaxassislik (RU)", hideInTable: true },
        { name: "bio_uz", label: "Bio (UZ)", type: "textarea", hideInTable: true },
        { name: "bio_ru", label: "Bio (RU)", type: "textarea", hideInTable: true },
        { name: "experience_years", label: "Tajriba (yil)", type: "number", hideInTable: true },
        { name: "photo_url", label: "Foto URL", hideInTable: true },
        { name: "sort_order", label: "Tartib", type: "number", hideInTable: true },
        { name: "is_active", label: "Faol", type: "boolean" },
      ]}
    />
  ),
});

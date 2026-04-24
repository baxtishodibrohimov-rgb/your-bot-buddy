import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/admins")({
  component: () => (
    <CrudPage
      table="admins"
      title="Adminlar"
      description="Telegram admin va ularning kabinet user_id'lari"
      searchFields={["full_name"]}
      fields={[
        { name: "full_name", label: "F.I.Sh" },
        { name: "telegram_id", label: "Telegram ID", type: "number", required: true },
        { name: "user_id", label: "Auth user ID (kabinetga ulash uchun)", placeholder: "Auth foydalanuvchi UUID'si" },
        { name: "is_super_admin", label: "Super admin", type: "boolean" },
        { name: "created_at", label: "Yaratildi", type: "datetime", hideInForm: true },
      ]}
    />
  ),
});

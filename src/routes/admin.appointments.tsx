import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/appointments")({
  component: () => (
    <CrudPage
      table="appointments"
      title="Uchrashuvlar"
      searchFields={["full_name", "phone"]}
      fields={[
        { name: "full_name", label: "F.I.Sh", required: true },
        { name: "phone", label: "Telefon", required: true },
        { name: "appointment_at", label: "Sana", type: "datetime" },
        { name: "status", label: "Status", placeholder: "new / confirmed / done / cancelled" },
        { name: "notes", label: "Izoh", type: "textarea", hideInTable: true },
        { name: "admin_note", label: "Admin izohi", type: "textarea", hideInTable: true },
        { name: "created_at", label: "Yaratildi", type: "datetime", hideInForm: true },
      ]}
    />
  ),
});

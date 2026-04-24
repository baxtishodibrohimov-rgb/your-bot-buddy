import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/lab-orders")({
  component: () => (
    <CrudPage
      table="lab_orders"
      title="Laboratoriya buyurtmalari"
      searchFields={["patient_full_name", "doctor_name", "appliance_name"]}
      canCreate={false}
      fields={[
        { name: "patient_full_name", label: "Bemor" },
        { name: "doctor_name", label: "Shifokor" },
        { name: "appliance_name", label: "Buyurtma turi" },
        { name: "status", label: "Status" },
        { name: "ready_due_date", label: "Muddat", type: "date" },
        { name: "completed_at", label: "Tugatilgan", type: "datetime" },
        { name: "notes", label: "Izoh", type: "textarea", hideInTable: true },
        { name: "reject_reason", label: "Bekor sababi", type: "textarea", hideInTable: true },
        { name: "created_at", label: "Yaratildi", type: "datetime", hideInForm: true },
      ]}
    />
  ),
});

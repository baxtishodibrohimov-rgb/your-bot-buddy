import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/admin/complaints")({
  component: () => (
    <CrudPage
      table="complaints"
      title="Shikoyatlar va takliflar"
      searchFields={["message"]}
      canCreate={false}
      fields={[
        { name: "type", label: "Turi" },
        { name: "message", label: "Xabar", type: "textarea" },
        { name: "status", label: "Status", placeholder: "new / in_progress / resolved" },
        { name: "admin_response", label: "Admin javobi", type: "textarea", hideInTable: true },
        { name: "created_at", label: "Yaratildi", type: "datetime", hideInForm: true },
      ]}
    />
  ),
});

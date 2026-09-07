// Core case-sync logic (spec sections 2, 3, 10, 19).
//
// Shared between the periodic poll (cliniccards-sync), the webhook receiver
// (cliniccards-webhook) and any future "manual sync now" admin action, so all
// three paths create/update cases identically.
// deno-lint-ignore-file no-explicit-any
import type { CliniccardsAdapter, CliniccardsAppointment } from "./types.ts";
import { autoAssignPlanner } from "./assignment.ts";

export interface SyncResult {
  recordsSeen: number;
  casesCreated: number;
  errors: string[];
}

async function getSetting(supabase: any, key: string, fallback: any) {
  const { data } = await supabase.from("tp_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? fallback;
}

async function upsertPatientCache(supabase: any, adapter: CliniccardsAdapter, patientId: string) {
  const patient = await adapter.getPatient(patientId);
  if (!patient) return;
  await supabase.from("tp_cliniccards_patients").upsert(
    {
      cliniccards_patient_id: patient.patientId,
      full_name: patient.fullName,
      birth_date: patient.birthDate,
      phone: patient.phone,
      raw_payload: patient.raw,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "cliniccards_patient_id" },
  );
}

async function upsertAppointmentCache(supabase: any, appt: CliniccardsAppointment) {
  await supabase.from("tp_cliniccards_appointments").upsert(
    {
      cliniccards_appointment_id: appt.appointmentId,
      cliniccards_patient_id: appt.patientId,
      appointment_type_code: appt.appointmentTypeCode,
      appointment_type_label: appt.appointmentTypeLabel,
      doctor_name: appt.doctorName,
      scheduled_at: appt.scheduledAt,
      raw_payload: appt.raw,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "cliniccards_appointment_id" },
  );
}

async function importImages(supabase: any, adapter: CliniccardsAdapter, caseId: string, patientId: string) {
  const [images, { data: imageTypes }] = await Promise.all([
    adapter.getPatientImages(patientId),
    supabase.from("tp_image_types").select("id, code, label").eq("is_active", true),
  ]);

  const byLabel = new Map<string, string>((imageTypes ?? []).map((t: any) => [t.label.toLowerCase(), t.id]));

  for (const img of images) {
    const imageTypeId = img.labelHint ? byLabel.get(img.labelHint.toLowerCase()) ?? null : null;
    await supabase.from("tp_clinical_images").upsert(
      {
        case_id: caseId,
        image_type_id: imageTypeId,
        source: "cliniccards",
        cliniccards_document_id: img.imageId,
        external_url: img.url,
        captured_at: img.capturedAt,
      },
      { onConflict: "case_id,cliniccards_document_id" },
    );
  }

  await recomputeImagesProgress(supabase, caseId);
}

export async function recomputeImagesProgress(supabase: any, caseId: string) {
  const { data: requiredTypes } = await supabase
    .from("tp_image_types")
    .select("id")
    .eq("is_active", true)
    .eq("is_required", true);
  const requiredIds = new Set((requiredTypes ?? []).map((t: any) => t.id));
  if (requiredIds.size === 0) return;

  const { data: present } = await supabase
    .from("tp_clinical_images")
    .select("image_type_id")
    .eq("case_id", caseId)
    .not("image_type_id", "is", null);
  const presentIds = new Set((present ?? []).map((r: any) => r.image_type_id));

  let have = 0;
  for (const id of requiredIds) if (presentIds.has(id)) have++;
  const percent = Math.round((have / requiredIds.size) * 100);

  await supabase.from("tp_cases").update({ images_progress_percent: percent }).eq("id", caseId);

  if (percent === 100) {
    const { data: caseRow } = await supabase.from("tp_cases").select("status").eq("id", caseId).maybeSingle();
    if (caseRow?.status === "ASSIGNED") {
      await supabase.from("tp_cases").update({ status: "IMAGES_READY" }).eq("id", caseId);
      await supabase
        .from("tp_audit_log")
        .insert({ case_id: caseId, action: "status_changed", details: { to: "IMAGES_READY", reason: "all required images present" } });
    }
  }
}

async function resolveInternalDoctor(supabase: any, doctorName: string | null): Promise<string | null> {
  if (!doctorName) return null;
  const { data } = await supabase
    .from("staff")
    .select("id")
    .eq("position", "shifokor")
    .ilike("full_name", doctorName.trim())
    .maybeSingle();
  return data?.id ?? null;
}

/** Creates a TreatmentPlanCase for one appointment if it doesn't already exist.
 * Returns the case id and whether it was newly created (idempotency guarantee
 * per spec section 3: "Bir appointment uchun takroriy Case yaratilmasin"). */
async function ensureCase(supabase: any, appt: CliniccardsAppointment): Promise<{ caseId: string; created: boolean }> {
  const { data: existing } = await supabase
    .from("tp_cases")
    .select("id")
    .eq("cliniccards_appointment_id", appt.appointmentId)
    .maybeSingle();
  if (existing) return { caseId: existing.id, created: false };

  const deadlineHours = Number(await getSetting(supabase, "default_deadline_hours_before_consultation", 24));
  const deadline = new Date(new Date(appt.scheduledAt).getTime() - deadlineHours * 60 * 60 * 1000).toISOString();
  const primaryDoctorStaffId = await resolveInternalDoctor(supabase, appt.doctorName);

  const { data: inserted, error } = await supabase
    .from("tp_cases")
    .insert({
      cliniccards_patient_id: appt.patientId,
      cliniccards_appointment_id: appt.appointmentId,
      consultation_datetime: appt.scheduledAt,
      primary_doctor_staff_id: primaryDoctorStaffId,
      primary_doctor_name: appt.doctorName,
      deadline,
      status: "NEW",
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation: another concurrent sync run created it first.
    if ((error as any).code === "23505") {
      const { data: retryExisting } = await supabase
        .from("tp_cases")
        .select("id")
        .eq("cliniccards_appointment_id", appt.appointmentId)
        .maybeSingle();
      if (retryExisting) return { caseId: retryExisting.id, created: false };
    }
    throw error;
  }

  const caseId = inserted.id as string;

  await supabase.from("tp_audit_log").insert({
    case_id: caseId,
    action: "case_created",
    details: { source: "cliniccards", cliniccards_appointment_id: appt.appointmentId },
  });

  const assignedTo = await autoAssignPlanner(supabase, caseId);
  if (!assignedTo) {
    await supabase.from("tp_cases").update({ status: "WAITING_ASSIGNMENT" }).eq("id", caseId);
  }

  return { caseId, created: true };
}

export async function processAppointment(
  supabase: any,
  adapter: CliniccardsAdapter,
  appt: CliniccardsAppointment,
): Promise<{ caseId: string; created: boolean }> {
  await upsertPatientCache(supabase, adapter, appt.patientId);
  await upsertAppointmentCache(supabase, appt);
  const result = await ensureCase(supabase, appt);
  await importImages(supabase, adapter, result.caseId, appt.patientId);
  return result;
}

export async function syncSecondConsultations(
  supabase: any,
  adapter: CliniccardsAdapter,
  syncType: "poll" | "webhook" | "manual",
  onlyAppointmentId?: string,
): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  let recordsSeen = 0;
  let casesCreated = 0;

  try {
    const secondConsultationCodes: string[] = await getSetting(
      supabase,
      "second_consultation_appointment_type_codes",
      ["consultation_2"],
    );

    let appts = await adapter.getAppointments();
    if (onlyAppointmentId) {
      appts = appts.filter((a) => a.appointmentId === onlyAppointmentId);
    }
    appts = appts.filter((a) => secondConsultationCodes.includes(a.appointmentTypeCode));
    recordsSeen = appts.length;

    for (const appt of appts) {
      try {
        const { created } = await processAppointment(supabase, adapter, appt);
        if (created) casesCreated++;
      } catch (e) {
        errors.push(`${appt.appointmentId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  await supabase.from("tp_integration_sync_log").insert({
    source: "cliniccards",
    sync_type: syncType,
    status: errors.length === 0 ? "success" : recordsSeen > 0 ? "partial" : "error",
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    records_seen: recordsSeen,
    cases_created: casesCreated,
    error: errors.length ? errors.join("; ") : null,
  });

  return { recordsSeen, casesCreated, errors };
}

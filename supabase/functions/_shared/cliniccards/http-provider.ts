// Real Cliniccards REST client.
//
// Enabled automatically once CLINICCARDS_API_URL and CLINICCARDS_API_KEY are
// set as Supabase Edge Function secrets (`supabase secrets set ...`). No
// endpoint path is hardcoded elsewhere in the codebase — every path used here
// is read from an env var with a best-guess REST default, so wiring in the
// real API later means editing secrets + this file only.
//
// IMPORTANT: the response field mapping below (`mapPatient`, `mapAppointment`,
// ...) is a placeholder until Cliniccards' actual API documentation is
// provided. Nothing about clinical workflow depends on getting this exactly
// right on the first try — only field names. Update the `map*` functions
// once real payload samples are available; the rest of the app only depends
// on the `CliniccardsAdapter` interface in types.ts, so nothing else needs to
// change.
import type {
  CliniccardsAdapter,
  CliniccardsAppointment,
  CliniccardsDocument,
  CliniccardsImage,
  CliniccardsPatient,
  GetAppointmentsParams,
} from "./types.ts";

interface HttpAdapterConfig {
  baseUrl: string;
  apiKey: string;
  apiKeyHeader: string;
  patientsPath: string;
  appointmentsPath: string;
  appointmentByIdPath: string; // supports {appointmentId} placeholder
  patientDocumentsPath: string; // supports {patientId} placeholder
  patientImagesPath: string; // supports {patientId} placeholder
}

function readConfig(): HttpAdapterConfig {
  const baseUrl = Deno.env.get("CLINICCARDS_API_URL");
  const apiKey = Deno.env.get("CLINICCARDS_API_KEY");
  if (!baseUrl || !apiKey) {
    throw new Error("CLINICCARDS_API_URL / CLINICCARDS_API_KEY not configured");
  }
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    apiKeyHeader: Deno.env.get("CLINICCARDS_API_KEY_HEADER") || "Authorization",
    patientsPath: Deno.env.get("CLINICCARDS_PATIENTS_PATH") || "/patients",
    appointmentsPath: Deno.env.get("CLINICCARDS_APPOINTMENTS_PATH") || "/appointments",
    appointmentByIdPath: Deno.env.get("CLINICCARDS_APPOINTMENT_BY_ID_PATH") || "/appointments/{appointmentId}",
    patientDocumentsPath: Deno.env.get("CLINICCARDS_PATIENT_DOCUMENTS_PATH") || "/patients/{patientId}/documents",
    patientImagesPath: Deno.env.get("CLINICCARDS_PATIENT_IMAGES_PATH") || "/patients/{patientId}/images",
  };
}

function fillPath(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, encodeURIComponent(v)), template);
}

// deno-lint-ignore no-explicit-any
function mapPatient(raw: any): CliniccardsPatient {
  return {
    patientId: String(raw.id ?? raw.patientId ?? raw.patient_id),
    fullName: String(raw.fullName ?? raw.full_name ?? raw.name ?? ""),
    birthDate: raw.birthDate ?? raw.birth_date ?? null,
    phone: raw.phone ?? raw.phoneNumber ?? null,
    raw,
  };
}

// deno-lint-ignore no-explicit-any
function mapAppointment(raw: any): CliniccardsAppointment {
  return {
    appointmentId: String(raw.id ?? raw.appointmentId ?? raw.appointment_id),
    patientId: String(raw.patientId ?? raw.patient_id),
    doctorName: raw.doctorName ?? raw.doctor_name ?? null,
    appointmentTypeCode: String(raw.typeCode ?? raw.type_code ?? raw.appointmentType ?? ""),
    appointmentTypeLabel: String(raw.typeLabel ?? raw.type_label ?? raw.appointmentType ?? ""),
    scheduledAt: String(raw.scheduledAt ?? raw.scheduled_at ?? raw.datetime),
    raw,
  };
}

// deno-lint-ignore no-explicit-any
function mapDocument(raw: any, patientId: string): CliniccardsDocument {
  return {
    documentId: String(raw.id ?? raw.documentId),
    patientId,
    kind: String(raw.kind ?? raw.type ?? "document"),
    title: String(raw.title ?? raw.name ?? "Document"),
    url: String(raw.url ?? raw.fileUrl ?? raw.file_url ?? ""),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  };
}

// deno-lint-ignore no-explicit-any
function mapImage(raw: any, patientId: string): CliniccardsImage {
  return {
    imageId: String(raw.id ?? raw.imageId),
    patientId,
    labelHint: raw.label ?? raw.category ?? raw.name ?? null,
    url: String(raw.url ?? raw.fileUrl ?? raw.file_url ?? ""),
    capturedAt: raw.capturedAt ?? raw.captured_at ?? null,
  };
}

export class HttpCliniccardsAdapter implements CliniccardsAdapter {
  private config = readConfig();

  private async request<T>(path: string): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.config.apiKeyHeader.toLowerCase() === "authorization") {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    } else {
      headers[this.config.apiKeyHeader] = this.config.apiKey;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Cliniccards API ${res.status} on ${path}: ${await res.text().catch(() => "")}`);
    }
    return (await res.json()) as T;
  }

  async getPatients(): Promise<CliniccardsPatient[]> {
    // deno-lint-ignore no-explicit-any
    const data = await this.request<any>(this.config.patientsPath);
    const list = Array.isArray(data) ? data : data.items ?? data.data ?? [];
    return list.map(mapPatient);
  }

  async getPatient(patientId: string): Promise<CliniccardsPatient | null> {
    const patients = await this.getPatients();
    return patients.find((p) => p.patientId === patientId) ?? null;
  }

  async getAppointments(params?: GetAppointmentsParams): Promise<CliniccardsAppointment[]> {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.appointmentTypeCode) qs.set("type", params.appointmentTypeCode);
    const path = qs.toString() ? `${this.config.appointmentsPath}?${qs}` : this.config.appointmentsPath;
    // deno-lint-ignore no-explicit-any
    const data = await this.request<any>(path);
    const list = Array.isArray(data) ? data : data.items ?? data.data ?? [];
    return list.map(mapAppointment);
  }

  async getAppointmentType(appointmentId: string): Promise<{ code: string; label: string } | null> {
    // deno-lint-ignore no-explicit-any
    const data = await this.request<any>(fillPath(this.config.appointmentByIdPath, { appointmentId })).catch(() => null);
    if (!data) return null;
    const appt = mapAppointment(data);
    return { code: appt.appointmentTypeCode, label: appt.appointmentTypeLabel };
  }

  async getPatientDocuments(patientId: string): Promise<CliniccardsDocument[]> {
    // deno-lint-ignore no-explicit-any
    const data = await this.request<any>(fillPath(this.config.patientDocumentsPath, { patientId }));
    const list = Array.isArray(data) ? data : data.items ?? data.data ?? [];
    return list.map((raw: unknown) => mapDocument(raw, patientId));
  }

  async getPatientImages(patientId: string): Promise<CliniccardsImage[]> {
    // deno-lint-ignore no-explicit-any
    const data = await this.request<any>(fillPath(this.config.patientImagesPath, { patientId }));
    const list = Array.isArray(data) ? data : data.items ?? data.data ?? [];
    return list.map((raw: unknown) => mapImage(raw, patientId));
  }
}

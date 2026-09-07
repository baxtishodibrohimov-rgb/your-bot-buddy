// Cliniccards integration layer — types.
//
// This is the ONLY place that should know the shape of Cliniccards data.
// Nothing outside `_shared/cliniccards` should assume a particular field name
// or endpoint path from the real Cliniccards API — everything else in this
// project talks to `CliniccardsAdapter`, never to Cliniccards directly.
//
// Real API docs have not been provided yet (see /ARCHITECTURE.md, Phase 11).
// Until then `getAdapter()` returns `MockCliniccardsAdapter`, which returns
// deterministic fake data shaped exactly like this interface so the rest of
// the app (case sync, dashboard, image gallery) can be built and tested now.

export interface CliniccardsPatient {
  patientId: string;
  fullName: string;
  birthDate: string | null; // ISO date
  phone: string | null;
  raw: Record<string, unknown>;
}

export interface CliniccardsAppointment {
  appointmentId: string;
  patientId: string;
  doctorName: string | null;
  appointmentTypeCode: string;
  appointmentTypeLabel: string;
  scheduledAt: string; // ISO datetime
  raw: Record<string, unknown>;
}

export interface CliniccardsDocument {
  documentId: string;
  patientId: string;
  kind: string; // e.g. "referral", "consent", "note"
  title: string;
  url: string;
  createdAt: string;
}

export interface CliniccardsImage {
  imageId: string;
  patientId: string;
  /** Best-effort hint at what kind of clinical photo/x-ray this is, as labeled
   * in Cliniccards. Mapping this free-text label onto our own tp_image_types
   * is done by the sync logic (see case-sync.ts), not by the adapter. */
  labelHint: string | null;
  url: string;
  capturedAt: string | null;
}

export interface GetAppointmentsParams {
  /** Only return appointments scheduled at/after this ISO datetime. */
  from?: string;
  /** Only return appointments scheduled before this ISO datetime. */
  to?: string;
  /** Filter to a specific appointment type code, if known. */
  appointmentTypeCode?: string;
}

/**
 * Abstraction over the clinic's Cliniccards system. Concrete implementations:
 *   - MockCliniccardsAdapter — deterministic in-memory demo data (default).
 *   - HttpCliniccardsAdapter — real REST client, enabled once
 *     CLINICCARDS_API_URL + CLINICCARDS_API_KEY secrets are set.
 *
 * Keep this interface stable; add methods rather than changing signatures so
 * callers (case-sync, dashboard, future image wizard) don't need to change
 * when the real API is finally wired in.
 */
export interface CliniccardsAdapter {
  getPatients(): Promise<CliniccardsPatient[]>;
  getPatient(patientId: string): Promise<CliniccardsPatient | null>;
  getAppointments(params?: GetAppointmentsParams): Promise<CliniccardsAppointment[]>;
  getAppointmentType(appointmentId: string): Promise<{ code: string; label: string } | null>;
  getPatientDocuments(patientId: string): Promise<CliniccardsDocument[]>;
  getPatientImages(patientId: string): Promise<CliniccardsImage[]>;
}

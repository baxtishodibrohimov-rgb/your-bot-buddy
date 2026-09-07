// Deterministic mock Cliniccards provider.
//
// Used whenever CLINICCARDS_API_URL / CLINICCARDS_API_KEY are not configured
// (the default in every environment until real credentials + API docs are
// provided — see /ARCHITECTURE.md Phase 11). Scheduling times are computed
// relative to "now" each call so demo appointments stay in the near future
// no matter when this runs.
import type {
  CliniccardsAdapter,
  CliniccardsAppointment,
  CliniccardsDocument,
  CliniccardsImage,
  CliniccardsPatient,
  GetAppointmentsParams,
} from "./types.ts";

const IMAGE_LABELS = [
  "Face frontal",
  "Face frontal smile",
  "Face profile right",
  "Face profile left",
  "3/4 view",
  "Intraoral frontal",
  "Right buccal",
  "Left buccal",
  "Upper occlusal",
  "Lower occlusal",
  "OPG / panoramic",
  "Lateral cephalogram",
];

interface MockPatientSeed {
  id: string;
  fullName: string;
  birthDate: string;
  phone: string;
  daysUntilConsultation: number;
  doctorName: string;
}

const PATIENT_SEEDS: MockPatientSeed[] = [
  { id: "CC-1001", fullName: "Dilnoza Yusupova", birthDate: "2005-03-12", phone: "+998901234501", daysUntilConsultation: 1, doctorName: "Dr. Aziz Karimov" },
  { id: "CC-1002", fullName: "Sardor Toshev", birthDate: "1998-11-02", phone: "+998901234502", daysUntilConsultation: 2, doctorName: "Dr. Aziz Karimov" },
  { id: "CC-1003", fullName: "Madina Alieva", birthDate: "2010-07-19", phone: "+998901234503", daysUntilConsultation: 0.3, doctorName: "Dr. Nilufar Rashidova" },
  { id: "CC-1004", fullName: "Jasur Nematov", birthDate: "1995-01-27", phone: "+998901234504", daysUntilConsultation: 4, doctorName: "Dr. Nilufar Rashidova" },
  { id: "CC-1005", fullName: "Ozoda Karimova", birthDate: "2003-09-08", phone: "+998901234505", daysUntilConsultation: -1, doctorName: "Dr. Aziz Karimov" },
];

function patientToDto(seed: MockPatientSeed): CliniccardsPatient {
  return {
    patientId: seed.id,
    fullName: seed.fullName,
    birthDate: seed.birthDate,
    phone: seed.phone,
    raw: { ...seed, mock: true },
  };
}

function appointmentIdFor(patientId: string): string {
  return `${patientId}-APT-2CONS`;
}

function appointmentToDto(seed: MockPatientSeed): CliniccardsAppointment {
  const scheduledAt = new Date(Date.now() + seed.daysUntilConsultation * 24 * 60 * 60 * 1000).toISOString();
  return {
    appointmentId: appointmentIdFor(seed.id),
    patientId: seed.id,
    doctorName: seed.doctorName,
    appointmentTypeCode: "consultation_2",
    appointmentTypeLabel: "2-konsultatsiya",
    scheduledAt,
    raw: { mock: true },
  };
}

export class MockCliniccardsAdapter implements CliniccardsAdapter {
  async getPatients(): Promise<CliniccardsPatient[]> {
    return PATIENT_SEEDS.map(patientToDto);
  }

  async getPatient(patientId: string): Promise<CliniccardsPatient | null> {
    const seed = PATIENT_SEEDS.find((p) => p.id === patientId);
    return seed ? patientToDto(seed) : null;
  }

  async getAppointments(params?: GetAppointmentsParams): Promise<CliniccardsAppointment[]> {
    let appts = PATIENT_SEEDS.map(appointmentToDto);
    if (params?.appointmentTypeCode) {
      appts = appts.filter((a) => a.appointmentTypeCode === params.appointmentTypeCode);
    }
    if (params?.from) {
      const from = new Date(params.from).getTime();
      appts = appts.filter((a) => new Date(a.scheduledAt).getTime() >= from);
    }
    if (params?.to) {
      const to = new Date(params.to).getTime();
      appts = appts.filter((a) => new Date(a.scheduledAt).getTime() < to);
    }
    return appts;
  }

  async getAppointmentType(appointmentId: string): Promise<{ code: string; label: string } | null> {
    const seed = PATIENT_SEEDS.find((p) => appointmentIdFor(p.id) === appointmentId);
    if (!seed) return null;
    return { code: "consultation_2", label: "2-konsultatsiya" };
  }

  async getPatientDocuments(patientId: string): Promise<CliniccardsDocument[]> {
    const seed = PATIENT_SEEDS.find((p) => p.id === patientId);
    if (!seed) return [];
    return [
      {
        documentId: `${patientId}-DOC-1`,
        patientId,
        kind: "consent",
        title: "Consultation consent form",
        url: `https://mock-cliniccards.local/documents/${patientId}/consent.pdf`,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async getPatientImages(patientId: string): Promise<CliniccardsImage[]> {
    const seed = PATIENT_SEEDS.find((p) => p.id === patientId);
    if (!seed) return [];
    return IMAGE_LABELS.map((label, idx) => ({
      imageId: `${patientId}-IMG-${idx + 1}`,
      patientId,
      labelHint: label,
      url: `https://mock-cliniccards.local/images/${patientId}/${idx + 1}.jpg`,
      capturedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }
}

import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, ImageOff, Plus, Cloud, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CLINICAL_IMAGES_BUCKET = "tp-clinical-images";

async function uploadImageFile(caseId: string, file: File) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${caseId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(CLINICAL_IMAGES_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  return { storage_path: path, mime_type: file.type || null, original_filename: file.name };
}

function StorageImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const { data: url } = useQuery({
    queryKey: ["tp-signed-url", path],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(CLINICAL_IMAGES_BUCKET).createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    staleTime: 55 * 60 * 1000,
  });
  if (!url) return <div className={className} />;
  return <img src={url} alt={alt} className={className} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />;
}

function ImageThumb({ img, alt, className }: { img: any; alt: string; className?: string }) {
  if (img.source === "upload" && img.storage_path) {
    return <StorageImage path={img.storage_path} alt={alt} className={className} />;
  }
  return <img src={img.external_url} alt={alt} className={className} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />;
}

export const Route = createFileRoute("/admin/tp/cases/$caseId")({
  component: CaseDetail,
});

async function loadCase(caseId: string) {
  const { data: caseRow, error } = await (supabase.from("tp_cases" as any) as any)
    .select("*")
    .eq("id", caseId)
    .single();
  if (error) throw error;

  const [{ data: patient }, { data: images }, { data: imageTypes }, { data: findings }, { data: audit }, { data: planners }] =
    await Promise.all([
      (supabase.from("tp_cliniccards_patients" as any) as any)
        .select("*")
        .eq("cliniccards_patient_id", caseRow.cliniccards_patient_id)
        .maybeSingle(),
      (supabase.from("tp_clinical_images" as any) as any).select("*").eq("case_id", caseId),
      (supabase.from("tp_image_types" as any) as any).select("*").eq("is_active", true).order("sort_order"),
      (supabase.from("tp_findings" as any) as any).select("*").eq("case_id", caseId).order("sort_order"),
      (supabase.from("tp_audit_log" as any) as any).select("*").eq("case_id", caseId).order("created_at", { ascending: true }),
      (supabase.from("tp_staff_roles" as any) as any).select("staff_id, staff:staff_id(id, full_name, is_active)").eq("role", "planner"),
    ]);

  const staffIds = [caseRow.responsible_planner_staff_id, caseRow.primary_doctor_staff_id].filter(Boolean);
  const { data: staffRows } = staffIds.length
    ? await (supabase.from("staff" as any) as any).select("id, full_name").in("id", staffIds)
    : { data: [] as any[] };
  const staffMap = new Map((staffRows ?? []).map((s: any) => [s.id, s.full_name]));

  return {
    caseRow,
    patient,
    images: images ?? [],
    imageTypes: imageTypes ?? [],
    findings: findings ?? [],
    audit: audit ?? [],
    planners: (planners ?? []).map((p: any) => p.staff).filter((s: any) => s?.is_active),
    plannerName: caseRow.responsible_planner_staff_id ? staffMap.get(caseRow.responsible_planner_staff_id) : null,
    doctorName: caseRow.primary_doctor_name ?? (caseRow.primary_doctor_staff_id ? staffMap.get(caseRow.primary_doctor_staff_id) : null),
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  extraoral: "Extraoral",
  intraoral: "Intraoral",
  radiology: "Radiology",
};

function CaseDetail() {
  const { caseId } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["tp-case", caseId], queryFn: () => loadCase(caseId) });

  const assign = useMutation({
    mutationFn: async (plannerStaffId: string) => {
      const { error } = await supabase.rpc("tp_assign_case" as any, {
        p_case_id: caseId,
        p_planner_staff_id: plannerStaffId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Planner biriktirildi");
      qc.invalidateQueries({ queryKey: ["tp-case", caseId] });
      qc.invalidateQueries({ queryKey: ["tp-cases-dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkInputRef = React.useRef<HTMLInputElement>(null);
  const slotInputRef = React.useRef<HTMLInputElement>(null);
  const [slotTargetId, setSlotTargetId] = React.useState<string | null>(null);
  const [openPoolFor, setOpenPoolFor] = React.useState<string | null>(null);

  const invalidateCase = () => qc.invalidateQueries({ queryKey: ["tp-case", caseId] });

  const imagesByTypeRef = React.useRef(new Map<string, any>());
  React.useEffect(() => {
    if (data) imagesByTypeRef.current = new Map(data.images.filter((img: any) => img.image_type_id).map((img: any) => [img.image_type_id, img]));
  }, [data]);

  const uploadToPool = useMutation({
    mutationFn: async (files: FileList) => {
      const uploads = await Promise.all(Array.from(files).map((f) => uploadImageFile(caseId, f)));
      const { error } = await (supabase.from("tp_clinical_images" as any) as any).insert(
        uploads.map((u) => ({ case_id: caseId, image_type_id: null, source: "upload", ...u })),
      );
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rasmlar bulutga yuklandi"); invalidateCase(); },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadToSlot = useMutation({
    mutationFn: async ({ file, imageTypeId }: { file: File; imageTypeId: string }) => {
      const upload = await uploadImageFile(caseId, file);
      const existing = imagesByTypeRef.current.get(imageTypeId);
      if (existing) {
        const { error } = await (supabase.from("tp_clinical_images" as any) as any)
          .update({ image_type_id: null })
          .eq("id", existing.id);
        if (error) throw error;
      }
      const { error } = await (supabase.from("tp_clinical_images" as any) as any).insert({
        case_id: caseId, image_type_id: imageTypeId, source: "upload", ...upload,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rasm yuklandi"); invalidateCase(); },
    onError: (e: any) => toast.error(e.message),
  });

  const assignFromPool = useMutation({
    mutationFn: async ({ imageTypeId, poolImageId }: { imageTypeId: string; poolImageId: string }) => {
      const { error } = await supabase.rpc("tp_assign_pool_image" as any, {
        p_case_id: caseId, p_image_type_id: imageTypeId, p_pool_image_id: poolImageId,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bulutdan joyiga qo'yildi"); invalidateCase(); setOpenPoolFor(null); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Yuklanmoqda...</p>;
  }

  const { caseRow, patient, images, imageTypes, findings, audit, planners, plannerName, doctorName } = data;
  const imagesByType = new Map(images.filter((img: any) => img.image_type_id).map((img: any) => [img.image_type_id, img]));
  const poolImages = images.filter((img: any) => !img.image_type_id);
  const categories = ["extraoral", "intraoral", "radiology"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/tp"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{patient?.full_name ?? "Noma'lum bemor"}</h1>
          <p className="text-sm text-muted-foreground">
            2-konsultatsiya: {caseRow.consultation_datetime ? format(new Date(caseRow.consultation_datetime), "dd.MM.yyyy HH:mm") : "—"}
          </p>
        </div>
        <Badge className="text-xs">{caseRow.status}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Case ma'lumotlari</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Doktor:</span> {doctorName ?? "—"}</div>
            <div><span className="text-muted-foreground">Telefon:</span> {patient?.phone ?? "—"}</div>
            <div><span className="text-muted-foreground">Tug'ilgan sana:</span> {patient?.birth_date ?? "—"}</div>
            <div><span className="text-muted-foreground">Deadline:</span> {caseRow.deadline ? format(new Date(caseRow.deadline), "dd.MM.yyyy HH:mm") : "—"}</div>
            <div><span className="text-muted-foreground">Priority:</span> {caseRow.priority}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Mas'ul planner</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">{plannerName ?? <span className="text-muted-foreground">Biriktirilmagan</span>}</div>
            <Select onValueChange={(v) => assign.mutate(v)} disabled={assign.isPending}>
              <SelectTrigger><SelectValue placeholder="Planner tanlash / o'zgartirish" /></SelectTrigger>
              <SelectContent>
                {planners.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Diagnostika progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Progress value={caseRow.images_progress_percent ?? 0} />
            <div className="text-sm text-muted-foreground">{caseRow.images_progress_percent ?? 0}% majburiy rasmlar tayyor</div>
            <Button className="w-full" asChild>
              <Link to="/admin/tp/cases/$caseId/analysis" params={{ caseId }}>TAHLILNI BOSHLASH</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Diagnostik rasmlar</CardTitle>
          <div>
            <input
              ref={bulkInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) uploadToPool.mutate(e.target.files); e.target.value = ""; }}
            />
            <Button size="sm" variant="outline" onClick={() => bulkInputRef.current?.click()} disabled={uploadToPool.isPending}>
              <Cloud className="h-4 w-4 mr-1" /> Hammasini yuklash (bulutga)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={slotInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && slotTargetId) uploadToSlot.mutate({ file, imageTypeId: slotTargetId });
              e.target.value = "";
              setSlotTargetId(null);
            }}
          />

          {categories.map((cat) => {
            const typesInCat = imageTypes.filter((t: any) => t.category === cat);
            if (typesInCat.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <h4 className="text-sm font-semibold">{CATEGORY_LABELS[cat] ?? cat}</h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {typesInCat.map((t: any) => {
                    const img = imagesByType.get(t.id);
                    return (
                      <div key={t.id} className="rounded-md border p-2 space-y-1">
                        <div className="aspect-square rounded bg-muted flex items-center justify-center overflow-hidden relative">
                          {img ? (
                            <ImageThumb img={img} alt={t.label} className="h-full w-full object-cover" />
                          ) : (
                            <ImageOff className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-xs font-medium truncate">{t.label}</div>
                        {t.is_required && !img && <Badge variant="destructive" className="text-[10px]">Majburiy — yo'q</Badge>}
                        {img && <Badge variant="secondary" className="text-[10px]">Bor</Badge>}
                        <div className="flex gap-1 pt-1">
                          <Button
                            size="icon" variant="outline" className="h-7 w-7"
                            title="Kompyuterdan tanlab yuklash"
                            onClick={() => { setSlotTargetId(t.id); slotInputRef.current?.click(); }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                          <Popover open={openPoolFor === t.id} onOpenChange={(o) => setOpenPoolFor(o ? t.id : null)}>
                            <PopoverTrigger asChild>
                              <Button size="icon" variant="outline" className="h-7 w-7" title="Bulutdan tanlash">
                                <Cloud className="h-3.5 w-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                              <p className="text-xs font-medium mb-2">Bulutdan tanlang:</p>
                              {poolImages.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Bulut bo'sh</p>
                              ) : (
                                <div className="grid grid-cols-3 gap-2">
                                  {poolImages.map((p: any) => (
                                    <button
                                      key={p.id}
                                      className="aspect-square rounded border overflow-hidden bg-muted hover:border-primary"
                                      title={p.original_filename ?? ""}
                                      onClick={() => assignFromPool.mutate({ imageTypeId: t.id, poolImageId: p.id })}
                                      disabled={assignFromPool.isPending}
                                    >
                                      <ImageThumb img={p} alt={p.original_filename ?? "bulut"} className="h-full w-full object-cover" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-semibold flex items-center gap-1"><Cloud className="h-4 w-4" /> Bulut ({poolImages.length})</h4>
            {poolImages.length === 0 ? (
              <p className="text-xs text-muted-foreground">Bulutda rasm yo'q — "Hammasini yuklash" orqali qo'shing.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {poolImages.map((p: any) => (
                  <div key={p.id} className="rounded-md border p-1 space-y-1">
                    <div className="aspect-square rounded bg-muted overflow-hidden">
                      <ImageThumb img={p} alt={p.original_filename ?? "bulut"} className="h-full w-full object-cover" />
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{p.original_filename ?? "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Master Problem List</CardTitle></CardHeader>
        <CardContent>
          {findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Hali muammolar aniqlanmagan — Clinical Analysis Wizard'da savollarga javob berilganda
              avtomatik to'ldiriladi.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {findings.map((f: any) => (
                <li key={f.id} className="border-b pb-2 last:border-0">
                  <span className="font-medium">{f.category}:</span> {f.description}
                  {!f.is_confirmed && <Badge variant="outline" className="ml-2 text-[10px]">Tasdiqlanmagan</Badge>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tarix (Audit log)</CardTitle></CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hali harakat yo'q</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {audit.map((a: any) => (
                <li key={a.id} className="flex gap-3">
                  <span className="text-muted-foreground shrink-0">{format(new Date(a.created_at), "dd.MM HH:mm")}</span>
                  <span>{a.action}{a.details ? ` — ${JSON.stringify(a.details)}` : ""}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

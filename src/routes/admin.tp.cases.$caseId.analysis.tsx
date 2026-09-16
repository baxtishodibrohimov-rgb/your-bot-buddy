import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DentalChart } from "@/components/dental-chart";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, ImageOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/tp/cases/$caseId/analysis")({
  component: AnalysisWizard,
});

const CLINICAL_IMAGES_BUCKET = "tp-clinical-images";

// The clinic's confirmed photo-capture order for the wizard — one image per
// step, in exactly this sequence. Anything not in this list (X-rays,
// leftover face_profile_right/left/3-4 view) isn't part of this flow yet.
const WIZARD_ORDER = [
  "intraoral_frontal",
  "intraoral_right_buccal",
  "intraoral_left_buccal",
  "overjet",
  "intraoral_upper_occlusal",
  "intraoral_lower_occlusal",
  "face_frontal",
  "face_frontal_m",
  "face_frontal_smile",
  "face_45_smile",
  "face_profile_90_rest",
  "face_profile_90_m",
  "face_profile_90_smile",
];

// The dental chart is one shared object per case (not a per-photo
// question), shown right under the occlusal photo it was originally
// dictated alongside — see dental-chart.tsx for the click mechanics.
const DENTAL_CHART_AFTER_CODE = "intraoral_lower_occlusal";

async function loadWizard(caseId: string) {
  const [{ data: caseRow }, { data: imageTypes }, { data: templates }, { data: images }, { data: answers }] =
    await Promise.all([
      (supabase.from("tp_cases" as any) as any).select("id, status").eq("id", caseId).single(),
      (supabase.from("tp_image_types" as any) as any).select("*").eq("is_active", true),
      (supabase.from("tp_analysis_templates" as any) as any).select("*").eq("active", true).order("sort_order"),
      (supabase.from("tp_clinical_images" as any) as any).select("*").eq("case_id", caseId).not("image_type_id", "is", null),
      (supabase.from("tp_analysis_answers" as any) as any).select("*").eq("case_id", caseId),
    ]);
  return {
    caseRow,
    imageTypes: imageTypes ?? [],
    templates: templates ?? [],
    images: images ?? [],
    answers: answers ?? [],
  };
}

function StorageThumb({ img, alt }: { img: any; alt: string }) {
  const { data: url } = useQuery({
    queryKey: ["tp-signed-url", img?.storage_path],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(CLINICAL_IMAGES_BUCKET).createSignedUrl(img.storage_path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!img && img.source === "upload" && !!img.storage_path,
    staleTime: 55 * 60 * 1000,
  });
  if (!img) return <ImageOff className="h-8 w-8 text-muted-foreground" />;
  const src = img.source === "upload" ? url : img.external_url;
  if (!src) return <div className="h-full w-full bg-muted" />;
  return <img src={src} alt={alt} className="h-full w-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />;
}

function AnalysisWizard() {
  const { caseId } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["tp-analysis-wizard", caseId], queryFn: () => loadWizard(caseId) });
  const [stepIndex, setStepIndex] = React.useState(0);

  const saveAnswer = useMutation({
    mutationFn: async ({ templateId, existingId, value }: { templateId: string; existingId: string | null; value: string }) => {
      if (existingId) {
        const { error } = await (supabase.from("tp_analysis_answers" as any) as any)
          .update({ answer_value: value, answered_at: new Date().toISOString() })
          .eq("id", existingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("tp_analysis_answers" as any) as any).insert({
          case_id: caseId, template_id: templateId, answer_value: value, answered_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tp-analysis-wizard", caseId] }),
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Yuklanmoqda...</p>;

  const { imageTypes, templates, images, answers } = data;
  const imageTypeByCode = new Map(imageTypes.map((t: any) => [t.code, t]));
  const imagesByType = new Map(images.map((i: any) => [i.image_type_id, i]));
  const templatesByType = new Map<string, any[]>();
  for (const t of templates) {
    if (!t.image_type_id) continue;
    if (!templatesByType.has(t.image_type_id)) templatesByType.set(t.image_type_id, []);
    templatesByType.get(t.image_type_id)!.push(t);
  }
  const answersByTemplate = new Map(answers.map((a: any) => [a.template_id, a]));

  const currentCode = WIZARD_ORDER[stepIndex];
  const currentType = imageTypeByCode.get(currentCode) as any;
  const currentImage = currentType ? imagesByType.get(currentType.id) : null;
  const currentQuestions = currentType ? templatesByType.get(currentType.id) ?? [] : [];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === WIZARD_ORDER.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/tp/cases/$caseId" params={{ caseId }}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinical Analysis Wizard</h1>
          <p className="text-sm text-muted-foreground">Bosqich {stepIndex + 1} / {WIZARD_ORDER.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {WIZARD_ORDER.map((code, idx) => {
          const t = imageTypeByCode.get(code) as any;
          const hasImage = t && imagesByType.has(t.id);
          return (
            <button
              key={code}
              onClick={() => setStepIndex(idx)}
              title={t?.label ?? code}
              className={cn(
                "h-7 min-w-7 px-1.5 rounded text-xs font-medium border flex items-center justify-center",
                idx === stepIndex ? "bg-primary text-primary-foreground border-primary" : "bg-background",
                !hasImage && idx !== stepIndex && "text-muted-foreground border-dashed",
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {currentType?.label ?? currentCode}
            {currentType && <Badge variant="secondary" className="text-[10px]">{currentType.category}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentType ? (
            <p className="text-sm text-muted-foreground">
              Bu rasm turi ("{currentCode}") hali sozlanmagan — migratsiya to'liq qo'llanilmagan bo'lishi mumkin.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-[280px_1fr]">
              <div className="aspect-square rounded bg-muted overflow-hidden flex items-center justify-center">
                <StorageThumb img={currentImage} alt={currentType.label} />
              </div>
              <div className="space-y-4">
                {!currentImage && (
                  <p className="text-sm text-muted-foreground">
                    Bu rasm hali case sahifasida yuklanmagan. Savollarga baribir javob berishingiz mumkin, lekin avval rasmni yuklashni tavsiya qilamiz.
                  </p>
                )}
                {currentQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Bu rasm uchun savol kiritilmagan.</p>
                ) : (
                  currentQuestions.map((q: any) => {
                    const existing = answersByTemplate.get(q.id) as any;
                    const currentValue = existing?.answer_value ?? "";
                    return (
                      <div key={q.id} className="space-y-1">
                        <label className="text-sm font-medium">{q.question}</label>
                        {q.answer_type === "single_choice" ? (
                          <Select
                            value={currentValue}
                            onValueChange={(v) => saveAnswer.mutate({ templateId: q.id, existingId: existing?.id ?? null, value: v })}
                          >
                            <SelectTrigger className="w-full md:w-96"><SelectValue placeholder="Tanlang..." /></SelectTrigger>
                            <SelectContent>
                              {(q.options ?? []).map((opt: string) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            "{q.answer_type}" turi hozircha bu wizardda qo'llab-quvvatlanmaydi.
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {currentCode === DENTAL_CHART_AFTER_CODE && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tish jadvali (FDI)</CardTitle></CardHeader>
          <CardContent><DentalChart caseId={caseId} /></CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={isFirst} onClick={() => setStepIndex((i) => Math.max(0, i - 1))}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Orqaga
        </Button>
        {isLast ? (
          <Button asChild>
            <Link to="/admin/tp/cases/$caseId" params={{ caseId }}>Yakunlash</Link>
          </Button>
        ) : (
          <Button onClick={() => setStepIndex((i) => Math.min(WIZARD_ORDER.length - 1, i + 1))}>
            Keyingisi <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

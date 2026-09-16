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
import { ArrowLeft, ImageOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/tp/cases/$caseId/analysis")({
  component: AnalysisWizard,
});

const CLINICAL_IMAGES_BUCKET = "tp-clinical-images";

// Image type codes after which the interactive dental chart is shown — the
// chart is one shared object per case, not a per-photo question, so it's
// rendered once rather than as a tp_analysis_templates row (see dental-chart.tsx).
const DENTAL_CHART_AFTER_CODE = "intraoral_lower_occlusal";

async function loadWizard(caseId: string) {
  const [{ data: caseRow }, { data: imageTypes }, { data: templates }, { data: images }, { data: answers }] =
    await Promise.all([
      (supabase.from("tp_cases" as any) as any).select("id, status").eq("id", caseId).single(),
      (supabase.from("tp_image_types" as any) as any).select("*").eq("is_active", true).order("sort_order"),
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
    queryKey: ["tp-signed-url", img.storage_path],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(CLINICAL_IMAGES_BUCKET).createSignedUrl(img.storage_path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: img.source === "upload" && !!img.storage_path,
    staleTime: 55 * 60 * 1000,
  });
  const src = img.source === "upload" ? url : img.external_url;
  if (!src) return <div className="h-full w-full bg-muted" />;
  return <img src={src} alt={alt} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />;
}

function AnalysisWizard() {
  const { caseId } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["tp-analysis-wizard", caseId], queryFn: () => loadWizard(caseId) });

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
  const imagesByType = new Map(images.map((i: any) => [i.image_type_id, i]));
  const templatesByType = new Map<string, any[]>();
  for (const t of templates) {
    if (!t.image_type_id) continue;
    if (!templatesByType.has(t.image_type_id)) templatesByType.set(t.image_type_id, []);
    templatesByType.get(t.image_type_id)!.push(t);
  }
  const answersByTemplate = new Map(answers.map((a: any) => [a.template_id, a]));

  const typesWithImage = imageTypes.filter((t: any) => imagesByType.has(t.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/tp/cases/$caseId" params={{ caseId }}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinical Analysis Wizard</h1>
          <p className="text-sm text-muted-foreground">
            Har bir rasm ostidagi savollarga javob bering. Savollar matni klinikaning tasdiqlashi bilan tahrirlanadi.
          </p>
        </div>
      </div>

      {typesWithImage.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Hali biror majburiy rasm biriktirilmagan — avval case sahifasida rasmlarni yuklang.
        </p>
      )}

      {typesWithImage.map((t: any) => {
        const img = imagesByType.get(t.id);
        const qs = templatesByType.get(t.id) ?? [];
        return (
          <React.Fragment key={t.id}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {t.label}
                  <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[200px_1fr]">
                <div className="aspect-square rounded bg-muted overflow-hidden flex items-center justify-center">
                  {img ? <StorageThumb img={img} alt={t.label} /> : <ImageOff className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="space-y-4">
                  {qs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Bu rasm uchun savol kiritilmagan.</p>
                  ) : (
                    qs.map((q: any) => {
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
              </CardContent>
            </Card>
            {t.code === DENTAL_CHART_AFTER_CODE && (
              <Card>
                <CardHeader><CardTitle className="text-base">Tish jadvali (FDI)</CardTitle></CardHeader>
                <CardContent><DentalChart caseId={caseId} /></CardContent>
              </Card>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/media")({
  component: MediaPage,
});

function MediaPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["media_library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_library")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Media kutubxona</h1>
        <p className="text-sm text-muted-foreground">
          Telegram orqali admin/koordinatorlar tomonidan yuklangan fayllar.
          Yuklash bot orqali amalga oshiriladi (rasm/video/hujjat yuborish).
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Yuklanmoqda...</p>}
      {!isLoading && items.length === 0 && (
        <p className="text-muted-foreground">Hozircha media yo'q</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((m: any) => (
          <Card key={m.id}>
            <CardContent className="p-3 space-y-1 text-sm">
              <div className="font-medium">{m.file_type}</div>
              <div className="text-xs text-muted-foreground truncate">{m.file_name ?? m.file_id}</div>
              {m.caption && <div className="text-xs">{m.caption}</div>}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{format(new Date(m.created_at), "dd.MM.yyyy")}</span>
                {m.file_size && <span>{Math.round(m.file_size / 1024)} KB</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import type { FunTitle } from "@/types";

interface FunTitlesProps {
  titles: FunTitle[];
}

export function FunTitles({ titles }: FunTitlesProps) {
  if (titles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {titles.map((title) => (
        <Card key={title.title} className="overflow-hidden">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{title.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gold">{title.title}</div>
                <div className="text-xs text-muted-foreground">{title.description}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg">{title.player_emoji}</span>
                  <span className="font-medium truncate">{title.player_name}</span>
                </div>
                <div className="text-sm font-mono text-foreground/80 mt-1">{title.value}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

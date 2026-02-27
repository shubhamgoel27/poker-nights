import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  totalSessions: number;
  totalPlayers: number;
  totalPot: number;
}

export function StatsCards({ totalSessions, totalPlayers, totalPot }: StatsCardsProps) {
  const stats = [
    { label: "Games Played", value: totalSessions.toString(), icon: "🎴" },
    { label: "Players", value: totalPlayers.toString(), icon: "👥" },
    { label: "Total Money In Play", value: `$${totalPot.toLocaleString()}`, icon: "💰" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { getDb } from "@/lib/db";
import { getPlayerStats, getCumulativeProfits, getDashboardSummary, getFunTitles } from "@/lib/stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";
import { FunTitles } from "@/components/dashboard/fun-titles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const db = getDb();
  const summary = getDashboardSummary(db);
  const playerStats = getPlayerStats(db);
  const cumulativeProfits = getCumulativeProfits(db);
  const funTitles = getFunTitles(db);

  const playerNames = playerStats.map((p) => p.name);

  if (summary.totalSessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="text-6xl">🃏</div>
        <h1 className="text-3xl font-bold text-gold">Welcome to Poker Nights</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Track your home poker games, see who&apos;s winning, and settle up with your friends.
        </p>
        <div className="flex gap-3">
          <Link href="/players">
            <Button variant="outline">Add Players</Button>
          </Link>
          <Link href="/sessions/new">
            <Button>Record First Game</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold text-gold">♠ Dashboard</h1>

      <StatsCards
        totalSessions={summary.totalSessions}
        totalPlayers={summary.totalPlayers}
        totalPot={summary.totalPot}
      />

      {cumulativeProfits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profit Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitChart data={cumulativeProfits} playerNames={playerNames} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaderboardTable stats={playerStats} />
          </CardContent>
        </Card>

        {funTitles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Awards & Titles</h2>
            <FunTitles titles={funTitles} />
          </div>
        )}
      </div>
    </div>
  );
}

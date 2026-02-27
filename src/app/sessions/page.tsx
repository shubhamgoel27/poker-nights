"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SessionSummary } from "@/types";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gold">♥ Sessions</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold">♥ Sessions</h1>
        <Link href="/sessions/new">
          <Button>+ New Game</Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No games recorded yet.</p>
          <Link href="/sessions/new">
            <Button>Record Your First Game</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <Card className="hover:border-gold/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-medium">
                      {new Date(session.date + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.player_count} players &middot; ${session.total_pot?.toFixed(2)} pot
                    </div>
                    {session.notes && (
                      <div className="text-xs text-muted-foreground mt-1">{session.notes}</div>
                    )}
                  </div>
                  <div className="text-right text-sm space-y-1">
                    <div className="text-profit">
                      {session.biggest_winner_emoji} {session.biggest_winner_name}{" "}
                      <span className="font-mono">+${session.biggest_winner_net?.toFixed(2)}</span>
                    </div>
                    <div className="text-loss">
                      {session.biggest_loser_emoji} {session.biggest_loser_name}{" "}
                      <span className="font-mono">${session.biggest_loser_net?.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

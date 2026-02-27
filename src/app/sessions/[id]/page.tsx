"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SessionPlayer, Settlement } from "@/types";

interface SessionDetail {
  id: number;
  date: string;
  notes: string | null;
  players: SessionPlayer[];
  settlements: Settlement[];
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${params.id}`)
      .then((r) => r.json())
      .then(setSession);
  }, [params.id]);

  if (!session) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const totalPot = session.players.reduce((sum, p) => sum + p.buy_in, 0);

  function copySettlements() {
    if (!session) return;
    const text = session.settlements
      .map((s) => `${s.from_emoji} ${s.from_name} pays ${s.to_emoji} ${s.to_name} $${s.amount.toFixed(2)}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function deleteSession() {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    await fetch(`/api/sessions/${session!.id}`, { method: "DELETE" });
    router.push("/sessions");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold">
            {new Date(session.date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h1>
          {session.notes && <p className="text-muted-foreground">{session.notes}</p>}
          <p className="text-sm text-muted-foreground">
            {session.players.length} players &middot; ${totalPot.toFixed(2)} pot
          </p>
        </div>
        <Button variant="ghost" className="text-destructive" onClick={deleteSession}>
          Delete
        </Button>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {session.players.map((p) => (
              <div key={p.player_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.player_emoji}</span>
                  <div>
                    <div className="font-medium">{p.player_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Buy-in: ${p.buy_in.toFixed(2)} &rarr; Cash-out: ${p.cash_out.toFixed(2)}
                    </div>
                  </div>
                </div>
                <span
                  className={`font-mono font-bold text-lg ${
                    p.net > 0 ? "text-profit" : p.net < 0 ? "text-loss" : "text-muted-foreground"
                  }`}
                >
                  {p.net >= 0 ? "+" : ""}${p.net.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settlements */}
      {session.settlements.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Settlements</CardTitle>
            <Button variant="outline" size="sm" onClick={copySettlements}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {session.settlements.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-accent/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.from_emoji}</span>
                    <span className="font-medium">{s.from_name}</span>
                  </div>
                  <div className="text-gold font-mono font-bold">&rarr; ${s.amount.toFixed(2)} &rarr;</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.to_emoji}</span>
                    <span className="font-medium">{s.to_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

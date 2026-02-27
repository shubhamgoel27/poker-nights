"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Player } from "@/types";

interface PlayerEntry {
  player_id: number;
  name: string;
  emoji: string;
  buy_in: string;
  cash_out: string;
}

export default function NewSessionPage() {
  const router = useRouter();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [entries, setEntries] = useState<PlayerEntry[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then(setAllPlayers);
  }, []);

  function togglePlayer(player: Player) {
    const exists = entries.find((e) => e.player_id === player.id);
    if (exists) {
      setEntries(entries.filter((e) => e.player_id !== player.id));
    } else {
      setEntries([...entries, { player_id: player.id, name: player.name, emoji: player.emoji, buy_in: "", cash_out: "" }]);
    }
  }

  function updateEntry(playerId: number, field: "buy_in" | "cash_out", value: string) {
    setEntries(entries.map((e) => (e.player_id === playerId ? { ...e, [field]: value } : e)));
  }

  const totalBuyIn = entries.reduce((sum, e) => sum + (parseFloat(e.buy_in) || 0), 0);
  const totalCashOut = entries.reduce((sum, e) => sum + (parseFloat(e.cash_out) || 0), 0);
  const isBalanced = Math.abs(totalBuyIn - totalCashOut) < 0.01;
  const allFilled = entries.length >= 2 && entries.every((e) => e.buy_in && e.cash_out);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        notes: notes || undefined,
        players: entries.map((e) => ({
          player_id: e.player_id,
          buy_in: parseFloat(e.buy_in),
          cash_out: parseFloat(e.cash_out),
        })),
      }),
    });

    if (res.ok) {
      const { id } = await res.json();
      router.push(`/sessions/${id}`);
    } else {
      const data = await res.json();
      setError(data.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gold">♦ New Game</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Game Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Notes (optional)</label>
              <Input
                placeholder="e.g., Friday night at John's place"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allPlayers.map((player) => {
                const selected = entries.some((e) => e.player_id === player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${
                      selected
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border text-muted-foreground hover:border-gold/50"
                    }`}
                  >
                    <span>{player.emoji}</span>
                    <span>{player.name}</span>
                  </button>
                );
              })}
              {allPlayers.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No players yet. Add players first on the Players page.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buy-ins & Cash-outs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {entries.map((entry) => {
                const net = (parseFloat(entry.cash_out) || 0) - (parseFloat(entry.buy_in) || 0);
                return (
                  <div key={entry.player_id} className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="text-xl">{entry.emoji}</span>
                      <span className="font-medium">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground">Buy-in ($)</label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={entry.buy_in}
                          onChange={(e) => updateEntry(entry.player_id, "buy_in", e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground">Cash-out ($)</label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={entry.cash_out}
                          onChange={(e) => updateEntry(entry.player_id, "cash_out", e.target.value)}
                        />
                      </div>
                      <div className="text-right min-w-[80px] pt-4">
                        <span className={`font-mono font-bold ${net > 0 ? "text-profit" : net < 0 ? "text-loss" : "text-muted-foreground"}`}>
                          {net >= 0 ? "+" : ""}${net.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Total Buy-ins: <span className="font-mono">${totalBuyIn.toFixed(2)}</span>
                  {" | "}
                  Total Cash-outs: <span className="font-mono">${totalCashOut.toFixed(2)}</span>
                </div>
                <div>
                  {allFilled && (
                    <span className={`text-sm font-medium ${isBalanced ? "text-profit" : "text-loss"}`}>
                      {isBalanced ? "Pot is balanced" : `Off by $${Math.abs(totalBuyIn - totalCashOut).toFixed(2)}`}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={!allFilled || !isBalanced || submitting}>
          {submitting ? "Saving..." : "Save Game & Calculate Settlements"}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Player } from "@/types";

const EMOJI_OPTIONS = ["🃏", "😎", "🤑", "🎰", "🦈", "🐋", "🔥", "💎", "👑", "🎲", "🍀", "⭐"];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🃏");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const res = await fetch("/api/players");
    setPlayers(await res.json());
  }

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji }),
    });

    if (res.ok) {
      setName("");
      fetchPlayers();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  }

  async function deletePlayer(id: number) {
    const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchPlayers();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gold">♣ Players</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Player</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addPlayer} className="flex gap-3 items-end flex-wrap">
            <div className="flex gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-1 rounded transition-all ${
                    emoji === e ? "bg-accent scale-110" : "opacity-50 hover:opacity-100"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <Input
                placeholder="Player name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!name.trim()}>
                Add
              </Button>
            </div>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {players.map((player) => (
          <Card key={player.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{player.emoji}</span>
              <span className="font-medium">{player.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => deletePlayer(player.id)}
            >
              Remove
            </Button>
          </Card>
        ))}
        {players.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No players yet. Add your first player above!
          </p>
        )}
      </div>
    </div>
  );
}

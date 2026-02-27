import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { CreateSessionInput } from "@/types";

export async function GET() {
  const db = getDb();

  const sessions = db
    .prepare(
      `SELECT s.id, s.date, s.notes,
              COUNT(sp.id) as player_count,
              SUM(sp.buy_in) as total_pot
       FROM sessions s
       LEFT JOIN session_players sp ON s.id = sp.session_id
       GROUP BY s.id
       ORDER BY s.date DESC, s.id DESC`
    )
    .all() as Array<{
    id: number;
    date: string;
    notes: string | null;
    player_count: number;
    total_pot: number;
  }>;

  const result = sessions.map((s) => {
    const players = db
      .prepare(
        `SELECT p.name, p.emoji, (sp.cash_out - sp.buy_in) as net
         FROM session_players sp
         JOIN players p ON sp.player_id = p.id
         WHERE sp.session_id = ?
         ORDER BY net DESC`
      )
      .all(s.id) as Array<{ name: string; emoji: string; net: number }>;

    const biggest_winner = players[0] || { name: "-", emoji: "", net: 0 };
    const biggest_loser = players[players.length - 1] || { name: "-", emoji: "", net: 0 };

    return {
      ...s,
      biggest_winner_name: biggest_winner.name,
      biggest_winner_emoji: biggest_winner.emoji,
      biggest_winner_net: biggest_winner.net,
      biggest_loser_name: biggest_loser.name,
      biggest_loser_emoji: biggest_loser.emoji,
      biggest_loser_net: biggest_loser.net,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const db = getDb();
  const body: CreateSessionInput = await request.json();

  if (!body.players || body.players.length < 2) {
    return NextResponse.json({ error: "Need at least 2 players" }, { status: 400 });
  }

  const totalBuyIn = body.players.reduce((sum, p) => sum + p.buy_in, 0);
  const totalCashOut = body.players.reduce((sum, p) => sum + p.cash_out, 0);

  if (Math.abs(totalBuyIn - totalCashOut) > 0.01) {
    return NextResponse.json(
      {
        error: `Pot doesn't balance: buy-ins ($${totalBuyIn.toFixed(2)}) != cash-outs ($${totalCashOut.toFixed(2)})`,
      },
      { status: 400 }
    );
  }

  if (body.players.some((p) => p.buy_in < 0 || p.cash_out < 0)) {
    return NextResponse.json({ error: "Amounts cannot be negative" }, { status: 400 });
  }

  const insertSession = db.prepare("INSERT INTO sessions (date, notes) VALUES (?, ?)");
  const insertPlayer = db.prepare(
    "INSERT INTO session_players (session_id, player_id, buy_in, cash_out) VALUES (?, ?, ?, ?)"
  );

  const createSession = db.transaction((data: CreateSessionInput) => {
    const result = insertSession.run(data.date, data.notes || null);
    const sessionId = result.lastInsertRowid;
    for (const p of data.players) {
      insertPlayer.run(sessionId, p.player_id, p.buy_in, p.cash_out);
    }
    return sessionId;
  });

  const sessionId = createSession(body);
  return NextResponse.json({ id: sessionId }, { status: 201 });
}

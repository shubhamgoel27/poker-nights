import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { CreateSessionInput } from "@/types";

export async function GET() {
  const db = getDb();

  const sessionsResult = await db.execute(
    `SELECT s.id, s.date, s.notes,
            COUNT(sp.id) as player_count,
            SUM(sp.buy_in) as total_pot
     FROM sessions s
     LEFT JOIN session_players sp ON s.id = sp.session_id
     GROUP BY s.id
     ORDER BY s.date DESC, s.id DESC`
  );

  const result = [];
  for (const s of sessionsResult.rows) {
    const playersResult = await db.execute({
      sql: `SELECT p.name, p.emoji, (sp.cash_out - sp.buy_in) as net
            FROM session_players sp
            JOIN players p ON sp.player_id = p.id
            WHERE sp.session_id = ?
            ORDER BY net DESC`,
      args: [s.id],
    });

    const players = playersResult.rows;
    const biggest_winner = players[0] || { name: "-", emoji: "", net: 0 };
    const biggest_loser = players[players.length - 1] || { name: "-", emoji: "", net: 0 };

    result.push({
      id: s.id,
      date: s.date,
      notes: s.notes,
      player_count: Number(s.player_count),
      total_pot: Number(s.total_pot),
      biggest_winner_name: biggest_winner.name,
      biggest_winner_emoji: biggest_winner.emoji,
      biggest_winner_net: Number(biggest_winner.net),
      biggest_loser_name: biggest_loser.name,
      biggest_loser_emoji: biggest_loser.emoji,
      biggest_loser_net: Number(biggest_loser.net),
    });
  }

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
      { error: `Pot doesn't balance: buy-ins ($${totalBuyIn.toFixed(2)}) != cash-outs ($${totalCashOut.toFixed(2)})` },
      { status: 400 }
    );
  }

  if (body.players.some((p) => p.buy_in < 0 || p.cash_out < 0)) {
    return NextResponse.json({ error: "Amounts cannot be negative" }, { status: 400 });
  }

  const tx = await db.transaction("write");
  try {
    const sessionResult = await tx.execute({
      sql: "INSERT INTO sessions (date, notes) VALUES (?, ?)",
      args: [body.date, body.notes || null],
    });
    const sessionId = Number(sessionResult.lastInsertRowid);

    for (const p of body.players) {
      await tx.execute({
        sql: "INSERT INTO session_players (session_id, player_id, buy_in, cash_out) VALUES (?, ?, ?, ?)",
        args: [sessionId, p.player_id, p.buy_in, p.cash_out],
      });
    }

    await tx.commit();
    return NextResponse.json({ id: sessionId }, { status: 201 });
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

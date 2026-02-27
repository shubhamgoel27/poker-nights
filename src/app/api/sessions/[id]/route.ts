import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { computeSettlements } from "@/lib/settlements";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;

  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(Number(id)) as {
    id: number;
    date: string;
    notes: string | null;
  } | undefined;

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const players = db
    .prepare(
      `SELECT sp.*, p.name as player_name, p.emoji as player_emoji,
              (sp.cash_out - sp.buy_in) as net
       FROM session_players sp
       JOIN players p ON sp.player_id = p.id
       WHERE sp.session_id = ?
       ORDER BY net DESC`
    )
    .all(Number(id)) as Array<{
    id: number;
    session_id: number;
    player_id: number;
    player_name: string;
    player_emoji: string;
    buy_in: number;
    cash_out: number;
    net: number;
  }>;

  const settlements = computeSettlements(players);

  return NextResponse.json({ ...session, players, settlements });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  db.prepare("DELETE FROM sessions WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}

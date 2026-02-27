import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { computeSettlements } from "@/lib/settlements";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;

  const sessionResult = await db.execute({ sql: "SELECT * FROM sessions WHERE id = ?", args: [Number(id)] });

  if (sessionResult.rows.length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = sessionResult.rows[0];

  const playersResult = await db.execute({
    sql: `SELECT sp.*, p.name as player_name, p.emoji as player_emoji,
                 (sp.cash_out - sp.buy_in) as net
          FROM session_players sp
          JOIN players p ON sp.player_id = p.id
          WHERE sp.session_id = ?
          ORDER BY net DESC`,
    args: [Number(id)],
  });

  const players = playersResult.rows.map((r) => ({
    id: r.id,
    session_id: r.session_id,
    player_id: r.player_id,
    player_name: String(r.player_name),
    player_emoji: String(r.player_emoji),
    buy_in: Number(r.buy_in),
    cash_out: Number(r.cash_out),
    net: Number(r.net),
  }));

  const settlements = computeSettlements(players);

  return NextResponse.json({ ...session, players, settlements });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  await db.execute({ sql: "DELETE FROM sessions WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ success: true });
}

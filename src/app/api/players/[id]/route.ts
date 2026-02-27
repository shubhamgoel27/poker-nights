import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;

  const hasGames = await db.execute({
    sql: "SELECT COUNT(*) as count FROM session_players WHERE player_id = ?",
    args: [Number(id)],
  });

  if (Number(hasGames.rows[0]?.count) > 0) {
    return NextResponse.json(
      { error: "Cannot delete a player who has participated in sessions" },
      { status: 409 }
    );
  }

  await db.execute({ sql: "DELETE FROM players WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ success: true });
}

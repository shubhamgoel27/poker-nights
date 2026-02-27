import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;

  const hasGames = db
    .prepare("SELECT COUNT(*) as count FROM session_players WHERE player_id = ?")
    .get(Number(id)) as { count: number };

  if (hasGames.count > 0) {
    return NextResponse.json(
      { error: "Cannot delete a player who has participated in sessions" },
      { status: 409 }
    );
  }

  db.prepare("DELETE FROM players WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}

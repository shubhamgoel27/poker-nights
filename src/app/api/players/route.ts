import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const result = await db.execute("SELECT * FROM players ORDER BY name");
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const db = getDb();
  const { name, emoji } = await request.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const result = await db.execute({
      sql: "INSERT INTO players (name, emoji) VALUES (?, ?)",
      args: [name.trim(), emoji || "🃏"],
    });

    const player = await db.execute({ sql: "SELECT * FROM players WHERE id = ?", args: [Number(result.lastInsertRowid)] });
    return NextResponse.json(player.rows[0], { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Player already exists" }, { status: 409 });
    }
    throw e;
  }
}

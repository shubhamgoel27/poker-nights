import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const players = db.prepare("SELECT * FROM players ORDER BY name").all();
  return NextResponse.json(players);
}

export async function POST(request: Request) {
  const db = getDb();
  const { name, emoji } = await request.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const result = db
      .prepare("INSERT INTO players (name, emoji) VALUES (?, ?)")
      .run(name.trim(), emoji || "🃏");

    const player = db.prepare("SELECT * FROM players WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(player, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Player already exists" }, { status: 409 });
    }
    throw e;
  }
}

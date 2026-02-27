import { NextResponse } from "next/server";
import { initSchema } from "@/lib/db";

export async function POST() {
  await initSchema();
  return NextResponse.json({ success: true });
}

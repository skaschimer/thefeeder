import { NextResponse } from "next/server";

/**
 * Lightweight liveness check for Docker/ Kubernetes.
 * Returns 200 as soon as the process is listening. No DB or Redis.
 */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

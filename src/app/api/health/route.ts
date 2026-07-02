import { NextResponse } from 'next/server'

// Lightweight health check that also keeps the Supabase project active.
// Supabase free tier pauses a project after ~7 days with no requests; a scheduled
// ping to this route reaches the DB and counts as activity.
//
// Design: we hit the PostgREST table endpoint directly. ANY HTTP response
// (200, 401 permission-denied, 404, etc.) proves the database + API are online.
// Only a network-level failure/timeout means the project is paused/unreachable.
export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const start = Date.now()

  try {
    const res = await fetch(`${url}/rest/v1/seed_qualities?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    })
    const latencyMs = Date.now() - start
    // Reaching PostgREST at all = the project is active and the DB is up.
    return NextResponse.json({
      status: 'ok',
      db: 'up',
      httpStatus: res.status,
      latencyMs,
      time: new Date().toISOString(),
    })
  } catch (e) {
    // Network failure / timeout = project paused or unreachable.
    return NextResponse.json({
      status: 'degraded',
      db: 'down',
      message: e instanceof Error ? e.message : 'unknown',
      latencyMs: Date.now() - start,
      hint: 'If this persists, the Supabase project may be paused — resume it in the dashboard.',
    })
  }
}

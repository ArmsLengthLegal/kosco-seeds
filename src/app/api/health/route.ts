import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Lightweight health check that also keeps the Supabase project active.
// Supabase free tier pauses a project after ~7 days with no requests.
// A scheduled ping to this route runs a trivial query, counting as activity.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Trivial read against a public-readable table to register DB activity.
    const start = Date.now()
    const { error } = await supabase
      .from('seed_qualities')
      .select('id', { count: 'exact', head: true })

    const latencyMs = Date.now() - start

    if (error) {
      return NextResponse.json(
        { status: 'degraded', db: 'error', message: error.message, latencyMs },
        { status: 200 } // still 200 so the cron doesn't alarm; body shows degraded
      )
    }

    return NextResponse.json({
      status: 'ok',
      db: 'up',
      latencyMs,
      time: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json(
      { status: 'error', message: e instanceof Error ? e.message : 'unknown' },
      { status: 200 }
    )
  }
}

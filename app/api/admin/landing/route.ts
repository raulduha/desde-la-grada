import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { DEFAULT_LANDING } from '@/types/landing'

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('content')
      .eq('id', 'landing')
      .single()

    return NextResponse.json(data?.content ?? DEFAULT_LANDING)
  } catch {
    return NextResponse.json(DEFAULT_LANDING)
  }
}

export async function PUT(req: Request) {
  try {
    const content = await req.json()

    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({ id: 'landing', content, updated_at: new Date().toISOString() })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

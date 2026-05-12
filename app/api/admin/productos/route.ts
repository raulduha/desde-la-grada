import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/admin-config'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) return null
  return user
}

export async function GET() {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, inventory(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, slug, description, price, category, cover_image, images, is_active, coming_soon, inventory } = body

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .insert({ name, slug, description, price, category, cover_image, images, is_active, coming_soon: coming_soon ?? false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert inventory if provided
  if (inventory && inventory.length > 0) {
    const inventoryRows = inventory
      .filter((i: { size: string; stock: number }) => i.stock > 0)
      .map((i: { size: string; stock: number }) => ({ product_id: product.id, size: i.size, stock: i.stock }))

    if (inventoryRows.length > 0) {
      await supabaseAdmin.from('inventory').insert(inventoryRows)
    }
  }

  return NextResponse.json(product, { status: 201 })
}

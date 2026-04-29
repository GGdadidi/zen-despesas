import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // 🔐 Conecta no banco zen-proprietarios
    const supabase = createClient(
      process.env.SUPABASE_URL_PROPRIETARIOS!,
      process.env.SUPABASE_SERVICE_ROLE_KEY_PROPRIETARIOS!
    )

    // 🔥 MOCK simulando resposta da Stays
    const staysMock = [
      {
        id: 'res_001',
        property_id: 'prop_123',
        total_price: 1200,
        checkin: '2026-05-10',
        checkout: '2026-05-15'
      }
    ]

    // 🔍 Buscar imóveis do banco
    const { data: imoveis, error: erroImoveis } = await supabase
      .from('imoveis')
      .select('id, stays_id')

    if (erroImoveis) throw erroImoveis

    // 🔁 Criar mapa stays_id → imovel_id
    const mapa = Object.fromEntries(
      (imoveis || []).map((i: any) => [i.stays_id, i.id])
    )

    // 🔁 Mapear reservas
    const reservas = staysMock.map((r) => ({
      stays_id: r.id,
      valor: r.total_price,
      data_checkin: r.checkin,
      data_checkout: r.checkout,
      imovel_id: mapa[r.property_id] || null
    }))

    // 💾 Salvar no banco
    const { error } = await supabase
      .from('reservas')
      .upsert(reservas, { onConflict: 'stays_id' })

    if (error) throw error

    return Response.json({
      success: true,
      inseridos: reservas.length
    })

  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
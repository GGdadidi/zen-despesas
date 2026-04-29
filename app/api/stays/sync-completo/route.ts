import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL_PROPRIETARIOS!,
      process.env.SUPABASE_SERVICE_ROLE_KEY_PROPRIETARIOS!
    )

    // 🔌 BUSCAR RESERVAS NA STAYS
    const response = await fetch(
      'https://bsc.stays.com.br/external/v1/booking/reservations?from=2023-01-01&to=2026-12-31&dateType=arrival&limit=100&skip=0',
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              `${process.env.STAYS_LOGIN}:${process.env.STAYS_PASSWORD}`
            ).toString('base64')
        }
      }
    )

    const json = await response.json()

    // ⚠️ STAYS às vezes retorna dentro de "data"
    const reservasStays = json.data || json

    for (const r of reservasStays) {

      // 🧍 PROPRIETÁRIO (simples por enquanto)
      const emailFake = `${r.propertyId}@stays.com`

      const { data: proprietario } = await supabase
        .from('proprietarios')
        .upsert(
          {
            email: emailFake,
            nome: 'Proprietário Stays'
          },
          { onConflict: 'email' }
        )
        .select()
        .single()

      // 🏠 IMÓVEL
      const { data: imovel } = await supabase
        .from('imoveis')
        .upsert(
          {
            nome: r.propertyName || 'Imóvel Stays',
            stays_id: r.propertyId,
            proprietario_id: proprietario.id
          },
          { onConflict: 'stays_id' }
        )
        .select()
        .single()

      // 💾 RESERVA
      await supabase.from('reservas').upsert(
        {
          stays_id: r.id,
          valor: r.totalAmount || 0,
          data_checkin: r.checkInDate,
          data_checkout: r.checkOutDate,
          imovel_id: imovel.id
        },
        { onConflict: 'stays_id' }
      )
    }

    return Response.json({
      success: true,
      total: reservasStays.length
    })

  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
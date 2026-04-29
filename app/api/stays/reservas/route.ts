import { createClient } from '@supabase/supabase-js'

function formatDate(d: Date) {
  return d.toISOString().split('T')[0]
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL_PROPRIETARIOS!,
      process.env.SUPABASE_SERVICE_ROLE_KEY_PROPRIETARIOS!
    )

    const credentials = Buffer.from(
      `${process.env.STAYS_LOGIN}:${process.env.STAYS_PASSWORD}`
    ).toString("base64")

    // 🔥 PERÍODO INTELIGENTE
    const hoje = new Date()

    const inicio = new Date()
    inicio.setMonth(hoje.getMonth() - 12)

    const fim = new Date()
    fim.setMonth(hoje.getMonth() + 3)

    const from = formatDate(inicio)
    const to = formatDate(fim)

    console.log(`📅 Período: ${from} → ${to}`)

    let skip = 0
    const limit = 100
    let totalInseridos = 0

    while (true) {
      console.log(`🔄 Buscando reservas: skip=${skip}`)

      const response = await fetch(
        `https://bsc.stays.com.br/external/v1/booking/reservations?from=${from}&to=${to}&dateType=arrival&limit=${limit}&skip=${skip}`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          }
        }
      )

      const json = await response.json()
      const reservas = json.data || json

      if (!Array.isArray(reservas) || reservas.length === 0) {
        console.log("✅ Fim das reservas")
        break
      }

      for (const r of reservas) {

        const propertyId =
          r._idlisting ||
          r.listingId ||
          r.listing_id

        if (!propertyId) continue

        const { data: imovel } = await supabase
          .from("imoveis")
          .select("id")
          .eq("stays_id", propertyId)
          .maybeSingle()

        if (!imovel) continue

        const valor =
          r.price?._f_total ||
          r.stats?._f_totalPaid ||
          0

        const checkin = r.checkInDate
        const checkout = r.checkOutDate

        const reservaId = r._id || r.id
        if (!reservaId) continue

        const { error } = await supabase
          .from("reservas")
          .upsert(
            {
              stays_id: reservaId,
              valor,
              data_checkin: checkin,
              data_checkout: checkout,
              imovel_id: imovel.id
            },
            { onConflict: "stays_id" }
          )

        if (!error) totalInseridos++
      }

      skip += limit
    }

    return Response.json({
      success: true,
      periodo: { from, to },
      totalInseridos
    })

  } catch (err: any) {
    console.error(err)
    return Response.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
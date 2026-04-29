import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL_PROPRIETARIOS!,
      process.env.SUPABASE_SERVICE_ROLE_KEY_PROPRIETARIOS!
    )

    const { searchParams } = new URL(request.url)

    const proprietarioId = searchParams.get('proprietario_id')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!proprietarioId || !from || !to) {
      return Response.json(
        { error: 'Parâmetros obrigatórios' },
        { status: 400 }
      )
    }

    // 🔥 pega imóveis do proprietário
    const { data: imoveis } = await supabase
      .from('imoveis')
      .select('id')
      .eq('proprietario_id', proprietarioId)

    const ids = imoveis?.map(i => i.id) || []

    if (ids.length === 0) {
      return Response.json([])
    }

    // 🔥 busca reservas
    const { data, error } = await supabase
      .from('reservas')
      .select('valor, data_checkin')
      .in('imovel_id', ids)
      .gte('data_checkin', from)
      .lte('data_checkin', to)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    // 🔥 agrupar por mês
    const mapa: Record<string, number> = {}

    for (const r of data) {
      const mes = r.data_checkin.slice(0, 7) // YYYY-MM

      mapa[mes] = (mapa[mes] || 0) + (r.valor || 0)
    }

    const resultado = Object.entries(mapa)
      .map(([mes, receita]) => ({
        mes,
        receita
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes))

    return Response.json(resultado)

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
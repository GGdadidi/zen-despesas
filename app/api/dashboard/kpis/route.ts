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
        { error: 'Parâmetros obrigatórios: proprietario_id, from, to' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('reservas')
      .select('valor, data_checkin, imovel_id, imoveis!inner(proprietario_id)')
      .eq('imoveis.proprietario_id', proprietarioId)
      .gte('data_checkin', from)
      .lte('data_checkin', to)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const receita_total = data.reduce((acc, r) => acc + (r.valor || 0), 0)

    return Response.json({
      receita_total,
      total_reservas: data.length
    })

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
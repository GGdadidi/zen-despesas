import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL_PROPRIETARIOS!,
      process.env.SUPABASE_SERVICE_ROLE_KEY_PROPRIETARIOS!
    )

    const credentials = Buffer.from(
      `${process.env.STAYS_LOGIN}:${process.env.STAYS_PASSWORD}`
    ).toString("base64")

    let skip = 0
    const limit = 20
    let totalInseridos = 0

    while (true) {
      console.log(`🔄 Buscando página: skip=${skip}`)

      const response = await fetch(
        `https://bsc.stays.com.br/external/v1/content/listings?limit=${limit}&skip=${skip}`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
        }
      )

      const json = await response.json()

      const listings =
        json?.items ||
        json?.data?.items ||
        json?.data ||
        json

      if (!Array.isArray(listings) || listings.length === 0) {
        console.log("✅ Fim da paginação")
        break
      }

      for (const l of listings) {
        const propertyId = l._id || l.id

        const nome =
          l.internalName ||
          l._mstitle?.pt_BR ||
          l.name ||
          "Imóvel Stays"

        if (!propertyId) continue

        const emailFake = `${propertyId}@stays.com`

        const { data: proprietario } = await supabase
          .from("proprietarios")
          .upsert(
            {
              email: emailFake,
              nome: "Proprietário Stays"
            },
            { onConflict: "email" }
          )
          .select()
          .maybeSingle()

        if (!proprietario) continue

        const { error } = await supabase
          .from("imoveis")
          .upsert(
            {
              nome,
              stays_id: propertyId,
              proprietario_id: proprietario.id
            },
            { onConflict: "stays_id" }
          )

        if (error) {
          console.log("❌ erro imóvel:", error)
          continue
        }

        totalInseridos++
      }

      skip += limit
    }

    return Response.json({
      success: true,
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
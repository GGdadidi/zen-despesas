import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    console.log("🚀 Iniciando importação...");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let allListings: any[] = [];
    let skip = 0;
    const limit = 20;

    while (true) {
      console.log(`🔄 Buscando listings: skip=${skip}`);

      const res = await fetch(
        `https://bsc.stays.net/api/v1/content/listings?limit=${limit}&skip=${skip}&status=active`,
        {
          method: "GET",
          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                `${process.env.STAYS_LOGIN}:${process.env.STAYS_PASSWORD}`
              ).toString("base64"),
          },
        }
      );

      console.log("STATUS:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ ERRO NA STAYS:", text);
        throw new Error(`Erro HTTP ${res.status}`);
      }

      const json = await res.json();
      const data = json.items || json || [];

      console.log("📦 Recebidos:", data.length);

      if (!data.length) break;

      allListings.push(...data);

      for (const item of data) {
        await supabase.from("imoveis").upsert({
          id: item.id,
          nome: item.name || "Sem nome",
        });
      }

      skip += limit;
    }

    console.log("✅ TOTAL IMPORTADO:", allListings.length);

    return Response.json({
      success: true,
      total: allListings.length,
    });

  } catch (err: any) {
    console.error("🔥 ERRO FINAL:", err.message);

    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
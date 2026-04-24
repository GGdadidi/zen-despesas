// app/api/stays/route.ts
export async function GET() {
  try {
    // A Stays usa Basic Auth direto — sem etapa de /auth
    const credentials = Buffer.from(
      `${process.env.STAYS_LOGIN}:${process.env.STAYS_PASSWORD}`
    ).toString("base64");

    // Buscar lista de imóveis direto com Basic Auth
    const imoveisRes = await fetch("https://bsc.stays.com.br/external/v1/content/listings", {
      method: "GET",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    if (!imoveisRes.ok) {
      const errorText = await imoveisRes.text();
      return Response.json(
        { 
          error: "Falha ao buscar imóveis", 
          detail: errorText, 
          status: imoveisRes.status 
        },
        { status: 500 }
      );
    }

    const imoveis = await imoveisRes.json();

    return Response.json({ 
      success: true, 
      total: Array.isArray(imoveis) ? imoveis.length : "?", 
      imoveis 
    });

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
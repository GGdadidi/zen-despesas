import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function buscarTodosImoveis(credentials: string) {
  let todos: any[] = [];
  let skip = 0;
  const limit = 20;

  while (true) {
    const res = await fetch(
      `https://bsc.stays.com.br/external/v1/content/listings?limit=${limit}&skip=${skip}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Falha na Stays (skip=${skip}): ${err}`);
    }

    const pagina = await res.json();

    if (!Array.isArray(pagina) || pagina.length === 0) break;

    todos = [...todos, ...pagina];

    if (pagina.length < limit) break; // última página

    skip += limit;
  }

  return todos;
}

export async function GET() {
  try {
    const credentials = Buffer.from(
      `${process.env.STAYS_LOGIN}:${process.env.STAYS_PASSWORD}`
    ).toString("base64");

    const imoveis = await buscarTodosImoveis(credentials);

    const registros = imoveis.map((imovel: any) => ({
      stays_id: imovel._id,
      nome: imovel.internalName || imovel.id || "Sem nome",
    }));

    const { data, error } = await supabase
      .from("imoveis")
      .upsert(registros, { onConflict: "stays_id" })
      .select();

    if (error) {
      return Response.json({ error: "Falha no Supabase", detail: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      sincronizados: data?.length,
      imoveis: data,
    });

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}



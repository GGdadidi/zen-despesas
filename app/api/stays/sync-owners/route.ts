import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STAYS_DOMAIN = "https://bsc.stays.com.br";
const STAYS_LOGIN = process.env.STAYS_LOGIN!;
const STAYS_SENHA = process.env.STAYS_SENHA!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const hoje = new Date();
    // Máximo 1 ano — usa só o ano atual
    const from = `${hoje.getFullYear()}-01-01`;
    const to = hoje.toISOString().split("T")[0];

    const auth = Buffer.from(`${STAYS_LOGIN}:${STAYS_SENHA}`).toString("base64");

    const response = await fetch(
      `${STAYS_DOMAIN}/external/v1/finance/owners?from=${from}&to=${to}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { success: false, error: `Stays API error: ${response.status} - ${text}` },
        { headers: corsHeaders }
      );
    }

    const owners = await response.json();

    if (!Array.isArray(owners)) {
      return NextResponse.json(
        { success: false, error: "Resposta inesperada", raw: owners },
        { headers: corsHeaders }
      );
    }

    const resultados: any[] = [];

    for (const owner of owners) {
      const staysId = owner._id;
      const nome = owner.name;

      if (!staysId || !nome) continue;

      const { error } = await supabase
        .from("proprietarios")
        .upsert({ id: staysId, nome }, { onConflict: "id" });

      resultados.push({
        staysId,
        nome,
        acao: error ? `erro: ${error.message}` : "atualizado",
      });
    }

    return NextResponse.json(
      { success: true, total: owners.length, resultados },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { headers: corsHeaders }
    );
  }
}
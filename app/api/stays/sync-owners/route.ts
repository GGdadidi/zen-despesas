import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STAYS_DOMAIN = "https://bsc.stays.com.br";

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
    const login = process.env.STAYS_LOGIN;
    const senha = process.env.STAYS_SENHA;

    console.log("STAYS_LOGIN:", login);
    console.log("STAYS_SENHA:", senha);

    // Hardcode temporário para testar se o problema é a env var
    const authLogin = login ?? "396ef30e";
    const authSenha = senha ?? "06ce0efa";

    const hoje = new Date();
    const from = `${hoje.getFullYear()}-01-01`;
    const to = hoje.toISOString().split("T")[0];

    const auth = Buffer.from(`${authLogin}:${authSenha}`).toString("base64");

    console.log("Auth base64:", auth);
    console.log("URL:", `${STAYS_DOMAIN}/external/v1/finance/owners?from=${from}&to=${to}`);

    const response = await fetch(
      `${STAYS_DOMAIN}/external/v1/finance/owners?from=${from}&to=${to}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      }
    );

    console.log("Status Stays:", response.status);

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { success: false, error: `Stays API error: ${response.status} - ${text}`, auth_used: authLogin },
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
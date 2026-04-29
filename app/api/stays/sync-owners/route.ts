import { NextResponse } from "next/server";

const STAYS_DOMAIN = "https://bsc.stays.com.br";
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
    const authLogin = process.env.STAYS_LOGIN ?? "396ef30e";
    const authSenha = process.env.STAYS_SENHA ?? "06ce0efa";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const hoje = new Date();
    const from = `${hoje.getFullYear()}-01-01`;
    const to = hoje.toISOString().split("T")[0];

    const auth = Buffer.from(`${authLogin}:${authSenha}`).toString("base64");

    const staysRes = await fetch(
      `${STAYS_DOMAIN}/external/v1/finance/owners?from=${from}&to=${to}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      }
    );

    if (!staysRes.ok) {
      const text = await staysRes.text();
      return NextResponse.json(
        { success: false, error: `Stays API error: ${staysRes.status} - ${text}` },
        { headers: corsHeaders }
      );
    }

    const owners = await staysRes.json();
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

      // Usa fetch direto para a API REST do Supabase com service role key
      const res = await fetch(
        `${supabaseUrl}/rest/v1/proprietarios?id=eq.${staysId}`,
        {
          method: "GET",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const existing = await res.json();

      if (existing.length > 0) {
        // Atualiza
        const upRes = await fetch(
          `${supabaseUrl}/rest/v1/proprietarios?id=eq.${staysId}`,
          {
            method: "PATCH",
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ nome }),
          }
        );
        resultados.push({ staysId, nome, acao: upRes.ok ? "atualizado" : `erro: ${upRes.status}` });
      } else {
        // Insere
        const insRes = await fetch(
          `${supabaseUrl}/rest/v1/proprietarios`,
          {
            method: "POST",
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ id: staysId, nome }),
          }
        );
        resultados.push({ staysId, nome, acao: insRes.ok ? "inserido" : `erro: ${insRes.status} - ${await insRes.text()}` });
      }
    }

    return NextResponse.json(
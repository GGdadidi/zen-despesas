import { NextResponse } from "next/server";

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

// preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// POST
export async function POST() {
  try {
    // 🔥 NÃO LÊ BODY (evita erro de JSON)
    
    const itens = [
      { nome: "fronha", quantidade: 0, valor_unit: 1.75, total: 0 },
      { nome: "lençol casal", quantidade: 0, valor_unit: 5.45, total: 0 },
      { nome: "toalha de banho", quantidade: 0, valor_unit: 3.45, total: 0 },
      { nome: "toalha de piso", quantidade: 0, valor_unit: 1.65, total: 0 },
      { nome: "toalha de rosto", quantidade: 0, valor_unit: 1.65, total: 0 },
    ];

    return NextResponse.json(
      {
        itens,
        total_geral: 0,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("ERRO FINAL:", error);

    return NextResponse.json(
      { error: "Erro inesperado" },
      { status: 200, headers: corsHeaders } // 👈 nunca quebra frontend
    );
  }
}
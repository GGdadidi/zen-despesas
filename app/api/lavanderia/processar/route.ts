export const runtime = "nodejs";

import { NextResponse } from "next/server";
import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON || "{}"),
});

const TABELA_PRECOS: Record<string, number> = {
  "fronha": 1.75,
  "lençol casal": 5.45,
  "toalha de banho": 3.45,
  "toalha de piso": 1.65,
  "toalha de rosto": 1.65,
};

function response(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// 🔥 EXTRAÇÃO FINAL CORRETA
function extrairQuantidades(texto: string) {
  const numeros = texto.match(/\d+/g)?.map(Number) || [];

  console.log("TODOS NUMEROS:", numeros);

  // remove lixo (CNPJ, datas, zeros irrelevantes)
  const filtrados = numeros.filter(n => n > 0 && n <= 300);

  console.log("FILTRADOS:", filtrados);

  // pega somente o final onde está a tabela
  const ultimos = filtrados.slice(-20);

  console.log("ULTIMOS:", ultimos);

  // remove duplicados (ex: subtotal 206 repetido)
  const unicos: number[] = [];
  for (const n of ultimos) {
    if (!unicos.includes(n)) {
      unicos.push(n);
    }
  }

  console.log("UNICOS:", unicos);

  // pega somente os 5 primeiros (itens reais)
  const quantidades = unicos.slice(0, 5);

  console.log("QUANTIDADES FINAL:", quantidades);

  return quantidades;
}

export async function POST(req: Request) {
  console.log("🔥 ENTROU NA API OCR");

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return response({ error: "Arquivo inválido" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const [result] = await client.textDetection({
      image: { content: buffer },
    });

    const rawText = result.fullTextAnnotation?.text || "";
    const text = normalizar(rawText);

    console.log("OCR TEXTO:\n", text);

    const quantidades = extrairQuantidades(text);

    const nomes = [
      "fronha",
      "lençol casal",
      "toalha de banho",
      "toalha de piso",
      "toalha de rosto",
    ];

    const itens = nomes.map((nome, index) => {
      const quantidade = quantidades[index] || 0;
      const valor_unit = TABELA_PRECOS[nome];

      return {
        nome,
        quantidade,
        valor_unit,
        total: quantidade * valor_unit,
      };
    });

    const total_geral = itens.reduce((acc, i) => acc + i.total, 0);

    console.log("RESULTADO FINAL:", itens);

    return response({
      itens,
      total_geral,
    });

  } catch (error) {
    console.error("❌ ERRO:", error);
    return response({ error: "Erro interno" }, 500);
  }
}
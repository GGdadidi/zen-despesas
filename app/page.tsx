"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Imovel = {
  id: number;
  nome: string;
};

type Despesa = {
  id: number;
  imovel_id: number;
  descricao: string;
  valor: number;
};

export default function Home() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [imovelSelecionado, setImovelSelecionado] = useState<Imovel | null>(null);

  useEffect(() => {
    fetchImoveis();
  }, []);

  async function fetchImoveis() {
    const { data, error } = await supabase
      .from("imoveis")
      .select("*");

    if (error) {
      console.error("Erro ao buscar imóveis:", error);
      return;
    }

    setImoveis(data ?? []);
  }

  async function fetchDespesas(imovel_id: number) {
    const { data, error } = await supabase
      .from("despesas_imovel")
      .select("*")
      .eq("imovel_id", imovel_id);

    if (error) {
      console.error("Erro ao buscar despesas:", error);
      return;
    }

    setDespesas(data ?? []);
  }

  function selecionarImovel(imovel: Imovel) {
    setImovelSelecionado(imovel);
    fetchDespesas(imovel.id);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🏠 Imóveis</h1>

      {imoveis.length === 0 && <p>Carregando imóveis...</p>}

      {imoveis.map((imovel) => (
        <div
          key={imovel.id}
          onClick={() => selecionarImovel(imovel)}
          style={{
            cursor: "pointer",
            padding: 10,
            marginBottom: 8,
            border: "1px solid #ccc",
            borderRadius: 6,
            background:
              imovelSelecionado?.id === imovel.id ? "#e0f7fa" : "#fff",
          }}
        >
          {imovel.nome}
        </div>
      ))}

      {imovelSelecionado && (
        <>
          <h2 style={{ marginTop: 20 }}>
            💰 Despesas - {imovelSelecionado.nome}
          </h2>

          {despesas.length === 0 && <p>Nenhuma despesa encontrada.</p>}

          {despesas.map((d) => (
            <div
              key={d.id}
              style={{
                padding: 8,
                borderBottom: "1px solid #eee",
              }}
            >
              {d.descricao} — R$ {d.valor}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";

export default function LavanderiaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/lavanderia/processar", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setResultado(data);
    setLoading(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Controle de Lavanderia</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <br /><br />

      <button onClick={handleUpload}>
        Processar imagem
      </button>

      {loading && <p>Processando...</p>}

      {resultado && (
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(resultado, null, 2)}
        </pre>
      )}
    </div>
  );
}
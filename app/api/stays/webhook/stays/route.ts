export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📩 Webhook STAYS recebido:", body);

    return Response.json({ success: true });

  } catch (err: any) {
    console.error("❌ Erro webhook:", err.message);

    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
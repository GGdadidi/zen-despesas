export async function GET() {
  const credentials = Buffer.from(
    `${process.env.STAYS_LOGIN}:${process.env.STAYS_PASSWORD}`
  ).toString("base64");

  const headers = {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
  };

  const endpoints = [
    "/external/v1/booking/reservations",
    "/external/v1/booking/reservation",
    "/external/v1/reservations",
    "/external/v1/booking/bookings",
    "/external/v1/booking",
  ];

  const resultados: any = {};

  for (const ep of endpoints) {
    try {
      const res = await fetch(`https://bsc.stays.com.br${ep}?limit=1&skip=0`, { headers });
      resultados[ep] = {
        status: res.status,
        body: await res.text(),
      };
    } catch (err: any) {
      resultados[ep] = { erro: err.message };
    }
  }

  return Response.json(resultados);
}
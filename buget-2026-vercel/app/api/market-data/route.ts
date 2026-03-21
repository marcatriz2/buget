import { NextResponse } from "next/server";

type FuelSnapshot = {
  average: number;
  pct30d: number;
  omvPrice: number | null;
  petromPrice: number | null;
};

const PEKO_BENZINA_URL = "https://peko.ro/pret-benzina";
const PEKO_MOTORINA_URL = "https://peko.ro/pret-motorina";
const BRENT_URL = "https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?range=2mo&interval=1d";

const FALLBACK_MARKET_DATA = {
  cards: {
    omvBenzina: 8.99,
    omvMotorina: 9.62,
    petromBenzina: 8.94,
    petromMotorina: 9.55,
  },
  weeklyFuelSeries: [
    { week: "S-4", benzina: 8.11, motorina: 8.14 },
    { week: "S-3", benzina: 8.33, motorina: 8.49 },
    { week: "S-2", benzina: 8.55, motorina: 8.84 },
    { week: "S-1", benzina: 8.77, motorina: 9.20 },
    { week: "S-0", benzina: 8.99, motorina: 9.57 },
  ],
  brentSeries: [
    { date: "02-24", close: 80.24 },
    { date: "02-28", close: 81.03 },
    { date: "03-04", close: 80.31 },
    { date: "03-08", close: 79.85 },
    { date: "03-12", close: 81.28 },
    { date: "03-16", close: 80.94 },
    { date: "03-20", close: 82.11 },
  ],
};

function parseNumber(value: string) {
  return Number(value.replace(",", "."));
}

function normalizeText(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ţ/g, "t")
    .replace(/ș/g, "s")
    .replace(/ț/g, "t")
    .toLowerCase();
}

function extractFuelSnapshot(html: string): FuelSnapshot {
  const normalized = normalizeText(html);

  const averageMatch = normalized.match(/pret mediu[\s\S]{0,120}?(\d+[\.,]\d+)\s*lei/i);
  const pctMatch = normalized.match(/([+-]?\d+[\.,]\d+)%\s*fata\s*de\s*acum\s*30\s*de\s*zile/i);

  const omvMatch = normalized.match(/omv[\s\S]{0,260}?(\d+[\.,]\d+)\s*lei/i);
  const petromMatch = normalized.match(/petrom[\s\S]{0,260}?(\d+[\.,]\d+)\s*lei/i);

  return {
    average: averageMatch ? parseNumber(averageMatch[1]) : 0,
    pct30d: pctMatch ? parseNumber(pctMatch[1]) : 0,
    omvPrice: omvMatch ? parseNumber(omvMatch[1]) : null,
    petromPrice: petromMatch ? parseNumber(petromMatch[1]) : null,
  };
}

function buildWeeklySeries(label: string, average: number, pct30d: number) {
  const points = 5;
  const start = average / (1 + pct30d / 100);

  return Array.from({ length: points }, (_, index) => {
    const ratio = index / (points - 1);
    const value = start + (average - start) * ratio;

    return {
      week: `S-${points - 1 - index}`,
      label,
      price: Number(value.toFixed(2)),
    };
  });
}

export async function GET() {
  try {
    const [benzinaRes, motorinaRes, brentRes] = await Promise.all([
      fetch(PEKO_BENZINA_URL, { cache: "no-store" }),
      fetch(PEKO_MOTORINA_URL, { cache: "no-store" }),
      fetch(BRENT_URL, { cache: "no-store" }),
    ]);

    if (!benzinaRes.ok || !motorinaRes.ok || !brentRes.ok) {
      throw new Error("Nu s-au putut încărca sursele externe.");
    }

    const [benzinaHtml, motorinaHtml, brentJson] = await Promise.all([
      benzinaRes.text(),
      motorinaRes.text(),
      brentRes.json(),
    ]);

    const benzina = extractFuelSnapshot(benzinaHtml);
    const motorina = extractFuelSnapshot(motorinaHtml);

    if (benzina.average <= 0 || motorina.average <= 0) {
      throw new Error("Nu am putut extrage prețurile carburanților din sursele live.");
    }

    const fuelWeeklyRaw = [
      ...buildWeeklySeries("Benzină", benzina.average, benzina.pct30d),
      ...buildWeeklySeries("Motorină", motorina.average, motorina.pct30d),
    ];

    const fuelWeeklyMap = new Map<string, { week: string; benzina: number; motorina: number }>();

    for (const point of fuelWeeklyRaw) {
      if (!fuelWeeklyMap.has(point.week)) {
        fuelWeeklyMap.set(point.week, { week: point.week, benzina: 0, motorina: 0 });
      }

      const current = fuelWeeklyMap.get(point.week)!;
      if (point.label === "Benzină") current.benzina = point.price;
      if (point.label === "Motorină") current.motorina = point.price;
    }

    const chartResult = brentJson?.chart?.result?.[0];
    const timestamps: number[] = chartResult?.timestamp ?? [];
    const closes: number[] = chartResult?.indicators?.quote?.[0]?.close ?? [];

    const brentSeries = timestamps
      .map((ts, index) => ({
        ts,
        close: closes[index],
      }))
      .filter((item: { close: number | null }) => typeof item.close === "number")
      .slice(-30)
      .map((item: { ts: number; close: number }) => ({
        date: new Date(item.ts * 1000).toISOString().slice(5, 10),
        close: Number(item.close.toFixed(2)),
      }));

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      cards: {
        omvBenzina: benzina.omvPrice ?? benzina.average,
        omvMotorina: motorina.omvPrice ?? motorina.average,
        petromBenzina: benzina.petromPrice ?? benzina.average,
        petromMotorina: motorina.petromPrice ?? motorina.average,
      },
      weeklyFuelSeries: Array.from(fuelWeeklyMap.values()),
      brentSeries,
      sources: {
        benzina: PEKO_BENZINA_URL,
        motorina: PEKO_MOTORINA_URL,
        brent: BRENT_URL,
      },
    });
  } catch (error) {
    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      ...FALLBACK_MARKET_DATA,
      fallback: true,
      error:
        error instanceof Error
          ? error.message
          : "Eroare la actualizarea datelor de piață.",
      sources: {
        benzina: PEKO_BENZINA_URL,
        motorina: PEKO_MOTORINA_URL,
        brent: BRENT_URL,
      },
    });
  }
}

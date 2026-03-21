import { NextResponse } from "next/server";

type WorldBankPoint = { date: string; value: number | null };

type IndicatorConfig = {
  key: "gdpGrowth" | "inflation" | "unemployment" | "debt";
  code: string;
};

const INDICATORS: IndicatorConfig[] = [
  { key: "gdpGrowth", code: "NY.GDP.MKTP.KD.ZG" },
  { key: "inflation", code: "FP.CPI.TOTL.ZG" },
  { key: "unemployment", code: "SL.UEM.TOTL.ZS" },
  { key: "debt", code: "GC.DOD.TOTL.GD.ZS" },
];

const FALLBACK = {
  timeline: [
    { year: "2019", gdpGrowth: 4.2, inflation: 3.8, unemployment: 3.9, debt: 35.2 },
    { year: "2020", gdpGrowth: -3.7, inflation: 2.6, unemployment: 5.0, debt: 46.9 },
    { year: "2021", gdpGrowth: 5.7, inflation: 5.1, unemployment: 5.6, debt: 48.6 },
    { year: "2022", gdpGrowth: 4.0, inflation: 13.8, unemployment: 5.6, debt: 47.3 },
    { year: "2023", gdpGrowth: 2.4, inflation: 10.4, unemployment: 5.6, debt: 48.9 },
    { year: "2024", gdpGrowth: 2.1, inflation: 6.2, unemployment: 5.4, debt: 52.0 },
  ],
  fx: { eurRon: 4.97, usdRon: 4.59 },
};

async function fetchIndicator(code: string): Promise<WorldBankPoint[]> {
  const url = `https://api.worldbank.org/v2/country/ROU/indicator/${code}?format=json&per_page=25`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`World Bank indisponibil pentru ${code}.`);

  const payload = (await response.json()) as [unknown, WorldBankPoint[]];
  const rows = Array.isArray(payload?.[1]) ? payload[1] : [];

  return rows
    .filter((row) => row?.value !== null)
    .map((row) => ({ date: row.date, value: Number(row.value) }));
}

export async function GET() {
  try {
    const [indicatorSeries, fxResponse] = await Promise.all([
      Promise.all(INDICATORS.map((item) => fetchIndicator(item.code))),
      fetch("https://api.frankfurter.app/latest?from=RON&to=EUR,USD", { cache: "no-store" }),
    ]);

    const fxJson = fxResponse.ok ? await fxResponse.json() : null;
    const eurRate = fxJson?.rates?.EUR ? Number((1 / fxJson.rates.EUR).toFixed(4)) : FALLBACK.fx.eurRon;
    const usdRate = fxJson?.rates?.USD ? Number((1 / fxJson.rates.USD).toFixed(4)) : FALLBACK.fx.usdRon;

    const years = Array.from(
      new Set(indicatorSeries.flat().map((row) => row.date))
    )
      .sort((a, b) => Number(a) - Number(b))
      .slice(-8);

    const timeline = years.map((year) => {
      const point: {
        year: string;
        gdpGrowth: number | null;
        inflation: number | null;
        unemployment: number | null;
        debt: number | null;
      } = {
        year,
        gdpGrowth: null,
        inflation: null,
        unemployment: null,
        debt: null,
      };

      INDICATORS.forEach((indicator, idx) => {
        const match = indicatorSeries[idx].find((row) => row.date === year);
        point[indicator.key] = match?.value ?? null;
      });

      return point;
    });

    const latest = [...timeline].reverse().find((row) =>
      row.gdpGrowth !== null || row.inflation !== null || row.unemployment !== null || row.debt !== null
    );

    if (!latest) throw new Error("Nu există valori recente pentru dashboardul macro.");

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      latest,
      timeline,
      fx: { eurRon: eurRate, usdRon: usdRate },
      fallback: false,
      sources: {
        worldBank: "https://api.worldbank.org",
        fx: "https://api.frankfurter.app",
      },
    });
  } catch (error) {
    const latest = FALLBACK.timeline[FALLBACK.timeline.length - 1];
    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      latest,
      timeline: FALLBACK.timeline,
      fx: FALLBACK.fx,
      fallback: true,
      error: error instanceof Error ? error.message : "Eroare la încărcarea dashboardului macro.",
      sources: {
        worldBank: "https://api.worldbank.org",
        fx: "https://api.frankfurter.app",
      },
    });
  }
}

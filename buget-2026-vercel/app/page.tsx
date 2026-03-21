"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  Bitcoin,
  CandlestickChart,
  CircleDollarSign,
  Gauge,
  Landmark,
  Percent,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const fmtBn = (n: number) => `${n.toFixed(1)} mld. lei`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;


type MarketData = {
  updatedAt: string;
  cards: {
    omvBenzina: number;
    omvMotorina: number;
    petromBenzina: number;
    petromMotorina: number;
  };
  weeklyFuelSeries: Array<{ week: string; benzina: number; motorina: number }>;
  brentSeries: Array<{ date: string; close: number }>;
  sources: {
    benzina: string;
    motorina: string;
    brent: string;
  };
  fallback?: boolean;
  error?: string;
};

type MacroData = {
  updatedAt: string;
  latest: {
    year: string;
    gdpGrowth: number | null;
    inflation: number | null;
    unemployment: number | null;
    debt: number | null;
  };
  timeline: Array<{
    year: string;
    gdpGrowth: number | null;
    inflation: number | null;
    unemployment: number | null;
    debt: number | null;
  }>;
  fx: { eurRon: number; usdRon: number };
  fallback?: boolean;
};

type LiveBriefData = {
  updatedAt: string;
  riskTone: "risk-on" | "risk-off" | "neutral";
  cards: {
    sp500: { price: number; changePct: number };
    us10y: { price: number; changePct: number };
    gold: { price: number; changePct: number };
    btc: { price: number; changePct: number };
    eurUsd: { price: number; changePct: number };
    brent: { price: number; changePct: number };
  };
  sources: {
    yahooQuote: string;
  };
  fallback?: boolean;
  error?: string;
};

const BASE = {
  gdp: 2045.186,
  revenues: 736.532,
  deficitPct: 6.2,
  deficitESA: 6.0,
  debtPct: 61.8,
  realGrowth: 1.0,
  inflation: 6.5,
  stateBudgetRevenue: 391.7288,
  stateBudgetExpense: 527.4133,
  stateBudgetDeficit: 135.6845,
};

const baseExpenditure = BASE.revenues + (BASE.gdp * BASE.deficitPct) / 100;
const baseNominalDeficit = (BASE.gdp * BASE.deficitPct) / 100;

function scenarioModel({
  growthShock,
  inflationShock,
  collectionShock,
  interestShock,
}: {
  growthShock: number;
  inflationShock: number;
  collectionShock: number;
  interestShock: number;
}) {
  const g = growthShock / 100;
  const i = inflationShock / 100;
  const c = collectionShock / 100;

  const scenarioGDP = BASE.gdp * (1 + g + i);
  const revenueFactor = 1 + 1.1 * g + 0.95 * i + c;
  const revenues = BASE.revenues * Math.max(0.85, revenueFactor);

  const cyclicalSpend =
    growthShock < 0 ? Math.abs(growthShock) * 1.6 : -growthShock * 0.4;
  const inflationSpend = inflationShock * 1.1;
  const expenditures =
    baseExpenditure + inflationSpend + cyclicalSpend + interestShock;

  const deficitNominal = expenditures - revenues;
  const deficitPct = (deficitNominal / scenarioGDP) * 100;
  const debtPct = BASE.debtPct + (deficitPct - BASE.deficitPct) * 0.65;

  return {
    gdp: scenarioGDP,
    revenues,
    expenditures,
    deficitNominal,
    deficitPct,
    debtPct,
  };
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

function KPIBox({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="kpi-box">
      <div className="kpi-head">
        <div className="kpi-label">{label}</div>
        <Icon className="icon-sm" />
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-note">{note}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <div className="stat-card">
        <div>
          <div className="muted">{title}</div>
          <div className="stat-value">{value}</div>
          <div className="small">{sub}</div>
        </div>
        <div className="icon-wrap">
          <Icon className="icon-sm dark" />
        </div>
      </div>
    </Card>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hint: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="slider-block">
      <div className="slider-head">
        <div>
          <div className="slider-label">{label}</div>
          <div className="small">{hint}</div>
        </div>
        <Badge>{value > 0 ? `+${value}` : value}</Badge>
      </div>
      <input
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function Page() {
  const [growthShock, setGrowthShock] = useState(0);
  const [inflationShock, setInflationShock] = useState(0);
  const [collectionShock, setCollectionShock] = useState(0);
  const [interestShock, setInterestShock] = useState(0);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [macroData, setMacroData] = useState<MacroData | null>(null);
  const [macroError, setMacroError] = useState<string | null>(null);
  const [liveBrief, setLiveBrief] = useState<LiveBriefData | null>(null);
  const [liveBriefError, setLiveBriefError] = useState<string | null>(null);

  const refreshMarketData = async () => {
    try {
      setMarketLoading(true);
      setMarketError(null);
      const response = await fetch("/api/market-data", { cache: "no-store" });
      if (!response.ok) throw new Error("Nu am putut actualiza datele din piață.");
      const data = (await response.json()) as MarketData;
      setMarketData(data);
    } catch (error) {
      setMarketError(error instanceof Error ? error.message : "Eroare la actualizare.");
    } finally {
      setMarketLoading(false);
    }
  };

  const refreshMacroData = async () => {
    try {
      setMacroError(null);
      const response = await fetch("/api/macro-dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Nu am putut actualiza dashboardul macro.");
      const data = (await response.json()) as MacroData;
      setMacroData(data);
    } catch (error) {
      setMacroError(error instanceof Error ? error.message : "Eroare la dashboardul macro.");
    }
  };

  const refreshLiveBrief = async () => {
    try {
      setLiveBriefError(null);
      const response = await fetch("/api/live-brief", { cache: "no-store" });
      if (!response.ok) throw new Error("Nu am putut actualiza pulse-ul de piață.");
      const data = (await response.json()) as LiveBriefData;
      setLiveBrief(data);
    } catch (error) {
      setLiveBriefError(error instanceof Error ? error.message : "Eroare la pulse-ul live.");
    }
  };

  useEffect(() => {
    refreshMarketData();
    refreshMacroData();
    refreshLiveBrief();
  }, []);

  const scenarioPresets = [
    {
      label: "Scenariu de bază",
      values: { growthShock: 0, inflationShock: 0, collectionShock: 0, interestShock: 0 },
    },
    {
      label: "Optimist",
      values: { growthShock: 1.4, inflationShock: -0.4, collectionShock: 1.2, interestShock: -2 },
    },
    {
      label: "Pesimist",
      values: { growthShock: -1.5, inflationShock: 1.1, collectionShock: -1.2, interestShock: 4 },
    },
  ];

  const psdMeasuresScenario = {
    growthShock: 0.2,
    inflationShock: 0.6,
    collectionShock: -0.8,
    interestShock: 4.5,
  };

  const scenario = useMemo(
    () =>
      scenarioModel({
        growthShock,
        inflationShock,
        collectionShock,
        interestShock,
      }),
    [growthShock, inflationShock, collectionShock, interestShock]
  );

  const deltaPct = scenario.deficitPct - BASE.deficitPct;
  const deltaNominal = scenario.deficitNominal - baseNominalDeficit;

  const psdImpact = scenarioModel(psdMeasuresScenario);
  const psdDeltaPct = psdImpact.deficitPct - BASE.deficitPct;

  const psdExtraMeasures = [
    "Creșterea salariului minim, cu efect direct în cheltuielile sectorului public și în costurile contractelor indexate.",
    "Pachet de ajutoare punctuale pentru pensionari cu venituri mici.",
    "Menținerea/extinderea sprijinului social pentru familii vulnerabile (alocații și programe țintite).",
    "Protejarea unor programe de investiții locale și de dezvoltare regională.",
  ];

  const quickScenarios = [
    {
      name: "Accelerare economică",
      subtitle: "Creștere peste ipoteza de bază",
      values: { growthShock: 1.8, inflationShock: -0.3, collectionShock: 0.9, interestShock: -1.5 },
    },
    {
      name: "Inflație persistentă",
      subtitle: "Inflație mai ridicată + costuri mai mari",
      values: { growthShock: -0.5, inflationShock: 1.6, collectionShock: -0.4, interestShock: 2.5 },
    },
    {
      name: "Colectare excelentă",
      subtitle: "ANAF peste plan",
      values: { growthShock: 0.4, inflationShock: 0, collectionShock: 1.8, interestShock: 0 },
    },
    {
      name: "Șoc de dobânzi",
      subtitle: "Piață financiară tensionată",
      values: { growthShock: -0.7, inflationShock: 0.5, collectionShock: -0.8, interestShock: 6 },
    },
    {
      name: "Aterizare lină",
      subtitle: "Mix moderat favorabil",
      values: { growthShock: 0.8, inflationShock: -0.2, collectionShock: 0.7, interestShock: -0.5 },
    },
  ];

  const quickScenarioResults = quickScenarios.map((scenarioItem) => {
    const result = scenarioModel(scenarioItem.values);
    const deficitDelta = result.deficitPct - BASE.deficitPct;
    return {
      ...scenarioItem,
      result,
      deficitDelta,
      tone: deficitDelta <= 0 ? "good" : "bad",
    };
  });

  const impactInfographics = [
    {
      label: "Presiune pe deficit",
      value: scenario.deficitPct,
      base: BASE.deficitPct,
      max: 9,
      unit: "% PIB",
    },
    {
      label: "Presiune pe datorie",
      value: scenario.debtPct,
      base: BASE.debtPct,
      max: 70,
      unit: "% PIB",
    },
    {
      label: "Spațiu fiscal (venituri/cheltuieli)",
      value: (scenario.revenues / scenario.expenditures) * 100,
      base: (BASE.revenues / baseExpenditure) * 100,
      max: 100,
      unit: "%",
    },
  ];

  const macroCards = [
    {
      title: "Creștere economică reală",
      value: macroData?.latest.gdpGrowth,
      unit: "%",
      note: "Ultimul an raportat (World Bank)",
    },
    {
      title: "Inflație medie anuală",
      value: macroData?.latest.inflation,
      unit: "%",
      note: "Indice prețuri de consum",
    },
    {
      title: "Rata șomajului",
      value: macroData?.latest.unemployment,
      unit: "%",
      note: "Forța de muncă totală",
    },
    {
      title: "Datorie guvernamentală",
      value: macroData?.latest.debt,
      unit: "% PIB",
      note: "Datorie publică totală",
    },
  ];

  const cards = [
    {
      title: "Venituri buget de stat",
      value: fmtBn(BASE.stateBudgetRevenue),
      sub: "Nivelul din forma finală a legii bugetului de stat 2026",
      icon: Wallet,
    },
    {
      title: "Cheltuieli buget de stat",
      value: fmtBn(BASE.stateBudgetExpense),
      sub: "Credite bugetare autorizate prin forma finală",
      icon: Landmark,
    },
    {
      title: "Deficit buget de stat",
      value: fmtBn(BASE.stateBudgetDeficit),
      sub: "Deficitul nominal din textul legii",
      icon: AlertTriangle,
    },
    {
      title: "Ipoteze macro de bază",
      value: `${fmtPct(BASE.realGrowth)} creștere / ${fmtPct(BASE.inflation)} inflație`,
      sub: "Potrivit raportului explicativ al MF",
      icon: Scale,
    },
  ];

  const waterfall = [
    { name: "Deficit de bază", impact: baseNominalDeficit },
    {
      name: "Șoc creștere",
      impact:
        -(
          (BASE.revenues * 1.1 * growthShock) / 100 -
          (growthShock < 0 ? Math.abs(growthShock) * 1.6 : -growthShock * 0.4)
        ),
    },
    {
      name: "Șoc inflație",
      impact:
        -(
          (BASE.revenues * 0.95 * inflationShock) / 100 -
          inflationShock * 1.1
        ),
    },
    {
      name: "Șoc colectare",
      impact: -((BASE.revenues * collectionShock) / 100),
    },
    { name: "Șoc dobânzi", impact: interestShock },
  ];

  const sensitivityData = [
    {
      label: "-2 pp",
      deficit: scenarioModel({
        growthShock: -2,
        inflationShock: 0,
        collectionShock: 0,
        interestShock: 0,
      }).deficitPct,
    },
    {
      label: "-1 pp",
      deficit: scenarioModel({
        growthShock: -1,
        inflationShock: 0,
        collectionShock: 0,
        interestShock: 0,
      }).deficitPct,
    },
    {
      label: "Bază",
      deficit: scenarioModel({
        growthShock: 0,
        inflationShock: 0,
        collectionShock: 0,
        interestShock: 0,
      }).deficitPct,
    },
    {
      label: "+1 pp",
      deficit: scenarioModel({
        growthShock: 1,
        inflationShock: 0,
        collectionShock: 0,
        interestShock: 0,
      }).deficitPct,
    },
    {
      label: "+2 pp",
      deficit: scenarioModel({
        growthShock: 2,
        inflationShock: 0,
        collectionShock: 0,
        interestShock: 0,
      }).deficitPct,
    },
  ];

  const fiscalMixData = [
    { label: "Bază", venituri: BASE.revenues, cheltuieli: baseExpenditure },
    { label: "Scenariu", venituri: scenario.revenues, cheltuieli: scenario.expenditures },
  ];

  const trajectoryData = [
    {
      step: "Bază",
      deficitPct: BASE.deficitPct,
      debtPct: BASE.debtPct,
    },
    {
      step: "+ Creștere",
      deficitPct: scenarioModel({ growthShock, inflationShock: 0, collectionShock: 0, interestShock: 0 }).deficitPct,
      debtPct: scenarioModel({ growthShock, inflationShock: 0, collectionShock: 0, interestShock: 0 }).debtPct,
    },
    {
      step: "+ Inflație",
      deficitPct: scenarioModel({ growthShock, inflationShock, collectionShock: 0, interestShock: 0 }).deficitPct,
      debtPct: scenarioModel({ growthShock, inflationShock, collectionShock: 0, interestShock: 0 }).debtPct,
    },
    {
      step: "+ Colectare",
      deficitPct: scenarioModel({ growthShock, inflationShock, collectionShock, interestShock: 0 }).deficitPct,
      debtPct: scenarioModel({ growthShock, inflationShock, collectionShock, interestShock: 0 }).debtPct,
    },
    {
      step: "Final",
      deficitPct: scenario.deficitPct,
      debtPct: scenario.debtPct,
    },
  ];

  const debtToRevenue = (BASE.stateBudgetDeficit / BASE.stateBudgetRevenue) * 100;
  const spendCoverage = (BASE.stateBudgetRevenue / BASE.stateBudgetExpense) * 100;
  const spendingGap = BASE.stateBudgetExpense - BASE.stateBudgetRevenue;

  return (
    <main>
      <section className="hero">
        <div className="hero-overlay" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <Badge>România · Buget de stat 2026 (forma finală)</Badge>
            <h1>
              Bugetul 2026: disciplină fiscală, control central și risc macro
              încă ridicat.
            </h1>
            <p>
              O prezentare publică a principalelor concluzii din forma finală a legii
              bugetului de stat pe 2026, plus un simulator simplificat care
              arată cum se mișcă deficitul dacă se schimbă creșterea, inflația,
              colectarea sau costul dobânzilor.
            </p>
          </div>

          <div className="kpi-grid">
            <KPIBox
              label="Deficit cash"
              value={fmtPct(BASE.deficitPct)}
              note="Ținta macro bugetară pentru 2026"
              icon={Percent}
            />
            <KPIBox
              label="Deficit ESA"
              value={fmtPct(BASE.deficitESA)}
              note="Indicatorul urmărit în consolidarea fiscală"
              icon={BarChart3}
            />
            <KPIBox
              label="Datorie guvernamentală"
              value={fmtPct(BASE.debtPct)}
              note="Estimare la final de 2026"
              icon={Banknote}
            />
            <KPIBox
              label="PIB nominal"
              value={fmtBn(BASE.gdp)}
              note="Baza macro folosită în raportul explicativ"
              icon={Activity}
            />
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <Card className="macro-card">
            <div className="market-header-row">
              <div>
                <div className="eyebrow">Pulse live global (micro + prețuri)</div>
                <h3>Active de risc, dobânzi, aur, BTC, FX și petrol</h3>
              </div>
              <button className="update-btn" type="button" onClick={refreshLiveBrief}>
                Refresh pulse
              </button>
            </div>
            {liveBriefError && <div className="market-error">{liveBriefError}</div>}

            <div className="market-price-grid">
              <div className="market-price-box">
                <div className="small">S&P 500</div>
                <div className="market-value">{liveBrief ? liveBrief.cards.sp500.price.toFixed(2) : "-"}</div>
                <div className={`small ${(liveBrief?.cards.sp500.changePct ?? 0) >= 0 ? "good" : "bad"}`}>
                  {liveBrief ? `${liveBrief.cards.sp500.changePct > 0 ? "+" : ""}${liveBrief.cards.sp500.changePct.toFixed(2)}%` : "-"}
                </div>
              </div>
              <div className="market-price-box">
                <div className="small">US 10Y Yield</div>
                <div className="market-value">{liveBrief ? `${liveBrief.cards.us10y.price.toFixed(2)}%` : "-"}</div>
                <div className={`small ${(liveBrief?.cards.us10y.changePct ?? 0) <= 0 ? "good" : "bad"}`}>
                  {liveBrief ? `${liveBrief.cards.us10y.changePct > 0 ? "+" : ""}${liveBrief.cards.us10y.changePct.toFixed(2)}%` : "-"}
                </div>
              </div>
              <div className="market-price-box">
                <div className="small">Aur (XAUUSD)</div>
                <div className="market-value">{liveBrief ? `${liveBrief.cards.gold.price.toFixed(2)} USD` : "-"}</div>
                <div className={`small ${(liveBrief?.cards.gold.changePct ?? 0) >= 0 ? "good" : "bad"}`}>
                  {liveBrief ? `${liveBrief.cards.gold.changePct > 0 ? "+" : ""}${liveBrief.cards.gold.changePct.toFixed(2)}%` : "-"}
                </div>
              </div>
              <div className="market-price-box">
                <div className="small">BTC-USD</div>
                <div className="market-value">{liveBrief ? `${liveBrief.cards.btc.price.toFixed(0)} USD` : "-"}</div>
                <div className={`small ${(liveBrief?.cards.btc.changePct ?? 0) >= 0 ? "good" : "bad"}`}>
                  {liveBrief ? `${liveBrief.cards.btc.changePct > 0 ? "+" : ""}${liveBrief.cards.btc.changePct.toFixed(2)}%` : "-"}
                </div>
              </div>
            </div>

            <div className="grid-2 market-chart-grid">
              <Card>
                <div className="card-body stack">
                  <div className="info-box">
                    <div className="info-title">Regim de piață</div>
                    <div className={`scenario-value ${liveBrief?.riskTone === "risk-on" ? "good" : liveBrief?.riskTone === "risk-off" ? "bad" : ""}`}>
                      {liveBrief?.riskTone === "risk-on" ? "RISK-ON" : liveBrief?.riskTone === "risk-off" ? "RISK-OFF" : "NEUTRU"}
                    </div>
                    <div className="small">
                      Sintetizat din semnalul acțiuni + dobânzi + petrol + USD. Nu este recomandare de investiții.
                    </div>
                  </div>
                  <div className="info-box">
                    <div className="info-title">EUR/USD</div>
                    <div className="scenario-value">{liveBrief ? liveBrief.cards.eurUsd.price.toFixed(4) : "-"}</div>
                    <div className="small">
                      Variație zi: {liveBrief ? `${liveBrief.cards.eurUsd.changePct > 0 ? "+" : ""}${liveBrief.cards.eurUsd.changePct.toFixed(2)}%` : "-"}
                    </div>
                  </div>
                  <div className="info-box">
                    <div className="info-title">Brent spot futures</div>
                    <div className="scenario-value">{liveBrief ? `${liveBrief.cards.brent.price.toFixed(2)} USD` : "-"}</div>
                    <div className="small">
                      Variație zi: {liveBrief ? `${liveBrief.cards.brent.changePct > 0 ? "+" : ""}${liveBrief.cards.brent.changePct.toFixed(2)}%` : "-"}
                    </div>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="card-body stack">
                  <div className="info-box">
                    <div className="info-title">De ce e relevant pentru buget</div>
                    <div className="small">• Dobânzi mai mari = cost mai mare cu datoria nouă.</div>
                    <div className="small">• Petrolul urcă = presiune pe inflație și transport.</div>
                    <div className="small">• EUR/USD mișcă importurile și costurile energetice.</div>
                    <div className="small">• Risk-off global reduce apetitul pentru piețele emergente.</div>
                  </div>
                  <div className="market-footnote small">
                    Ultima actualizare pulse: {liveBrief ? new Date(liveBrief.updatedAt).toLocaleString("ro-RO") : "-"}.
                    {liveBrief?.fallback ? " Date de rezervă afișate temporar." : ""} Sursă:
                    <a href={liveBrief?.sources.yahooQuote ?? "https://query1.finance.yahoo.com/v7/finance/quote"} target="_blank" rel="noreferrer"> Yahoo Finance Quote API</a>.
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <Card className="market-card">
            <div className="market-header-row">
              <div>
                <div className="eyebrow">Prețuri carburanți & petrol (live)</div>
                <h3>Date curente OMV/Petrom + evoluție ultimele săptămâni</h3>
              </div>
              <button className="update-btn" type="button" onClick={refreshMarketData} disabled={marketLoading}>
                {marketLoading ? "Se actualizează..." : "Update"}
              </button>
            </div>

            {marketError && <div className="market-error">{marketError}</div>}

            <div className="market-price-grid">
              <div className="market-price-box">
                <div className="small">OMV Benzină</div>
                <div className="market-value">{marketData ? `${marketData.cards.omvBenzina.toFixed(2)} lei/L` : "-"}</div>
              </div>
              <div className="market-price-box">
                <div className="small">OMV Motorină</div>
                <div className="market-value">{marketData ? `${marketData.cards.omvMotorina.toFixed(2)} lei/L` : "-"}</div>
              </div>
              <div className="market-price-box">
                <div className="small">Petrom Benzină</div>
                <div className="market-value">{marketData ? `${marketData.cards.petromBenzina.toFixed(2)} lei/L` : "-"}</div>
              </div>
              <div className="market-price-box">
                <div className="small">Petrom Motorină</div>
                <div className="market-value">{marketData ? `${marketData.cards.petromMotorina.toFixed(2)} lei/L` : "-"}</div>
              </div>
            </div>

            <div className="grid-2 market-chart-grid">
              <Card>
                <div className="card-header">
                  <h3>Evoluție combustibili (ultimele săptămâni)</h3>
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={marketData?.weeklyFuelSeries ?? []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} lei/L`, ""]} />
                      <Legend />
                      <Line type="monotone" dataKey="benzina" name="Benzină" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="motorina" name="Motorină" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <div className="card-header">
                  <h3>Preț baril Brent (USD)</h3>
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={marketData?.brentSeries ?? []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} USD`, "Brent"]} />
                      <Line type="monotone" dataKey="close" stroke="#9333ea" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="market-footnote small">
              Ultima actualizare: {marketData ? new Date(marketData.updatedAt).toLocaleString("ro-RO") : "-"}.
              {marketData?.fallback ? " Datele live nu au fost disponibile, se afișează valori de rezervă." : ""} Surse:
              <a href={marketData?.sources.benzina ?? "https://peko.ro/pret-benzina"} target="_blank" rel="noreferrer"> Peko Benzină</a>,
              <a href={marketData?.sources.motorina ?? "https://peko.ro/pret-motorina"} target="_blank" rel="noreferrer"> Peko Motorină</a>,
              <a href={marketData?.sources.brent ?? "https://finance.yahoo.com/quote/BZ=F"} target="_blank" rel="noreferrer"> Yahoo Brent</a>.
            </div>
          </Card>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <Card className="macro-card">
            <div className="market-header-row">
              <div>
                <div className="eyebrow">Dashboard macro live (date externe)</div>
                <h3>Creștere, inflație, șomaj, datorie + curs valutar actualizat</h3>
              </div>
              <button className="update-btn" type="button" onClick={refreshMacroData}>
                Refresh macro
              </button>
            </div>

            {macroError && <div className="market-error">{macroError}</div>}

            <div className="market-price-grid">
              {macroCards.map((item) => (
                <div key={item.title} className="market-price-box">
                  <div className="small">{item.title}</div>
                  <div className="market-value">
                    {item.value !== null && item.value !== undefined
                      ? `${item.value.toFixed(1)} ${item.unit}`
                      : "-"}
                  </div>
                  <div className="small">{item.note}</div>
                </div>
              ))}
            </div>

            <div className="grid-2 market-chart-grid">
              <Card>
                <div className="card-header">
                  <h3>Creștere vs inflație (istoric)</h3>
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={macroData?.timeline ?? []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, ""]} />
                      <Legend />
                      <Line type="monotone" dataKey="gdpGrowth" name="PIB real" stroke="#0f766e" strokeWidth={3} />
                      <Line type="monotone" dataKey="inflation" name="Inflație" stroke="#ea580c" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <div className="card-header">
                  <h3>Șomaj și datorie (% din PIB)</h3>
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={macroData?.timeline ?? []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, ""]} />
                      <Legend />
                      <Bar dataKey="unemployment" name="Șomaj" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="debt" name="Datorie" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="fx-row">
              <div className="info-box">
                <div className="info-title">EUR/RON</div>
                <div className="scenario-value">
                  {macroData ? macroData.fx.eurRon.toFixed(4) : "-"}
                </div>
              </div>
              <div className="info-box">
                <div className="info-title">USD/RON</div>
                <div className="scenario-value">
                  {macroData ? macroData.fx.usdRon.toFixed(4) : "-"}
                </div>
              </div>
            </div>

            <div className="market-footnote small">
              Ultima actualizare macro: {macroData ? new Date(macroData.updatedAt).toLocaleString("ro-RO") : "-"}.
              {macroData?.fallback ? " Date de rezervă afișate temporar." : ""} Surse:
              <a href="https://api.worldbank.org" target="_blank" rel="noreferrer"> World Bank API</a>,
              <a href="https://api.frankfurter.app" target="_blank" rel="noreferrer"> Frankfurter FX</a>.
            </div>
          </Card>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <Card className="pad-lg">
            <div className="eyebrow">Simulări rapide (sus)</div>
            <h2>Scenarii multiple cu impact vizibil imediat</h2>
            <div className="quick-sim-grid">
              {quickScenarioResults.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={`quick-sim-card ${item.tone}`}
                  onClick={() => {
                    setGrowthShock(item.values.growthShock);
                    setInflationShock(item.values.inflationShock);
                    setCollectionShock(item.values.collectionShock);
                    setInterestShock(item.values.interestShock);
                  }}
                >
                  <div className="quick-sim-title">{item.name}</div>
                  <div className="small">{item.subtitle}</div>
                  <div className="quick-sim-value">{fmtPct(item.result.deficitPct)}</div>
                  <div className={`delta ${item.tone}`}>
                    Impact deficit: {item.deficitDelta > 0 ? "+" : ""}
                    {item.deficitDelta.toFixed(2)} pp
                  </div>
                </button>
              ))}
            </div>

            <div className="infographic-grid">
              {impactInfographics.map((metric) => {
                const width = Math.max(6, Math.min(100, (metric.value / metric.max) * 100));
                const delta = metric.value - metric.base;
                return (
                  <div key={metric.label} className="infographic-card">
                    <div className="infographic-head">
                      <span>{metric.label}</span>
                      <strong>
                        {metric.value.toFixed(1)} {metric.unit}
                      </strong>
                    </div>
                    <div className="infographic-track">
                      <div className="infographic-fill" style={{ width: `${width}%` }} />
                    </div>
                    <div className={`delta ${delta <= 0 ? "good" : "bad"}`}>
                      {delta <= 0 ? <TrendingDown className="icon-xs" /> : <TrendingUp className="icon-xs" />}
                      Față de bază: {delta > 0 ? "+" : ""}
                      {delta.toFixed(2)}
                      {metric.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      <section className="section">
        <div className="container grid-4">
          <StatCard
            title="Acoperire venituri/cheltuieli"
            value={`${spendCoverage.toFixed(1)}%`}
            sub="Cât din cheltuieli sunt acoperite din venituri curente"
            icon={Gauge}
          />
          <StatCard
            title="Gol nominal de finanțare"
            value={`${spendingGap.toFixed(1)} mld. lei`}
            sub="Diferența anuală cheltuieli minus venituri"
            icon={CircleDollarSign}
          />
          <StatCard
            title="Deficit / venituri"
            value={`${debtToRevenue.toFixed(1)}%`}
            sub="Ponderea deficitului în veniturile bugetului de stat"
            icon={CandlestickChart}
          />
          <StatCard
            title="Sensibilitate la piețe"
            value={liveBrief?.riskTone === "risk-off" ? "Ridicată" : liveBrief?.riskTone === "risk-on" ? "Moderată" : "Neutră"}
            sub="Indicator calitativ din pulse-ul global live"
            icon={Bitcoin}
          />
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container grid-2-main">
          <Card className="pad-lg">
            <div className="eyebrow">Ideea centrală</div>
            <h2>
              Acest buget nu este un buget al abundenței. Este un buget de
              navigare controlată într-un an dificil.
            </h2>
            <div className="copy">
              <p>
                Statul încearcă simultan să reducă deficitul, să păstreze
                cheltuieli sociale sensibile, să finanțeze apărarea și
                investițiile și să nu piardă fonduri europene sau PNRR.
                Soluția aleasă nu este o mare reformă structurală, ci o
                combinație de control administrativ, flexibilitate juridică și
                presiune pe venituri.
              </p>
              <p>
                Punctul forte al proiectului este capacitatea Ministerului
                Finanțelor de a controla execuția și de a realoca resursele în
                timpul anului. Punctul slab este că baza macro rămâne subțire:
                creștere reală mică, inflație încă ridicată și costuri ale
                datoriei care pot derapa ușor.
              </p>
            </div>
          </Card>

          <Card className="pad-lg">
            <div className="eyebrow">Pe scurt</div>
            <div className="stack">
              <div className="info-box">
                <div className="info-title">Control central mai puternic</div>
                <div className="small">
                  Execuția poate fi dozată lunar prin limite aprobate de
                  Ministerul Finanțelor.
                </div>
              </div>
              <div className="info-box">
                <div className="info-title">Cheltuieli sociale protejate</div>
                <div className="small">
                  Copii, persoane cu handicap, școli și servicii sociale rămân
                  zone sensibile protejate.
                </div>
              </div>
              <div className="info-box">
                <div className="info-title">
                  Apărare și investiții strategice
                </div>
                <div className="small">
                  Există flexibilitate specială pentru contracte multianuale și
                  instrumente de finanțare publică.
                </div>
              </div>
              <div className="info-box">
                <div className="info-title">
                  Consolidare bazată pe venituri
                </div>
                <div className="small">
                  Ajustarea depinde mult de colectare și de sarcină fiscală, nu
                  doar de tăieri de cheltuieli.
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2-main">
          <Card>
            <div className="card-header">
              <h3>Ce face, de fapt, legea</h3>
            </div>
            <div className="card-body stack">
              <div className="info-box">
                <div className="info-title">
                  1. Întărește controlul asupra execuției
                </div>
                <div className="small">
                  Ministerul Finanțelor poate regla ritmul cheltuielilor în
                  timpul anului, ceea ce oferă disciplină, dar și arată că
                  presiunea bugetară este reală.
                </div>
              </div>
              <div className="info-box">
                <div className="info-title">
                  2. Evită lovirea frontală a zonelor sensibile
                </div>
                <div className="small">
                  Bugetul încearcă să mențină protecția politică a cheltuielilor
                  sociale cele mai vizibile și sensibile.
                </div>
              </div>
              <div className="info-box">
                <div className="info-title">
                  3. Lasă loc de manevră pentru realocări
                </div>
                <div className="small">
                  Virările de credite și tratamentul special al fondurilor
                  UE/PNRR fac din acest buget o platformă de ajustare, nu o
                  fotografie rigidă de început de an.
                </div>
              </div>
              <div className="info-box">
                <div className="info-title">
                  4. Acceptă implicit că anul rămâne fragil
                </div>
                <div className="small">
                  Datoria ridicată, deficitul mare și costul finanțării cer o
                  administrare foarte atentă pe parcursul întregului an.
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="card-header">
              <h3>Simulator de deficit</h3>
            </div>
            <div className="card-body stack">
              <div className="alert">
                Model simplificat de sensibilitate, construit pe baza ipotezelor
                oficiale pentru 2026. Arată direcția și ordinul de mărime al
                efectelor, nu o prognoză oficială a Ministerului Finanțelor.
              </div>

              <div className="preset-row">
                {scenarioPresets.map((preset) => (
                  <button
                    key={preset.label}
                    className="preset-btn"
                    type="button"
                    onClick={() => {
                      setGrowthShock(preset.values.growthShock);
                      setInflationShock(preset.values.inflationShock);
                      setCollectionShock(preset.values.collectionShock);
                      setInterestShock(preset.values.interestShock);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  className="preset-btn psd-btn"
                  type="button"
                  onClick={() => {
                    setGrowthShock(psdMeasuresScenario.growthShock);
                    setInflationShock(psdMeasuresScenario.inflationShock);
                    setCollectionShock(psdMeasuresScenario.collectionShock);
                    setInterestShock(psdMeasuresScenario.interestShock);
                  }}
                >
                  Impact măsuri PSD
                </button>
              </div>
              <div className="psd-note">
                Scenariu ilustrativ pentru măsuri solicitate public de PSD. În această calibrare,
                impactul estimat <strong>crește deficitul</strong> cu
                <strong> {psdDeltaPct > 0 ? "+" : ""}{psdDeltaPct.toFixed(2)} pp</strong> față de bază.
              </div>

              <div className="psd-measures-box">
                <div className="info-title">Măsuri suplimentare cerute de PSD (sinteză publică)</div>
                <ul>
                  {psdExtraMeasures.map((measure) => (
                    <li key={measure} className="small">{measure}</li>
                  ))}
                </ul>
              </div>

              <SliderControl
                label="Șoc de creștere reală (pp)"
                value={growthShock}
                min={-2}
                max={2}
                step={0.1}
                hint="Creșterea mai mare ridică veniturile și reduce o parte din presiunea ciclică."
                onChange={setGrowthShock}
              />
              <SliderControl
                label="Șoc de inflație (pp)"
                value={inflationShock}
                min={-3}
                max={3}
                step={0.1}
                hint="Inflația ajută veniturile nominale, dar împinge și cheltuielile în sus."
                onChange={setInflationShock}
              />
              <SliderControl
                label="Șoc de colectare (%)"
                value={collectionShock}
                min={-2}
                max={2}
                step={0.1}
                hint="Măsoară abaterea pozitivă sau negativă față de planul de venituri."
                onChange={setCollectionShock}
              />
              <SliderControl
                label="Șoc de dobânzi (mld. lei)"
                value={interestShock}
                min={-10}
                max={10}
                step={0.5}
                hint="Costurile mai mari de finanțare se transmit aproape direct în deficit."
                onChange={setInterestShock}
              />

              <div className="scenario-grid">
                <div className="scenario-box">
                  <div className="muted">Deficit în scenariu</div>
                  <div className="scenario-value">{fmtPct(scenario.deficitPct)}</div>
                  <div className={deltaPct <= 0 ? "delta good" : "delta bad"}>
                    {deltaPct <= 0 ? (
                      <TrendingDown className="icon-xs" />
                    ) : (
                      <TrendingUp className="icon-xs" />
                    )}
                    {deltaPct > 0 ? "+" : ""}
                    {deltaPct.toFixed(2)} pp față de bază
                  </div>
                </div>
                <div className="scenario-box">
                  <div className="muted">Deficit nominal</div>
                  <div className="scenario-value">{fmtBn(scenario.deficitNominal)}</div>
                  <div className={deltaNominal <= 0 ? "delta good" : "delta bad"}>
                    {deltaNominal > 0 ? "+" : ""}
                    {deltaNominal.toFixed(1)} mld. față de bază
                  </div>
                </div>
                <div className="scenario-box">
                  <div className="muted">Datorie guvernamentală</div>
                  <div className="scenario-value">{fmtPct(scenario.debtPct)}</div>
                  <div className="small">
                    Sensibilitate ilustrativă, nu proiecție oficială de datorie.
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <Card>
            <div className="card-header">
              <h3>Cum reacționează deficitul la creștere</h3>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sensitivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[4.5, 8.5]} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "Deficit"]} />
                  <ReferenceLine y={BASE.deficitPct} stroke="#0f172a" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="deficit" stroke="#334155" fill="#cbd5e1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="card-header">
              <h3>Contribuția șocurilor selectate</h3>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfall}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} mld. lei`, "Impact"]} />
                  <ReferenceLine y={0} stroke="#0f172a" />
                  <Bar dataKey="impact" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <Card>
            <div className="card-header">
              <h3>Venituri vs. cheltuieli: bază vs. scenariu</h3>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fiscalMixData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} mld. lei`, ""]} />
                  <Legend />
                  <Bar dataKey="venituri" fill="#16a34a" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="cheltuieli" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="card-header">
              <h3>Evoluția până la scenariul final</h3>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis yAxisId="left" domain={[4.5, 9]} />
                  <YAxis yAxisId="right" orientation="right" domain={[55, 70]} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "Valoare"]} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="deficitPct" name="Deficit (% PIB)" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="debtPct" name="Datorie (% PIB)" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      <section className="section">
        <div className="container grid-3">
          <Card className="span-2">
            <div className="card-header">
              <h3>Lectură politico-economică</h3>
            </div>
            <div className="card-body grid-2">
              <div className="info-box">
                <div className="info-title">Ce este puternic</div>
                <p className="small">
                  Proiectul încearcă să păstreze investițiile, fondurile UE și
                  apărarea fără să lovească brutal în cele mai sensibile
                  cheltuieli sociale.
                </p>
              </div>
              <div className="info-box">
                <div className="info-title">Ce este fragil</div>
                <p className="small">
                  Întregul echilibru depinde de colectare, disciplină în
                  execuție și de ipoteza că economia slabă nu se deteriorează
                  suplimentar în cursul anului.
                </p>
              </div>
              <div className="info-box">
                <div className="info-title">Ce vor urmări investitorii</div>
                <p className="small">
                  Realizarea veniturilor, derapajul cheltuielilor cu dobânzile,
                  execuția investițiilor cu fonduri UE și orice abatere de la
                  coridorul 6,0% ESA / 6,2% cash.
                </p>
              </div>
              <div className="info-box">
                <div className="info-title">Ce spune despre stat</div>
                <p className="small">
                  Acesta nu este un buget de descentralizare, ci un buget de
                  control: centrul păstrează pârghiile asupra ritmului,
                  alocării și lichidității.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="card-header">
              <h3>Ancore oficiale</h3>
            </div>
            <div className="card-body stack">
              <div className="info-box">
                <div className="info-title">Legea bugetului de stat</div>
                <div className="small">Venituri: 391,7 mld. lei</div>
                <div className="small">Cheltuieli: 527,4 mld. lei</div>
                <div className="small">Deficit: 135,7 mld. lei</div>
              </div>
              <div className="info-box">
                <div className="info-title">Raportul macro explicativ</div>
                <div className="small">PIB: 2.045,2 mld. lei</div>
                <div className="small">Creștere reală: 1,0%</div>
                <div className="small">Inflație medie: 6,5%</div>
                <div className="small">Deficit cash: 6,2% din PIB</div>
                <div className="small">Deficit ESA: 6,0% din PIB</div>
                <div className="small">Datorie: 61,8% din PIB</div>
              </div>
              <div className="info-box">
                <div className="info-title">Interpretare</div>
                <div className="small">Nu este o promisiune de confort fiscal.</div>
                <div className="small">Este un cadru de ajustare controlată.</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="section bottom-pad">
        <div className="container">
          <div className="conclusion">
            <div>
              <div className="eyebrow eyebrow-dark">Concluzie</div>
              <div className="conclusion-title">
                Bugetul României pentru 2026 trebuie citit ca încercarea unui
                stat de a păstra opțiuni strategice, impunând simultan disciplină
                pe o bază macro fragilă.
              </div>
              <div className="conclusion-copy">
                Surprizele bune la creștere sau colectare ajută repede.
                Surprizele rele la dobânzi sau la execuție lovesc la fel de
                repede.
              </div>
            </div>
            <div className="source-box">
              Sursă: forma finală a legii bugetului de stat 2026 și raportul
              explicativ al Ministerului Finanțelor
              <ArrowRight className="icon-xs" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

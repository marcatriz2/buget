"use client";

import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  CandlestickChart,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Landmark,
  LayoutPanelTop,
  Map,
  Percent,
  Scale,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const fmtBn = (n: number) => `${n.toFixed(1)} mld. lei`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

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

function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
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
  icon: ComponentType<{ className?: string }>;
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
  icon: ComponentType<{ className?: string }>;
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

export default function Page() {
  const spendCoverage = (BASE.stateBudgetRevenue / BASE.stateBudgetExpense) * 100;
  const spendingGap = BASE.stateBudgetExpense - BASE.stateBudgetRevenue;
  const debtToRevenue = (BASE.stateBudgetDeficit / BASE.stateBudgetRevenue) * 100;

  const transparentaDataPoints = [
    {
      title: "Coverage funcțional complet",
      text: "Include module pentru Buget Național, Hartă UAT/Județe, Analiza entităților și Grafice personalizate.",
      icon: LayoutPanelTop,
    },
    {
      title: "Filtre de analiză utile în landing",
      text: "Venituri/cheltuieli, an, clasificare funcțională/economică, sursă finanțare, tip raportare, praguri de sumă și populație.",
      icon: Search,
    },
    {
      title: "Exemple gata de demo",
      text: "Sunt deja sugerate entități precum Sibiu, București, Cluj-Napoca și ministere centrale.",
      icon: Map,
    },
    {
      title: "Mesaj de încredere",
      text: "Platforma comunică explicit surse oficiale (MF/ANAF) și include disclaimere de utilizare a datelor.",
      icon: ShieldCheck,
    },
  ];

  const pageAudit = [
    {
      title: "Ce funcționează bine",
      text: "Conținutul este orientat pe utilitate publică și navigare pe date bugetare românești.",
      tone: "good",
    },
    {
      title: "Ce scade conversia",
      text: "Mesajul principal se diluează când sunt prea multe blocuri fără ierarhie clară în primul ecran.",
      tone: "bad",
    },
    {
      title: "Ce trebuie mutat mai sus",
      text: "Use-case-uri clare pentru România: cetățeni, jurnaliști, ONG-uri și administrații locale.",
      tone: "good",
    },
  ] as const;

  const landingStructure = [
    "Hero: promisiunea clară + 3 KPI-uri + CTA principal.",
    "Ce poți analiza: Buget Național, Hartă, Entități, Grafice.",
    "Dovezi de încredere: surse oficiale românești + metodologie + disclaimer.",
    "Use-case-uri pe roluri (RO): jurnalist, cetățean, analist, funcționar public.",
    "Exemple rapide de explorare pe UAT/județ + CTA secundar către demo.",
    "FAQ + footer legal (termeni, privacy, cookie settings).",
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

  return (
    <main>
      <section className="hero">
        <div className="hero-overlay" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <Badge>România · Buget de stat 2026 (forma finală)</Badge>
            <h1>Bugetul 2026: disciplină fiscală și presiune pe execuție.</h1>
            <p>
              O prezentare concentrată exclusiv pe România: indicatorii-cheie ai bugetului de stat,
              implicații de politică publică și structură recomandată pentru un landing de transparență.
            </p>
          </div>

          <div className="kpi-grid">
            <KPIBox label="Deficit cash" value={fmtPct(BASE.deficitPct)} note="Ținta macro bugetară pentru 2026" icon={Percent} />
            <KPIBox label="Deficit ESA" value={fmtPct(BASE.deficitESA)} note="Indicatorul urmărit în consolidarea fiscală" icon={BarChart3} />
            <KPIBox label="Datorie guvernamentală" value={fmtPct(BASE.debtPct)} note="Estimare la final de 2026" icon={Banknote} />
            <KPIBox label="PIB nominal" value={fmtBn(BASE.gdp)} note="Baza macro folosită în raportul explicativ" icon={Activity} />
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container grid-2-main">
          <Card className="pad-lg">
            <div className="eyebrow">Date extrase pentru landing (transparenta.eu)</div>
            <h2>Elemente cu valoare mare de conversie</h2>
            <div className="stack">
              {transparentaDataPoints.map((item) => (
                <div key={item.title} className="info-box">
                  <div className="info-title">
                    <item.icon className="icon-xs" /> {item.title}
                  </div>
                  <div className="small">{item.text}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="pad-lg">
            <div className="eyebrow">Evaluare generală & reorganizare</div>
            <h2>Structură recomandată pentru landing</h2>
            <div className="stack">
              {pageAudit.map((item) => (
                <div key={item.title} className="info-box">
                  <div className="info-title">{item.title}</div>
                  <div className={`delta ${item.tone}`}>
                    {item.tone === "good" ? <CheckCircle2 className="icon-xs" /> : <AlertTriangle className="icon-xs" />}
                    {item.text}
                  </div>
                </div>
              ))}
              <div className="info-box">
                <div className="info-title">Ordinea propusă a secțiunilor</div>
                {landingStructure.map((item) => (
                  <div key={item} className="small">• {item}</div>
                ))}
              </div>
              <div className="info-box">
                <div className="info-title">Surse de referință</div>
                <div className="small">
                  <a href="https://transparenta.eu/" target="_blank" rel="noreferrer">transparenta.eu</a> ·{" "}
                  <a href="https://transparenta.eu/budget-explorer" target="_blank" rel="noreferrer">Budget Explorer</a> ·{" "}
                  <a href="https://transparenta.eu/entity-analytics" target="_blank" rel="noreferrer">Entity Analytics</a> ·{" "}
                  <a href="https://transparenta.eu/map" target="_blank" rel="noreferrer">Map</a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="section">
        <div className="container grid-4">
          <StatCard title="Acoperire venituri/cheltuieli" value={`${spendCoverage.toFixed(1)}%`} sub="Cât din cheltuieli sunt acoperite din venituri curente" icon={Gauge} />
          <StatCard title="Gol nominal de finanțare" value={`${spendingGap.toFixed(1)} mld. lei`} sub="Diferența anuală cheltuieli minus venituri" icon={CircleDollarSign} />
          <StatCard title="Deficit / venituri" value={`${debtToRevenue.toFixed(1)}%`} sub="Ponderea deficitului în veniturile bugetului de stat" icon={CandlestickChart} />
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container grid-2-main">
          <Card className="pad-lg">
            <div className="eyebrow">Ideea centrală</div>
            <h2>Bugetul 2026 este un buget de navigare controlată într-un an dificil.</h2>
            <div className="copy">
              <p>
                Statul încearcă simultan să reducă deficitul, să păstreze cheltuieli sociale sensibile,
                să finanțeze apărarea și investițiile și să nu piardă fonduri europene sau PNRR.
              </p>
              <p>
                Punctul forte este controlul execuției, iar punctul slab rămâne fragilitatea bazei macro
                interne: creștere reală redusă, inflație ridicată și costuri de finanțare sensibile.
              </p>
            </div>
          </Card>

          <Card className="pad-lg">
            <div className="eyebrow">Pe scurt</div>
            <div className="stack">
              <div className="info-box">
                <div className="info-title">Control central mai puternic</div>
                <div className="small">Execuția poate fi dozată lunar prin limite aprobate de Ministerul Finanțelor.</div>
              </div>
              <div className="info-box">
                <div className="info-title">Cheltuieli sociale protejate</div>
                <div className="small">Copii, persoane cu handicap, școli și servicii sociale rămân zone sensibile.</div>
              </div>
              <div className="info-box">
                <div className="info-title">Apărare și investiții strategice</div>
                <div className="small">Există flexibilitate pentru contracte multianuale și instrumente publice de finanțare.</div>
              </div>
              <div className="info-box">
                <div className="info-title">Consolidare bazată pe venituri</div>
                <div className="small">Ajustarea depinde mult de colectare și disciplină fiscală în execuție.</div>
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
                Tot conținutul paginii este acum focalizat exclusiv pe România: bugetul de stat 2026,
                transparență bugetară și structură de comunicare pentru un landing clar.
              </div>
            </div>
            <div className="source-box">
              Sursă: forma finală a legii bugetului de stat 2026, raportul explicativ al Ministerului Finanțelor și transparenta.eu
              <ArrowRight className="icon-xs" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

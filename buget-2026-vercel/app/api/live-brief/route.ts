import { NextResponse } from "next/server";

type QuoteSymbol = "^GSPC" | "^TNX" | "GC=F" | "BTC-USD" | "EURUSD=X" | "BZ=F";

type QuoteRow = {
  symbol: QuoteSymbol;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
};

const QUOTE_URL =
  "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EGSPC,%5ETNX,GC%3DF,BTC-USD,EURUSD%3DX,BZ%3DF";

const FALLBACK = {
  cards: {
    sp500: { price: 5238.15, changePct: 0.34 },
    us10y: { price: 4.18, changePct: -0.42 },
    gold: { price: 2168.4, changePct: 0.56 },
    btc: { price: 83520, changePct: 1.88 },
    eurUsd: { price: 1.0914, changePct: -0.12 },
    brent: { price: 82.11, changePct: 0.74 },
  },
  riskTone: "neutral" as const,
};

function scoreRiskTone(cards: typeof FALLBACK.cards) {
  let score = 0;
  if (cards.sp500.changePct > 0) score += 1;
  if (cards.btc.changePct > 0) score += 1;
  if (cards.us10y.changePct < 0) score += 1;
  if (cards.brent.changePct > 1.2) score -= 1;
  if (cards.gold.changePct > 0.9) score -= 1;

  if (score >= 2) return "risk-on" as const;
  if (score <= -1) return "risk-off" as const;
  return "neutral" as const;
}

function getQuote(rows: QuoteRow[], symbol: QuoteSymbol) {
  return rows.find((row) => row.symbol === symbol);
}

export async function GET() {
  try {
    const response = await fetch(QUOTE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Yahoo quote indisponibil.");

    const data = await response.json();
    const rows: QuoteRow[] = data?.quoteResponse?.result ?? [];

    const sp500 = getQuote(rows, "^GSPC");
    const us10y = getQuote(rows, "^TNX");
    const gold = getQuote(rows, "GC=F");
    const btc = getQuote(rows, "BTC-USD");
    const eurUsd = getQuote(rows, "EURUSD=X");
    const brent = getQuote(rows, "BZ=F");

    if (!sp500 || !us10y || !gold || !btc || !eurUsd || !brent) {
      throw new Error("Set incomplet de cotații live.");
    }

    const cards = {
      sp500: {
        price: Number(sp500.regularMarketPrice?.toFixed(2) ?? FALLBACK.cards.sp500.price),
        changePct: Number(sp500.regularMarketChangePercent?.toFixed(2) ?? FALLBACK.cards.sp500.changePct),
      },
      us10y: {
        price: Number(us10y.regularMarketPrice?.toFixed(2) ?? FALLBACK.cards.us10y.price),
        changePct: Number(us10y.regularMarketChangePercent?.toFixed(2) ?? FALLBACK.cards.us10y.changePct),
      },
      gold: {
        price: Number(gold.regularMarketPrice?.toFixed(2) ?? FALLBACK.cards.gold.price),
        changePct: Number(gold.regularMarketChangePercent?.toFixed(2) ?? FALLBACK.cards.gold.changePct),
      },
      btc: {
        price: Number(btc.regularMarketPrice?.toFixed(2) ?? FALLBACK.cards.btc.price),
        changePct: Number(btc.regularMarketChangePercent?.toFixed(2) ?? FALLBACK.cards.btc.changePct),
      },
      eurUsd: {
        price: Number(eurUsd.regularMarketPrice?.toFixed(4) ?? FALLBACK.cards.eurUsd.price),
        changePct: Number(eurUsd.regularMarketChangePercent?.toFixed(2) ?? FALLBACK.cards.eurUsd.changePct),
      },
      brent: {
        price: Number(brent.regularMarketPrice?.toFixed(2) ?? FALLBACK.cards.brent.price),
        changePct: Number(brent.regularMarketChangePercent?.toFixed(2) ?? FALLBACK.cards.brent.changePct),
      },
    };

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      riskTone: scoreRiskTone(cards),
      cards,
      fallback: false,
      sources: {
        yahooQuote: QUOTE_URL,
      },
    });
  } catch (error) {
    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      riskTone: FALLBACK.riskTone,
      cards: FALLBACK.cards,
      fallback: true,
      error: error instanceof Error ? error.message : "Eroare la pulse-ul live.",
      sources: {
        yahooQuote: QUOTE_URL,
      },
    });
  }
}

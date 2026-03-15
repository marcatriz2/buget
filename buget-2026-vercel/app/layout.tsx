import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bugetul României 2026",
  description:
    "Landing page public despre proiectul bugetului de stat 2026, cu KPI-uri mari și simulator de sensibilitate pentru deficit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}

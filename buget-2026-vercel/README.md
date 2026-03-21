# Buget 2026 Landing Page

Landing page public în limba română pentru analiza proiectului bugetului de stat 2026, cu KPI-uri mari și simulator de sensibilitate pentru deficit.

## Cum îl publici pe Vercel

### Varianta 1: direct din arhivă
1. Descarcă arhiva ZIP.
2. Intră în Vercel.
3. Alege **Add New Project** / **Import**.
4. Încarcă folderul dezarhivat.
5. Vercel va detecta automat proiectul Next.js.
6. Apasă **Deploy**.

### Varianta 2: local
```bash
npm install
npm run dev
```

Apoi deschizi:
```bash
http://localhost:3000
```

## Fișiere principale
- `app/page.tsx` – pagina principală
- `app/layout.tsx` – layout + metadata
- `app/globals.css` – stiluri
- `package.json` – dependențe pentru Vercel/Next.js

## Observație
Simulatorul este un model simplificat de sensibilitate, nu o metodologie oficială a Ministerului Finanțelor.


## Checklist rapid pentru deploy pe Vercel
1. Verifică SHA-ul commitului din GitHub.
2. Verifică în Vercel că deploymentul rulează pe același SHA.
3. Dacă diferă, redeploy pe commitul corect sau fă push pe branchul corect.

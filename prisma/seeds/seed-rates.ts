import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type RateSeed = {
  code: string;
  label: string;
  baseCurrency: string;
  sourceUrl: string;
  sourcePath: string;
};

const OFFICIAL_RATES: RateSeed[] = [
  {
    code: 'USD_BCV',
    label: 'Dolar BCV',
    baseCurrency: 'USD',
    sourceUrl: 'https://ve.dolarapi.com/v1/dolares/oficial',
    sourcePath: 'promedio',
  },
  {
    code: 'EUR_BCV',
    label: 'Euro BCV',
    baseCurrency: 'EUR',
    sourceUrl: 'https://pydolarve.org/api/v1/dollar?page=bcv',
    sourcePath: 'monitors.eur.price',
  },
];

function extractPath(obj: any, path: string): number | null {
  const parts = path.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return null;
    cur = cur[p];
  }
  const num = typeof cur === 'string' ? Number(cur) : cur;
  return Number.isFinite(num) ? Number(num) : null;
}

async function fetchValue(rate: RateSeed): Promise<number | null> {
  try {
    const res = await fetch(rate.sourceUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = await res.json();
    return extractPath(json, rate.sourcePath);
  } catch {
    return null;
  }
}

async function main() {
  console.log('Seeding rates...');

  for (const r of OFFICIAL_RATES) {
    const rate = await prisma.rate.upsert({
      where: { code: r.code },
      create: {
        code: r.code,
        label: r.label,
        baseCurrency: r.baseCurrency,
        sourceUrl: r.sourceUrl,
        sourcePath: r.sourcePath,
        isActive: true,
      },
      update: {
        label: r.label,
        baseCurrency: r.baseCurrency,
        sourceUrl: r.sourceUrl,
        sourcePath: r.sourcePath,
      },
    });

    const value = await fetchValue(r);
    if (value != null) {
      await prisma.rateSnapshot.create({
        data: {
          rateCode: rate.code,
          valueVes: value,
        },
      });
      console.log(`  ${rate.code}: ${value} VES`);
    } else {
      console.log(`  ${rate.code}: fetch fallo, sin snapshot inicial`);
    }
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

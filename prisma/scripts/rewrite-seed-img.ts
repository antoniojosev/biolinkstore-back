/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..', '..')

const SEEDS = [
  { file: 'seed-ropa.ts', brand: 'ropa' },
  { file: 'seed-restaurant.ts', brand: 'restaurant' },
  { file: 'seed-inmuebles.ts', brand: 'inmuebles' },
  { file: 'seed-servicios.ts', brand: 'servicios' },
]

for (const seed of SEEDS) {
  const p = path.join(ROOT, 'prisma', 'seeds', seed.file)
  let src = fs.readFileSync(p, 'utf8')

  const block = src.match(/(const\s+IMG\s*=\s*\{)([\s\S]*?)(\n\};)/)
  if (!block) {
    console.error(`✗ ${seed.file}: IMG block not found`)
    continue
  }
  let body = block[2]
  let replaced = 0

  body = body.replace(
    /^([ \t]*)([A-Za-z_$][\w$]*)(\s*:\s*)(['"`])https:\/\/images\.unsplash\.com\/[^'"`]+\4(\s*,?)/gm,
    (_m, indent, key, sep, quote, comma) => {
      replaced++
      return `${indent}${key}${sep}${quote}/demo-assets/${seed.brand}/${key}.jpg${quote}${comma}`
    },
  )

  const newSrc = src.replace(block[0], `${block[1]}${body}${block[3]}`)
  fs.writeFileSync(p, newSrc)
  console.log(`✓ ${seed.file}: ${replaced} URLs rewritten`)
}

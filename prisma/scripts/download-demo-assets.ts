/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'

interface SeedTarget {
  file: string
  brand: string
}

const ROOT = path.resolve(__dirname, '..', '..')
const PUBLIC_DIR = path.resolve(ROOT, '..', 'frontend', 'public', 'demo-assets')

const SEEDS: SeedTarget[] = [
  { file: 'seed-ropa.ts', brand: 'ropa' },
  { file: 'seed-restaurant.ts', brand: 'restaurant' },
  { file: 'seed-inmuebles.ts', brand: 'inmuebles' },
  { file: 'seed-servicios.ts', brand: 'servicios' },
]

function extractImgMap(source: string): Map<string, string> {
  const imgBlockMatch = source.match(/const\s+IMG\s*=\s*\{([\s\S]*?)\n\};/)
  if (!imgBlockMatch) throw new Error('IMG block not found')
  const body = imgBlockMatch[1]
  const map = new Map<string, string>()
  const lineRe =
    /^[ \t]*([A-Za-z_$][\w$]*)\s*:\s*(['"`])(https:\/\/images\.unsplash\.com\/[^'"`]+)\2\s*,?/gm
  let m: RegExpExecArray | null
  while ((m = lineRe.exec(body)) !== null) {
    map.set(m[1], m[3])
  }
  return map
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const req = https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close()
        fs.unlinkSync(dest)
        download(res.headers.location, dest).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        file.close()
        fs.unlinkSync(dest)
        reject(new Error(`HTTP ${res.statusCode} on ${url}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve()))
    })
    req.on('error', (err) => {
      file.close()
      if (fs.existsSync(dest)) fs.unlinkSync(dest)
      reject(err)
    })
    req.on('timeout', () => {
      req.destroy(new Error('timeout'))
    })
  })
}

async function main() {
  let totalOk = 0
  let totalFail = 0

  for (const seed of SEEDS) {
    const seedPath = path.join(ROOT, 'prisma', 'seeds', seed.file)
    const source = fs.readFileSync(seedPath, 'utf8')
    const imgs = extractImgMap(source)
    const outDir = path.join(PUBLIC_DIR, seed.brand)
    fs.mkdirSync(outDir, { recursive: true })
    console.log(`\n▸ ${seed.brand}: ${imgs.size} images`)

    for (const [key, url] of imgs) {
      const dest = path.join(outDir, `${key}.jpg`)
      if (fs.existsSync(dest) && fs.statSync(dest).size > 1024) {
        console.log(`  = ${key}.jpg (cached)`)
        totalOk++
        continue
      }
      try {
        await download(url, dest)
        const size = fs.statSync(dest).size
        console.log(`  ✓ ${key}.jpg (${Math.round(size / 1024)} KB)`)
        totalOk++
      } catch (err) {
        console.error(`  ✗ ${key}: ${(err as Error).message}`)
        totalFail++
      }
    }
  }

  console.log(`\n─────────────────────────────`)
  console.log(`Done. ok=${totalOk} fail=${totalFail}`)
  console.log(`Output: ${PUBLIC_DIR}`)
  if (totalFail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

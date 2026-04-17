import fs from 'node:fs'
import path from 'node:path'

const distPath = path.resolve(process.cwd(), 'dist')

if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true })
}

fs.mkdirSync(distPath, { recursive: true })
console.log(`Cleaned ${distPath}`)
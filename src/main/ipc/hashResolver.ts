import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { app } from 'electron'
import { parseRed4Archive } from './archiveParser'

let hashDb: Map<string, string> | null = null
let dbLoaded = false

/**
 * Loads the hashes.csv.gz database (hash → resource path).
 * The database is located at resources/hashes.csv.gz next to the app.
 */
export async function loadHashDatabase(): Promise<Map<string, string>> {
  if (dbLoaded && hashDb) return hashDb

  const dbPath = path.join(
    app.isPackaged
      ? process.resourcesPath
      : path.join(app.getAppPath(), 'src', 'main', 'resources'),
    'hashes.csv.gz'
  )

  const map = new Map<string, string>()

  if (!fs.existsSync(dbPath)) {
    dbLoaded = true
    hashDb = map
    return map
  }

  try {
    const compressed = fs.readFileSync(dbPath)
    const decompressed = zlib.gunzipSync(compressed).toString('utf-8')
    const lines = decompressed.split('\n')

    for (const line of lines) {
      const commaIdx = line.indexOf(',')
      if (commaIdx === -1) continue
      const hash = line.slice(0, commaIdx).trim()
      const resourcePath = line.slice(commaIdx + 1).trim()
      if (hash && resourcePath) {
        map.set(hash, resourcePath)
      }
    }
  } catch {
    // DB unavailable — conflict detection will use raw hashes
  }

  dbLoaded = true
  hashDb = map
  return map
}

/**
 * Extracts all FNV1a64 hashes from .archive files in a directory,
 * and resolves them to resource paths when the DB is available.
 * Returns array of hash strings (hex or resolved path).
 */
export async function resolveHashes(modDir: string): Promise<string[]> {
  const db = await loadHashDatabase()
  const hashes: string[] = []

  const archiveFiles = findArchives(modDir)
  for (const archivePath of archiveFiles) {
    const entries = parseRed4Archive(archivePath)
    if (!entries) continue

    for (const entry of entries) {
      const hashStr = entry.hash.toString(16).padStart(16, '0')
      const resolved = db.get(hashStr) ?? hashStr
      hashes.push(resolved)
    }
  }

  return hashes
}

function findArchives(dir: string, depth = 0): string[] {
  if (depth > 4) return []
  const results: string[] = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...findArchives(full, depth + 1))
      } else if (entry.name.endsWith('.archive')) {
        results.push(full)
      }
    }
  } catch { /* ignore */ }
  return results
}

/**
 * Pre-loads the hash database at startup for fast conflict detection.
 */
export async function preloadHashDatabase(): Promise<void> {
  await loadHashDatabase()
}

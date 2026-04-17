import fs from 'fs'
import path from 'path'
import type { ModType } from '../../shared/types'

const RED4_MAGIC = 0x52454434

interface ArchiveFileEntry {
  hash: bigint
}

/**
 * Parses a RED4 .archive file and extracts FNV1a64 hashes of contained resources.
 */
export function parseRed4Archive(
  archivePath: string
): ArchiveFileEntry[] | null {
  let fd: number | null = null
  try {
    fd = fs.openSync(archivePath, 'r')

    // Read main header (40 bytes minimum)
    const header = Buffer.alloc(40)
    fs.readSync(fd, header, 0, 40, 0)

    const magic = header.readUInt32LE(0)
    if (magic !== RED4_MAGIC) return null

    // IndexPosition is at offset 8, stored as int64 LE
    const indexPos = Number(header.readBigInt64LE(8))
    if (indexPos <= 0 || indexPos > 1_000_000_000) return null

    // Read index header (20 bytes): fileTableOffset(4) + fileTableSize(4) + crc(8) + fileCount(4)
    const indexHeader = Buffer.alloc(20)
    fs.readSync(fd, indexHeader, 0, 20, indexPos)

    const fileCount = indexHeader.readUInt32LE(16)
    if (fileCount === 0 || fileCount > 200_000) return null

    // Each file entry is 40 bytes
    // Offset 0-3: nameHash low (uint32)
    // Offset 4-7: nameHash high (uint32) — together form the 64-bit FNV hash
    const entrySize = 40
    const entriesBuf = Buffer.alloc(fileCount * entrySize)
    fs.readSync(fd, entriesBuf, 0, fileCount * entrySize, indexPos + 20)

    const entries: ArchiveFileEntry[] = []
    for (let i = 0; i < fileCount; i++) {
      const off = i * entrySize
      const low = BigInt(entriesBuf.readUInt32LE(off))
      const high = BigInt(entriesBuf.readUInt32LE(off + 4))
      const hash = (high << 32n) | low
      entries.push({ hash })
    }

    return entries
  } catch {
    return null
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd) } catch { /* ignore */ }
    }
  }
}

/**
 * Detects the mod type by inspecting the folder structure.
 */
export function detectModType(modDir: string): ModType {
  if (!fs.existsSync(modDir)) return 'unknown'

  const files = getAllFiles(modDir)
  const dirs = getTopLevelDirs(modDir)

  // archive mod: has .archive files in archive/pc/mod or root
  if (files.some((f) => f.endsWith('.archive'))) {
    // Check if it also contains mod.json (redmod)
    if (files.some((f) => path.basename(f) === 'info.json') && dirs.includes('archives')) {
      return 'redmod'
    }
    return 'archive'
  }

  // redmod: contains info.json + archives/ folder
  if (
    files.some((f) => path.basename(f) === 'info.json') &&
    dirs.includes('archives')
  ) {
    return 'redmod'
  }

  // CET: contains init.lua or .lua files in a root folder
  if (files.some((f) => f.endsWith('.lua'))) {
    return 'cet'
  }

  // redscript: contains .reds files
  if (files.some((f) => f.endsWith('.reds'))) {
    return 'redscript'
  }

  // tweakxl: contains .yaml or .yml tweaks
  if (
    files.some((f) => f.endsWith('.yaml') || f.endsWith('.yml')) &&
    (modDir.includes('tweaks') || files.some((f) => f.includes('tweaks')))
  ) {
    return 'tweakxl'
  }

  // red4ext: contains .dll files and red4ext folder
  if (files.some((f) => f.endsWith('.dll')) && dirs.includes('red4ext')) {
    return 'red4ext'
  }

  // bin: contains dlls in bin/x64
  if (files.some((f) => f.endsWith('.dll'))) {
    return 'bin'
  }

  // r6: scripts, tweaks, config
  if (dirs.includes('r6')) {
    return 'r6'
  }

  // engine
  if (dirs.includes('engine')) {
    return 'engine'
  }

  return 'unknown'
}

function getAllFiles(dir: string, depth = 0): string[] {
  if (depth > 5) return []
  const results: string[] = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...getAllFiles(full, depth + 1))
      } else {
        results.push(full)
      }
    }
  } catch { /* ignore */ }
  return results
}

function getTopLevelDirs(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name.toLowerCase())
  } catch {
    return []
  }
}

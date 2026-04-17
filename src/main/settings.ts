import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import type { AppSettings } from '../shared/types'

const settingsPath = path.join(app.getPath('userData'), 'settings.json')

const defaultSettings: AppSettings = {
  gamePath: '',
  libraryPath: '',
  downloadPath: app.getPath('downloads'),
  theme: 'dark',
  autoUpdate: true
}

export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8')
      return { ...defaultSettings, ...JSON.parse(raw) }
    }
  } catch {
    // Fall through to defaults
  }
  return { ...defaultSettings }
}

export function saveSettings(settings: AppSettings): void {
  const dir = path.dirname(settingsPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
}

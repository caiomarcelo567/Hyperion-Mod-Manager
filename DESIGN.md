# HYPERION - Design Specification v2.1

## 1. Product Direction

Hyperion is a desktop mod manager for Cyberpunk 2077 with a dark, intentional, information-dense interface.
The visual tone is refined industrial: near-black surfaces, disciplined borders, precise yellow accent, minimal but meaningful glow.

Primary goals:
- Fast orientation for installed mods and downloads
- High readability under dense data
- Strong hierarchy without noisy sci-fi decoration
- UI that feels deliberate, not generic or over-stylized

Hard no:
- Tron neon palettes
- scanlines or grid overlays
- skewed shapes
- pulse/flicker effects
- decorative chrome with no functional meaning

## 2. Foundation

### Core palette

```css
--bg-base: #0A0A0A;
--bg-surface: #111111;
--bg-elevated: #161616;
--bg-subtle: #1C1C1C;
--border-default: rgba(255,255,255,0.06);
--border-strong: rgba(255,255,255,0.12);
--text-primary: #F2F2F2;
--text-secondary: rgba(242,242,242,0.55);
--text-muted: rgba(242,242,242,0.28);
--accent: #FCEE09;
--accent-hover: #FFF22A;
--accent-dim: rgba(252,238,9,0.12);
--accent-cyber-blue: #4FD8FF;
--status-success: #34D399;
--status-warning: #FCEE09;
--status-error: #f87272;
--status-info: #60A5FA;
```

Accessibility:
- All visible text must meet at least WCAG AA contrast against its immediate background
- Use $4.5:1$ for normal text and $3:1$ for large text

### Typography

- Syne: logo, high-level titles, uppercase emphasis
- DM Sans: primary UI font for labels, panels, forms, lists
- Monospace only for technical values such as timestamps, versions, paths, counters

### Motion

- Motion is short and purposeful
- Sidebar width change: 300ms max
- Standard fades/translates: 150-250ms
- No pulsing, flickering, or sweeping highlight animations

## 3. App Shell

### Window shell

- Frameless Electron window
- Custom header with drag region across the top bar
- Main renderer stays hidden until splash handoff is complete
- Background uses a subtle static atmospheric field from App.tsx and globals.css
- Avoid animated parallax star layers in the main shell; keep the background understated and low-cost to render

### Header

- Height: 56px
- Left side: Hyperion mark + wordmark + search
- Right side: library utility buttons, single-step updater CTA, logs placeholder icon, native window controls
- The terminal icon in the header currently means Logs placeholder, not an in-app terminal session

### Sidebar

Current implementation state:
- Collapsed width: 80px
- Expanded width: 256px on hover
- Top decorative profile block is hidden while collapsed and revealed on hover
- Top decorative block contains a terminal glyph + SYS_ADMIN / ONLINE label
- This top terminal glyph is reference decoration only, not a feature entry

Navigation order:
1. Mod Library
2. Downloads
3. Settings
4. Launch Game CTA at the bottom

Sidebar behavior:
- Active item gets yellow text, subtle dark background, and a 2px left accent bar
- Inactive items use muted gray and brighten on hover
- Labels fade in only in expanded state
- Launch Game is icon-only while collapsed and reveals text on sidebar hover
- Launch Game motion must remain stable: no backward jitter before moving forward

Alignment rules:
- Nav icons, Settings icon, and Launch Game icon must share a consistent visual axis
- Launch Game must remain centered while collapsed
- Expanded content should reveal to the right of the icon without shifting the icon backward first

## 4. Screen Design

### Splash

- Minimal loading screen handled in main-process resources
- Hyperion identity only, no faux terminal, no bracket ornaments
- Progress remains understated and accent-led

### Welcome / first setup

- Shown when required paths are missing or invalid
- Header and sidebar stay hidden until setup is complete, then the full shell appears
- Onboarding is a dedicated first-run workspace focused on game path, managed library path, and optional downloads intake path
- Game path carries explicit validation emphasis because it gates launch and deployment safety checks
- Clear primary CTA and minimal distractions

### Library

- Main working surface for installed mods
- Dense table/list layout with active state clarity over ornament
- Detail panel appears when a mod is selected
- Visual emphasis goes to name, status, type, actions, and activation state
- Library status filtering should live in the screen itself, below the selection guidance, not in the global header
- Use local segmented controls for `All`, `Enabled`, and `Disabled`; `All` may use the cyber blue accent while activation-oriented controls should reuse the same squared button language as Browse and other path actions
- Enable/disable-all control should read as a compact rectangular command block, not a toggle switch and not a rounded pill
- Table sorting should be available from `Mod Name`, `Type`, and `Installed`
- Sort icons should stay visually secondary and sit tight to the label without affecting the left alignment of the header text
- Bulk actions should appear only when multiple mods are selected
- Sort affordance should keep the entire header cell clickable, left align the label, and show only one active sorted column at a time
- When the local status filter is `Enabled` or `Disabled`, the enable/disable-all control should be visibly disabled and explain that state through the shared tooltip treatment

### Downloads

- Separate screen sourced from configured downloads directory
- Header includes refresh and open-folder actions
- Summary strip shows configured path, file count, and zip-ready count
- Download rows prioritize file name, format, modified date, install/reinstall action, and delete action

### Settings

- Accessible as a full content view, not merely a hidden modal afterthought
- Used for game path, library path, downloads path, and update preferences
- Should feel operational and clear, not decorative
- Core directories section should mirror the Welcome screen visual system: unified dark card, path blocks in monospace, compact status badges, and the same primary/secondary button treatment
- Settings navigation should feel like an integrated extension panel: section tabs connected to the content surface rather than floating above it
- Avoid nested scrolling inside Settings content when the main app surface already handles vertical scroll

## 5. Components

### Buttons

Primary:
- Yellow background
- Black text
- Hover can brighten slightly to white/yellow edge without becoming glossy

Secondary:
- Very dark background or transparent dark surface
- Fine border and muted text
- Hover strengthens border/text contrast

Destructive:
- Error-tinted text or border
- Subtle red emphasis only on hover

Tooltips:
- Use a shared Hyperion tooltip component instead of browser-native `title` tooltips
- Tooltip treatment should stay compact: dark surface, fine border, uppercase micro-label, restrained shadow
- Disabled controls that need explanation should expose that explanation through the same shared tooltip component

### Toasts

- Compact stacked notifications
- Clear severity via border/accent, not giant badges
- Short text, no gimmick labels

### Lists and panels

- Thin separators
- Dense but readable row heights
- Hover states must increase clarity, not add noise

## 6. Updater UX

- Update availability appears in the header as a single compact CTA
- One click on Install update starts download immediately; no separate popover or second confirmation step
- Download progress is rendered inside the button itself
- After download finishes, the app installs and relaunches automatically
- States: available, downloading, installing, error
- Error state currently surfaces as simple text in header when no update is available
- Release channel depends on GitHub provider artifacts produced by electron-builder

Release expectations:
- package.json version is the installer/app version
- GitHub release tags should match vX.Y.Z
- Auto-update expects published release metadata such as latest.yml

## 7. Design Workflow For Future Changes

- Use this file as the canonical design reference before editing renderer UI
- For major visual rethinks or new screens, prototype direction in Google Stitch first, then implement in code
- If a UI change lands in code, update this document in the same task
- Prefer documenting actual shipped behavior over aspirational mockups

## 8. Current File Map

- App shell: src/renderer/App.tsx
- Header: src/renderer/features/ui/Header.tsx
- Sidebar: src/renderer/features/ui/Sidebar.tsx
- Welcome: src/renderer/features/ui/WelcomeScreen.tsx
- Library: src/renderer/features/library/*
- Downloads: src/renderer/features/downloads/DownloadsPane.tsx
- Settings: src/renderer/features/ui/SettingsDialog.tsx
- Toasts: src/renderer/features/ui/ToastContainer.tsx
- Main-process splash: src/main/resources/splash.html
- Theme tokens: src/renderer/styles/globals.css

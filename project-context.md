---
project_name: Vision Start
date: 2026-07-03
type: general_overview
---

# Vision Start — Project Context

A general, non-normative overview of the **Vision Start** project: what it is, how it's structured, what features it offers, and which files do what. This document is intended as a map for humans and AI agents to orient themselves in the codebase. It deliberately avoids coding-style prescriptive rules.

---

## 1. What Is This Project?

**Vision Start** is a glassmorphism-styled, highly customizable **browser startpage** (new-tab page).

- Distributed as a **Chrome/Chromium extension** (Manifest V3) that overrides the new tab with `index.html`.
- Also runnable as a **standalone web app** and shipped as a **Docker image** served via nginx.
- Built with **React + TypeScript**, bundled with **Vite**, and styled with **Tailwind CSS v4** (using the `@preact/preset-vite` so Preact is the actual React runtime).
- Persistent state lives in `localStorage` and, when available, `chrome.storage.local`.

Live instances / artifacts:
- Public demo: `http://vision-start.ivanch.me`
- Source: `https://gitea.com/ivan/vision-start.git`
- Container registry: `git.ivanch.me/ivanch/vision-start`
- Releases: `https://git.ivanch.me/ivanch/vision-start/releases/latest`

---

## 2. Technology Stack

| Layer | Tech |
|---|---|
| Language | TypeScript (~5.7), target ES2020, strict mode |
| UI runtime | Preact 10 (via `@preact/preset-vite`); types from `@types/react` 19 |
| Bundler / dev server | Vite 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin + `@tailwindcss/postcss` + `autoprefixer`) |
| Drag & drop | `@hello-pangea/dnd` 18 |
| Build output | Plain static files in `dist/` (relative `base: './'`, single CSS bundle; modals code-split into separate JS chunks via `React.lazy`) |
| Container | Node 22 Alpine build stage → nginx Alpine serving `dist/` |
| Extension packaging | Manifest V3 (`manifest.json`) consuming `dist/` + `manifest.json` zipped as `vision-start-<tag>.zip` |
| CI/CD | Gitea Actions workflows (`.gitea/workflows/`) |

Entry points: `index.html` → `index.tsx` → `App.tsx`.

---

## 3. Feature Overview

The startpage is composed of widgets and a configuration panel:

- **Website Tiles** — Bookmarks organized into categories. Each tile shows an icon + name and opens the configured URL. Tiles can be added, edited, deleted, and moved left/right across categories while in edit mode.
- **Categories** — Groupings of website tiles (e.g. "Search"). Add/edit/delete/name.
- **Clock** — Optional header clock with selectable size, font, and 12h/24h format.
- **Title** — Optional big header title (text + size configurable).
- **Server Status Widget** — Bottom-center glass pill that periodically "pings" configured server addresses and shows online/offline indicators. Ping uses an image-load trick (`components/utils/jsping.js`) with a 5s timeout, at a configurable frequency.
- **Wallpaper background** — Fullscreen background image with adjustable blur, brightness, and opacity, rendered behind a soft readability layer for the liquid-glass UI. Supports rotating through multiple wallpapers at a cadence (`1h`–`2d`).
  - Built-in wallpapers: Abstract, Abstract Red, Beach, Dark, Mountain, Waves (`components/utils/baseWallpapers.ts`).
  - User wallpapers: upload from a file (≤4MB, ≤4.5MB base64) or add by URL; stored in `chrome.storage.local` when available, falling back to storing the URL directly on CORS failure.
- **Icon library & auto-fetch** — Website icons can be picked from the [Dashboard Icons](https://dashboardicons.com/) library (metadata pre-downloaded to `public/icon-metadata.json`) or auto-fetched from the target site's `apple-touch-icon`/`icon` link tags, with a fallback to Google's S2 favicon service.
- **Configuration panel** — Slide-in right-side modal with four tabs: General, Theme, Clock, Server Widget. Includes **Export** (downloads a JSON bundle of selected `localStorage` keys) and **Import** (restores from JSON and reloads the page).
- **Edit mode** — Toggle via the top-left pencil button; reveals per-tile glass action toolbars, per-category edit buttons, and ghost glass "add" tiles.
- **Liquid glass design language** — Light translucent surfaces, refractive edge highlights, backdrop blur, soft shadows, cyan focus states, and iOS-like easing tokens (`ease-ios`, `ease-spring`, `ease-liquid`) defined in `index.css`.

Performance notes:
- Modals (`ConfigurationModal`, `WebsiteEditModal`, `CategoryEditModal`) are code-split via `React.lazy` + `Suspense` and only loaded when opened. `ConfigurationModal` is the heaviest chunk (it pulls in `@hello-pangea/dnd` via `ServerWidgetTab`); the rest of `@hello-pangea/dnd` is isolated from the initial load.
- `WebsiteTile` and `CategoryGroup` are wrapped in `React.memo`; `App.tsx` handlers are `useCallback`-stabilized and pure alignment helpers are hoisted to module scope, so opening a modal / toggling edit no longer re-renders every tile.
- `Clock` updates on the minute boundary (one `setTimeout` → `setInterval(60_000)`) instead of every second.
- `jsping` cancels its 5s timeout on image resolve/error and nulls the `Image` handlers, preventing leaks across ping cycles.
- `ServerWidget` batches pending-status updates into one `setState` and depends on a stable servers signature (ids+addresses) so unrelated config edits don't restart pings.
- Icon metadata (`/icon-metadata.json`) is module-level cached, fetched lazily on first focus of the icon field with `cache: 'force-cache'`, filter debounced ~150ms, and color variants are expanded lazily during filtering rather than upfront.
- `Wallpaper` caches resolved wallpaper URLs in a module-level `Map`; its image transition and readability overlay classes live in `index.css`.

Planned / To-do (tracked in `README.md`):
- Dynamic Weather widget, Search Bar widget, draggable/resizable grid system, Notes/Scratchpad widget, theming (light/dark, accent colors, wallpaper-derived accents, minimal feel toggle), and a general "refactor everything" note.

---

## 4. Project Structure

```
vision-start/
├── App.tsx                      # Root React component; central state + handlers
├── index.tsx                    # React root mount (ReactDOM.createRoot)
├── index.html                   # HTML shell, links index.css, mounts #root
├── index.css                    # Tailwind v4 import + liquid glass utilities, wallpaper overlays, and easing tokens
├── vite-env.d.ts                # Type declaration for CSS imports used by TypeScript verification
├── types.ts                     # Core domain types (Config, Category, Website, Server, Wallpaper)
├── constants.tsx                # DEFAULT_CATEGORIES seed data
├── manifest.json                # Chrome MV3 manifest (newtab override, storage permission)
├── icon.png                     # Extension icon source
│
├── components/
│   ├── Clock.tsx                # Header clock widget
│   ├── Wallpaper.tsx            # Background image renderer + rotation logic
│   ├── WebsiteTile.tsx          # Individual bookmark tile + loading/edit controls
│   ├── WebsiteEditModal.tsx     # Add/edit a website (icon picker inside)
│   ├── CategoryEditModal.tsx    # Add/edit a category
│   ├── ConfigurationModal.tsx   # Tabbed settings drawer with Export/Import
│   ├── ServerWidget.tsx         # Bottom server status pill
│   ├── Dropdown.tsx             # Reusable glassy dropdown (single/multi select)
│   ├── ToggleSwitch.tsx         # Reusable toggle switch
│   │
│   ├── layout/
│   │   ├── Header.tsx               # Renders Clock + Title
│   │   ├── CategoryGroup.tsx        # Renders a category's title + its tiles + edit controls
│   │   ├── EditButton.tsx           # Top-left pencil toggle
│   │   └── ConfigurationButton.tsx # Top-right gear button
│   │
│   ├── configuration/
│   │   ├── GeneralTab.tsx           # Title, sizes, alignment, tile size
│   │   ├── ThemeTab.tsx             # Background selection, wallpaper mgmt, blur/brightness/opacity
│   │   ├── ClockTab.tsx             # Clock enable/size/font/format
│   │   └── ServerWidgetTab.tsx      # Server widget enable/ping/servers (drag-to-reorder)
│   │
│   ├── services/
│   │   └── ConfigurationService.ts  # DEFAULT_CONFIG, load/save config & wallpapers, add/delete wallpaper, export/import config, reset wallpaper state
│   │
│   └── utils/
│       ├── baseWallpapers.ts        # Built-in wallpaper catalog (imgur/wallpapershome URLs)
│       ├── iconService.ts           # getWebsiteIcon: fetch HTML, parse apple-touch-icon/icon, fallback to Google favicons
│       ├── jsping.js                # Image-load based "ping" with 5s timeout (used by ServerWidget)
│       └── StorageLocalManager.ts   # chrome.storage.local wrappers + availability check; wallpaper fetch/base64/URL storage
│
├── public/
│   ├── favicon.ico
│   └── icon-metadata.json        # Dashboard Icons metadata (gitignored; fetched at release build)
│
├── screenshots/                  # README screenshots (dark page, editing, configuration)
├── scripts/
│   ├── prepare_release.sh        # Downloads icon-metadata.json from homarr-labs/dashboard-icons
│   └── check_virustotal.sh       # Uploads the release zip to VirusTotal, waits for & reports the verdict
│
├── .gitea/workflows/
│   ├── main.yaml                 # On push to main: build, push staging Docker image, SSH-deploy to staging
│   └── release.yaml              # On v* tag: build, zip, VirusTotal check, Gitea release, push latest image, SSH-deploy to prod
│
├── Dockerfile                    # Node 22 build → nginx serving dist/ (with gzip via nginx.conf)
├── nginx.conf                    # nginx gzip config (JSON/JS/CSS/SVG/XML), mounted into container
├── .dockerignore
├── .gitignore                    # Ignores node_modules, dist, .claude/, public/icon-metadata.json, etc.
├── postcss.config.cjs            # @tailwindcss/postcss + autoprefixer
├── tailwind.config.js            # Content globs + safelist of dynamic w-/h- sizes
├── tsconfig.json                 # Strict TS, bundler resolution, `@/*` path alias to project root
├── vite.config.ts                # preact + tailwindcss plugins; single-bundle output; base './'
├── package.json                  # Scripts: dev, build, preview
├── README.md                     # Public-facing readme + feature list + roadmap
└── .env.local                    # Local env (not tracked in context here)
```

---

## 5. Data Model & State

The shape of all persisted data lives in `types.ts`:

- **`Website`** — `id`, `name`, `url`, `icon`, `categoryId`
- **`Server`** — `id`, `name`, `address`
- **`Category`** — `id`, `name`, `websites: Website[]`
- **`Wallpaper`** — `name`, optional `url` or `base64`
- **`Config`** — Everything else: title, wallpaper list + frequency/blur/brightness/opacity, titleSize, vertical & horizontal alignment, tileSize, `clock {enabled, size, font, format}`, `serverWidget {enabled, pingFrequency, servers}`

`ConfigurationService` (`components/services/ConfigurationService.ts`) is the source of truth for default config and persistence helpers.

Storage layout (browser-side):

| Key | Where | Contents |
|---|---|---|
| `config` | `localStorage` | The full `Config` JSON |
| `categories` | `localStorage` | `Category[]` JSON |
| `userWallpapers` | `localStorage` | `Wallpaper[]` index (names) |
| `wallpaperState` | `localStorage` | `{ lastWallpaperChange, currentIndex }` for rotation |
| `<wallpaperName>` | `chrome.storage.local` (when available) | base64 (or URL on CORS failure) image data |

Export/import bundles keys: `config`, `categories`, `userWallpapers`, `wallpaperState`.

---

## 6. Application Flow (high level)

1. `index.html` loads `index.tsx`, which mounts `<App/>` into `#root`.
2. `App.tsx` initializes state from `localStorage` (`categories`) and `ConfigurationService.loadConfig()` (`config`), falling back to defaults.
3. `useEffect` hooks persist `config` and `categories` back to `localStorage` whenever they change.
4. The screen renders:
   - `<Wallpaper>` behind everything (fetches URL/base64 from base catalog or chrome.storage.local; rotates per frequency).
   - `<EditButton>` (top-left) and `<ConfigurationButton>` (top-right).
   - `<Header>` (clock + title).
   - One `<CategoryGroup>` per category (renders its `<WebsiteTile>`s and, in edit mode, add/edit/move controls).
   - Optional `<ServerWidget>` if enabled.
   - Conditionally one of: `<WebsiteEditModal>`, `<CategoryEditModal>`, `<ConfigurationModal>`.
5. Edit / configuration interactions update central `App` state; the existing `useEffect`s persist it.

---

## 7. Build, Release & Deployment

### Local development / preview
```bash
npm install
npm run dev       # Vite dev server (note: PROJECT.md says prefer `npm run build` for real testing)
npm run build     # Production build → dist/
npm run preview   # Serve built dist/
```

### Chrome extension install (manual)
Build, then combine `dist/` + `manifest.json` into a folder and "Load unpacked" from `chrome://extensions`. The release workflow automates this zip.

### Docker
`Dockerfile` builds in Node 22 Alpine (`npm ci` → runs `scripts/prepare_release.sh` → `npm run build`) and serves `/app/dist` + `manifest.json` via nginx:alpine on port 80.

### CI/CD (Gitea Actions)
- **`main.yaml`** — Triggers on push to `main` (and `workflow_dispatch`). Builds, pushes a `staging` multi-arch (amd64/arm64) image to `git.ivanch.me/ivanch/vision-start:staging`, then SSH-deploys on the staging host via `docker compose up -d --force-recreate`.
- **`release.yaml`** — Triggers on `v*` tags. Builds, zips `dist/` + `manifest.json` as `vision-start-<tag>.zip`, runs `scripts/check_virustotal.sh` against it (publishes analysis URL + detection ratio on the release body), creates a Gitea release, pushes a `latest` multi-arch image, and SSH-deploys to production.

Required CI secrets (referenced by the workflows): `REGISTRY_PASSWORD`, `HOST`, `USERNAME`, `KEY`, `PORT`, `STAGING_DIR`, `PROD_DIR`, `VIRUSTOTAL_APIKEY`.

External assets fetched at build time by `scripts/prepare_release.sh`:
- `https://raw.githubusercontent.com/homarr-labs/dashboard-icons/.../metadata.json` → `public/icon-metadata.json` (used by `WebsiteEditModal` for the icon picker; gitignored).

---

## 8. Notable Behaviors & Quirks

- **`EditModal.tsx` has been removed.** It was a legacy drag-and-drop editor that imported non-existent `lucide-react` and `./IconPicker`; it was never wired into `App.tsx`. Use `WebsiteEditModal.tsx` / `CategoryEditModal.tsx` instead.
- **`@hello-pangea/dnd`** is used only in `ServerWidgetTab.tsx` (server reorder), which itself is imported by the lazy-loaded `ConfigurationModal`, so it lives in a separate chunk and is absent from the initial page load. `WebsiteTile` moves tiles via simple left/right buttons, not drag-and-drop.
- **Chrome storage is optional.** `StorageLocalManager` checks availability once (`checkChromeStorageLocalAvailable`) and caches it. When unavailable (e.g., running as a plain web page), wallpaper upload/delete flows are gated off and `addWallpaperToChromeStorageLocal` throws.
- **Wallpaper rotation** is time-based, evaluated on render/mount rather than via a timer. It reads `wallpaperState` from `localStorage`, advances the index if the frequency window has elapsed, and writes it back. The renderer clamps `currentIndex` to the valid range of the current selection and walks the list forward to find a wallpaper whose data actually resolves (so deleting the currently-displayed wallpaper, or shrinking the selection, never leaves the background blank); if no wallpaper resolves, the background layer is hidden. When the selection becomes empty, `wallpaperState` is reset and the background is hidden. A manual "Next Wallpaper" button in the Theme tab advances `currentIndex` (with wraparound) and bumps a `wallpaperVersion` nonce in `App.tsx` that retriggers the renderer.
- **Icon picker** in `WebsiteEditModal` loads `/icon-metadata.json` at runtime and expands each icon's `colors` into duplicate-name entries so color variants are searchable.
- **`tsconfig.json` does not emit JS** (`noEmit: true`, bundler resolution); Vite handles all transpilation.
- **`tailwind.config.js` safelists** a set of `w-[Npx]/h-[Npx]` classes because `WebsiteTile` generates tailwind classes dynamically from `tileSize` (`w-[42px]`, etc.).
- **Project guidance note** in `PROJECT.md`: do not use `npm run dev` for real verification — use `npm run build`.
- **`.claude/` and `.env.local`** are local-only / gitignored; not part of shipped artifacts.

---

## 9. Where Things Live (Quick Lookup)

| You want to find… | Look in… |
|---|---|
| The default config | `components/services/ConfigurationService.ts` (`DEFAULT_CONFIG`) |
| The default seed bookmarks | `constants.tsx` (`DEFAULT_CATEGORIES`) |
| Built-in wallpaper list | `components/utils/baseWallpapers.ts` |
| Type definitions | `types.ts` |
| Main app wiring (state, handlers, layout) | `App.tsx` |
| Settings UI | `components/ConfigurationModal.tsx` + `components/configuration/*Tab.tsx` |
| Wallpaper rendering/rotation | `components/Wallpaper.tsx` |
| Server status logic | `components/ServerWidget.tsx` + `components/utils/jsping.js` |
| Icon fetch / picker / metadata | `components/utils/iconService.ts`, `components/WebsiteEditModal.tsx`, `public/icon-metadata.json` |
| chrome.storage.local access | `components/utils/StorageLocalManager.ts` |
| Export/import config | `components/services/ConfigurationService.ts` (`exportConfig`, `importConfig`) |
| Release packaging | `scripts/prepare_release.sh`, `scripts/check_virustotal.sh`, `.gitea/workflows/release.yaml` |
| Docker build | `Dockerfile` |

---

_Last updated: 2026-07-03. Generated as a general project overview; not a coding-style guide._

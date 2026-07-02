# AGENTS.md

Guidance for AI agents (and humans) working on Vision Start. Read before making changes.

---

## 0. First rule: keep `project-context.md` alive

- **Always read `project-context.md` first.** It is the canonical map of the project: structure, features, data model, flow, build/release. Treat it as required reading before any non-trivial change.
- **Always keep it updated.** Whenever you add, remove, rename, or materially change files, modules, features, storage keys, config fields, build/release steps, or workflows, update the relevant section of `project-context.md` in the same change set. If your work touches the structure tree, the data model, the storage layout, or the quick-lookup table, those sections must reflect the new state.
- Keep it a general overview, not a coding-style guide — that distinction lives here in `AGENTS.md`.

---

## 1. Styling guidance

The design language is **glassmorphism**: translucent black surfaces, backdrop blur, thin light borders, subtle shadows, cyan accents, and iOS-like easing.

### Surface recipe (use consistently)
- **Cards / modals / panels:** `bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg`
- **Inputs:** `bg-white/10 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400`
- **Floating buttons (corner):** `bg-black/25 backdrop-blur-md border border-white/10 rounded-xl ... hover:bg-white/25 active:scale-90`
- **Full-screen modal overlay:** `bg-black/90 backdrop-blur-sm` (modals) or `bg-black/60 backdrop-blur-sm` (drawers)
- **Slide-in drawer:** `bg-black/50 backdrop-blur-xl border-l border-white/10`

### Color tokens
- Accent / focus / selection: `cyan-400` (focus ring), `cyan-500` (active/selected background)
- Confirm/Save: `green-500` → `hover:bg-green-400`
- Cancel/secondary: `gray-600` → `hover:bg-gray-500`
- Destructive: `red-500` → `hover:bg-red-400`
- Tertiary (export/import etc.): `slate-700` → `hover:bg-slate-600`
- Status: online `bg-green-500`, offline `bg-red-500`, pending `bg-gray-500`
- Text: primary `text-white`, secondary `text-slate-300`/`text-slate-400`, muted `text-white/50` (in-app hover states)

### Motion
- Use the custom easing tokens defined in `index.css`: `ease-ios` (default) and `ease-spring` (toggle knobs, drawer slides).
- Standard durations: `duration-150` (buttons), `duration-200` (tiles, toggles, icons), `duration-250`/`duration-300` (modals, drawers).
- Micro-interactions are encouraged: `hover:scale-[1.04]`, `active:scale-90` / `active:scale-95` / `active:scale-[0.96]`, `hover:bg-white/25`.

### Tailwind specifics
- Tailwind **v4** via `@tailwindcss/vite` and `@tailwindcss/postcss`. Custom easing is in `index.css` under `@theme {}` — add new theme tokens there, not in `tailwind.config.js`.
- `tailwind.config.js` has a **safelist** of `w-[Npx]/h-[Npx]` classes because tile/icon sizes are constructed dynamically. If you add new pixel-size classes that are generated at runtime (not literally present in source), add them to the safelist or they will be purged.
- Prefer static classes; only build dynamic class strings when unavoidable and then safelist them.

### Components with established conventions to reuse
- `Dropdown` (`components/Dropdown.tsx`) for selects — single or multi. Has a glassy look and custom arrow. **Always use it** instead of `<select>`/`<input type=...>` for option picking.
- `ToggleSwitch` (`components/ToggleSwitch.tsx`) for boolean toggles — **always use it** instead of checkboxes.
- Modal pattern: backdrop + centered glass card (`bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl`), close on overlay click via `handleOverlayClick` (`if (e.target === e.currentTarget) onClose()`).
- New editors/settings go in `components/configuration/` as a `*Tab.tsx` and are wired into `ConfigurationModal.tsx`.
- New options' size presets follow the existing scale: `tiny | small | medium | large` (see `Header.tsx`, `WebsiteTile.tsx`).

---

## 2. New feature guidance

A "feature" in this project typically means: a new widget, a new settings option, or a new bit of persisted state. When adding one, follow this checklist.

### A. Types & defaults (in order)
1. **`types.ts`** — add new fields to the relevant interface (usually `Config`, sometimes a nested one like `clock`/`serverWidget`). Create a nested object when a feature has 2+ sub-options (mirror the `clock`/`serverWidget` pattern).
2. **`components/services/ConfigurationService.ts` `DEFAULT_CONFIG`** — add the new field with a sane default so existing users (with a previously-saved `Config`) get it via the `{ ...DEFAULT_CONFIG, ...parsed }` merge on load.
3. Any new standalone collections (not inside `Config`) get their own storage key/helper in `ConfigurationService` (see `userWallpapers`, `wallpaperState` for the pattern).

### B. Settings UI (if the feature is user-configurable)
1. Create `components/configuration/<Feature>Tab.tsx` and add its entry to the `tabs` array in `components/ConfigurationModal.tsx`.
2. Receive `config` and an `onChange(updates: Partial<Config>)` callback; emit partial updates — `App.tsx`'s `handleConfigChange` merges shallowly, so update nested objects as whole units (e.g. `{ clock: { ...config.clock, ...updates } }`).
3. Use `Dropdown` / `ToggleSwitch` / range inputs per the styling section above.

### C. Rendering & wiring
4. Render the feature in `App.tsx` (or a dedicated component imported by `App.tsx`), gated by its `config.<feature>.enabled` flag when it can be turned off.
5. Mark up new modal/edit surfaces to match existing modals (backdrop click closes, glass card styling).

### D. Persistence — configs must be properly saved
6. `App.tsx` already persists `config` via `ConfigurationService.saveConfig(config)` in a `useEffect`. **Any state added to `Config` is persisted automatically** — do not introduce parallel ad-hoc `localStorage` writes for config fields.
7. Standalone collections (not in `Config`) need explicit save calls — mirror `userWallpapers`: load on mount, save on every mutation, never keep stale copies.
8. Never write to `chrome.storage.local` directly outside `components/utils/StorageLocalManager.ts`. Always check `checkChromeStorageLocalAvailable()` first and gracefully degrade (the app must still run as a plain web page). Throw informative errors when the storage is required but missing.

### E. Export / import must keep working
9. If you add a new `localStorage` key (other than config fields, which are exported/imported automatically), add it to `REQUIRED_LOCAL_STORAGE_KEYS` in `ConfigurationService.ts` so it is included in exports and restored on imports.
10. After adding fields to `Config`, double check the import path: `importConfig` writes each restored key to `localStorage` and returns `{ config, userWallpapers }`. New config sub-objects flow through automatically because they're inside `config`.

### F. Defaults & migrations
11. Default values must be chosen so a fresh install and an upgrade from an older `Config` both behave sensibly (the load path merges onto `DEFAULT_CONFIG`).
12. If a new field changes behavior in a way that existing users' stored data should be preserved differently, handle the migration inside `loadConfig` (and consider bumping the export `version` field in `exportConfig` if the shape changes non-additively).

### G. Style of new tiles/widgets
13. A new widget should follow the existing widget shape: optional/gated by `config.<feature>.enabled`, positioned with a glass container, and use the surface/duration/easing tokens above.
14. New "editable" tiles/content reuse the `isEditing` mode and the edit/move/delete affordances pattern from `WebsiteTile.tsx` and `CategoryGroup.tsx`.

---

## 3. General engineering rules

- **Language:** TypeScript strict mode (`tsconfig.json` enforces `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`). Do not loosen these.
- **Runtime note:** Preact is the actual runtime (`@preact/preset-vite`), but types and imports use `react`/`@types/react`. Do not introduce React-only APIs without verifying Preact compatibility.
- **Path alias:** `@/*` maps to the project root (see `tsconfig.json` `paths`). Source files currently use relative imports (`./`, `../`) — match the surrounding file.
- **No comments** in committed code unless explicitly requested.
- **Build vs. dev:** Prefer verifying with `npm run build` rather than `npm run dev`. The only npm scripts are `dev`, `build`, `preview`.
- **No lint/typecheck script is configured.** Verify TS correctness manually (e.g. `npx tsc --noEmit`), and confirm `npm run build` succeeds before considering a task complete.
- **Don't touch `public/icon-metadata.json`** — it's gitignored and fetched at release-build time by `scripts/prepare_release.sh`. Don't commit a local copy.
- **Don't reintroduce dead code:** `components/EditModal.tsx` imports `lucide-react` and `./IconPicker`, neither of which is a dependency. It is not wired into the app. Use `WebsiteEditModal.tsx` / `CategoryEditModal.tsx` instead, and add the icon picker inline (as in `WebsiteEditModal.tsx`) rather than reviving `IconPicker`.
- **External asset URLs:** any new icons/css/JS pulled from CDNs (e.g. `cdn.jsdelivr.net`) must work offline-or-not without crashing — always provide a fallback (see how `iconService.ts` falls back to Google's S2 favicon service).
- **Manifest & extension constraints:** the extension uses Manifest V3 with `script-src 'self'` CSP and only the `storage` permission. Don't introduce inline scripts/eval, and avoid requesting new permissions unless essential — added permissions can disable updates on installed extensions.
- **Commits:** never commit unless explicitly asked. Don't touch secrets, don't edit `.gitignore`/`.env.local`/`.claude/`, don't run `git config`.

---

## 4. When in doubt

- Read `project-context.md`.
- Mirror the nearest existing equivalent (a similar widget, modal, or config tab) before inventing a new pattern.
- Favor the established glass tokens (`bg-black/25`, `backdrop-blur-md`, `border-white/10`, `cyan-400/500`) over ad-hoc colors.
- Surface failing assumptions (CORS, missing chrome.storage, larger-than-4MB wallpapers) with clear errors, matching the style of `StorageLocalManager.ts` and `iconService.ts`.
- Update `project-context.md` after your change.

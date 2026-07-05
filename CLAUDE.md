# ChefMate Frontend

Angular 22 single-page app. Standalone components, signals, Tailwind CSS 4, Vitest unit tests, Prettier. Roadmap: PWA, then native via Capacitor.

## Architecture (read this first)

The app is a pragmatic hexagonal architecture: Angular is the **view layer** on top of a **plain-TypeScript business layer**, with all infrastructure behind **ports and adapters**. **`ARCHITECTURE.md` is the canonical guideline** — read it before creating features, services, or anything touching storage/HTTP/device APIs. Where it conflicts with generic Angular guidance (skill references, MCP `get_best_practices`), `ARCHITECTURE.md` and this file win.

Load-bearing rules (full rationale and templates in `ARCHITECTURE.md`):

- Never call platform APIs (`localStorage`, `fetch`, `navigator.*`, Capacitor plugins) from components or business code. Define a port (abstract class, zero Angular imports, async methods), implement it in an adapter, bind them at a composition root.
- Business logic lives in plain TS (feature `domain/`, no Angular imports), wired with `useFactory` at the composition root. Only composition roots (`app.config.ts`, feature `provide-*.ts`) import adapters.
- `@Service`/`providedIn: 'root'` are for Angular-side services only (signal stores, UI orchestration) — never on ports, adapters, or `domain/` code.
- Feature-first folders with layers inside: `features/<name>/{domain,data}` + view files at the feature root; cross-cutting infra in `core/<capability>/`.
- Signals stay in the view layer; adapt `Promise`-based business results via `resource()` at the boundary.
- Do NOT introduce use-case/interactor classes, DTO mapping layers, or framework-agnostic state — deliberately out of scope (see decision log in `ARCHITECTURE.md`).

## Commands

- `npm start` — dev server (`ng serve`)
- `npm run build` — production build
- `npm test` — unit tests (Vitest via `ng test`, builder `@angular/build:unit-test`)
- `npx prettier --write <files>` — format (`.prettierrc`: 100-char width, single quotes, Angular HTML parser)

After generating or changing code, run `npm run build` and fix any errors before finishing.

## AI tooling in this repo

- **`architecture` skill** (`.claude/skills/architecture/`) — project skill for this repo's hexagonal architecture. Use it when creating features, ports, adapters, business services, or deciding where code goes. It condenses `ARCHITECTURE.md` into operational templates.
- **`angular-developer` skill** (`.claude/skills/angular-developer/`) — official Angular team skill. Use it for components, reactivity (signals, linkedSignal, resource), forms, DI, routing, a11y, styling/Tailwind, and testing. Its `references/` docs are the source of truth for framework APIs. Kept unmodified so it can be updated from upstream; where its generic advice conflicts with `ARCHITECTURE.md`, `ARCHITECTURE.md` wins.
- **Angular CLI MCP server** (`.mcp.json`) — provides `search_documentation`, `get_best_practices`, `list_projects`, `run_target`, and dev-server control. Prefer `search_documentation` over guessing framework behavior.
- Angular docs index for LLMs: https://angular.dev/llms.txt

## Angular best practices (from angular.dev, adapted for v22)

### TypeScript

- Use strict type checking; prefer type inference when the type is obvious
- Avoid `any`; use `unknown` when the type is uncertain

### Components

- Standalone components only. Do NOT set `standalone: true` in decorators (default since v20)
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` (default in v22+)
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Keep components small and focused on a single responsibility; prefer inline templates for small components
- Do NOT use `@HostBinding`/`@HostListener`; use the `host` object in the decorator instead
- Do NOT use `ngClass`/`ngStyle`; use `class` and `style` bindings instead
- Use `NgOptimizedImage` for all static images (not for inline base64 images)
- When using external templates/styles, use paths relative to the component TS file

### State

- Use signals for local component state, `computed()` for derived state
- Do NOT use `mutate` on signals; use `update` or `set` instead
- Keep state transformations pure and predictable

### Templates

- Use native control flow (`@if`, `@for`, `@switch`), never `*ngIf`/`*ngFor`/`*ngSwitch`
- Keep templates simple; avoid complex logic
- Use the async pipe to handle observables

### Forms

- Prefer Signal Forms (`@angular/forms/signals`) for new forms (stable in v22)
- When not using Signal Forms, prefer Reactive forms over Template-driven ones

### Services & DI

- Design services around a single responsibility
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (v22+) — **Angular-side services only**; ports, adapters, and `domain/` classes are undecorated plain TS bound at composition roots (see Architecture)
- Use the `inject()` function instead of constructor injection (in Angular-side code; plain-TS business classes take ports as constructor parameters)

### Routing

- Lazy-load feature routes
- Routes live in `src/app/app.routes.ts`; app providers in `src/app/app.config.ts`

### Accessibility

- Must pass AXE checks and meet WCAG AA minimums: focus management, color contrast, ARIA attributes

## Project conventions

- v20+ file naming: `recipe-list.ts` / `recipe-list.html` / `recipe-list.css` (no `.component.` suffix); class names without suffix (`App`, not `AppComponent`)
- Component selector prefix: `app-`
- Scaffold view-layer artifacts with the Angular CLI (`ng generate`); `domain/`, `data/`, and `core/` files are written by hand — the CLI would stamp Angular decorators onto code that must stay Angular-free
- Non-Angular files follow the same hyphenated naming, matching the identifier: `StoragePort` → `storage-port.ts`
- Styling: Tailwind utilities first (global setup in `src/styles.css`); per-component CSS only for what utilities can't express

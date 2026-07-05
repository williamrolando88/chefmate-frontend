# ChefMate Frontend

Angular 22 single-page app. Standalone components, signals, Tailwind CSS 4, Vitest unit tests, Prettier.

## Commands

- `npm start` — dev server (`ng serve`)
- `npm run build` — production build
- `npm test` — unit tests (Vitest via `ng test`, builder `@angular/build:unit-test`)
- `npx prettier --write <files>` — format (`.prettierrc`: 100-char width, single quotes, Angular HTML parser)

After generating or changing code, run `npm run build` and fix any errors before finishing.

## AI tooling in this repo

- **`angular-developer` skill** (`.claude/skills/angular-developer/`) — official Angular team skill. Use it for components, reactivity (signals, linkedSignal, resource), forms, DI, routing, a11y, styling/Tailwind, and testing. Its `references/` docs are the source of truth for framework APIs.
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
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (v22+)
- Use the `inject()` function instead of constructor injection

### Routing

- Lazy-load feature routes
- Routes live in `src/app/app.routes.ts`; app providers in `src/app/app.config.ts`

### Accessibility

- Must pass AXE checks and meet WCAG AA minimums: focus management, color contrast, ARIA attributes

## Project conventions

- v20+ file naming: `recipe-list.ts` / `recipe-list.html` / `recipe-list.css` (no `.component.` suffix); class names without suffix (`App`, not `AppComponent`)
- Component selector prefix: `app-`
- Scaffold with the Angular CLI (`ng generate`) for consistency
- Styling: Tailwind utilities first (global setup in `src/styles.css`); per-component CSS only for what utilities can't express

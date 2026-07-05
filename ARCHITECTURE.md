# ChefMate Architecture

Canonical architectural guideline for this repo. Binding for humans and AI tooling alike.
Where anything here conflicts with generic Angular guidance (the `angular-developer` skill
references, the MCP `get_best_practices` output, or angular.dev defaults), **this document wins**.

## Why this architecture

ChefMate will grow from a web SPA into a PWA and later ship natively via Capacitor. Capacitor
wraps the *same* Angular build in a native shell — there is no second UI stack — so we do NOT
need a fully framework-agnostic application layer. What the roadmap does change is
**infrastructure**: storage, HTTP, and device APIs will each gain a second (native) implementation.

Concretely: `localStorage` inside a Capacitor WKWebView can be evicted by the OS under disk
pressure; the native answer is Capacitor Preferences or SQLite, and an offline-first PWA pass may
push web storage to IndexedDB. Every one of those migrations should be a provider swap at the
composition root — not a hunt through feature code.

So we use a **pragmatic hexagonal architecture**:

```
┌─────────────────────────────────────────────┐
│ View layer (Angular)                        │  components, signal stores, resource(),
│                                             │  signal forms, routing
├─────────────────────────────────────────────┤
│ Business layer (plain TypeScript)           │  domain entities, rules, feature services —
│                                             │  zero Angular imports
├─────────────────────────────────────────────┤
│ Ports (abstract classes, plain TypeScript)  │  StoragePort, RecipeRepository, …
├─────────────────────────────────────────────┤
│ Adapters (implementations)                  │  LocalStorageAdapter, HttpRecipeRepository,
│                                             │  CapacitorPreferencesAdapter (future), …
└─────────────────────────────────────────────┘
```

**The dependency rule:** view → business → ports. Adapters implement ports. Only the composition
root knows which adapter backs which port. Nothing ever imports an adapter except the composition
root and the adapter's own tests.

## Binding rules

1. **No direct platform access.** Components and business code never call `localStorage`,
   `sessionStorage`, `fetch`, `navigator.*`, `window.*` device APIs, or Capacitor plugins
   directly. Every platform capability sits behind a port.
2. **Ports are abstract classes with zero Angular imports.** A TypeScript `interface` cannot be a
   DI token (it doesn't exist at runtime); an abstract class is both the contract and the token:

   ```ts
   // core/storage/storage-port.ts — no Angular imports
   export abstract class StoragePort {
     abstract get<T>(key: string): Promise<T | null>;
     abstract set<T>(key: string, value: T): Promise<void>;
     abstract remove(key: string): Promise<void>;
   }
   ```

   Port methods that may become native or remote are async (`Promise`) from day one —
   Capacitor Preferences and IndexedDB are async, and retrofitting sync → async is invasive.
3. **Adapters are plain classes too.** No `@Injectable`/`@Service` on them; they are bound
   manually at the composition root:

   ```ts
   // core/storage/local-storage-adapter.ts — no Angular imports
   export class LocalStorageAdapter extends StoragePort {
     async get<T>(key: string): Promise<T | null> {
       const raw = localStorage.getItem(key);
       return raw === null ? null : (JSON.parse(raw) as T);
     }
     async set<T>(key: string, value: T): Promise<void> {
       localStorage.setItem(key, JSON.stringify(value));
     }
     async remove(key: string): Promise<void> {
       localStorage.removeItem(key);
     }
   }
   ```
4. **Business logic is plain TypeScript** in the feature's `domain/` folder: entities, pure
   functions for rules/calculations, and feature services that depend only on ports via
   constructor parameters:

   ```ts
   // features/recipes/domain/favorites-service.ts — no Angular imports
   export class FavoritesService {
     constructor(private readonly storage: StoragePort) {}

     async toggle(recipeId: string): Promise<string[]> { /* … */ }
   }
   ```
5. **The composition root is the only place that wires concretions.** App-wide bindings live in
   `src/app/app.config.ts`; feature-scoped bindings live in the feature's routes file via a
   `provide<Feature>()` function (see the skill reference `defining-providers.md`):

   ```ts
   // core/storage/provide-storage.ts
   export function provideStorage(): Provider[] {
     return [{ provide: StoragePort, useClass: LocalStorageAdapter }];
   }

   // features/recipes/provide-recipes.ts
   export function provideRecipes(): Provider[] {
     return [
       {
         provide: FavoritesService,
         useFactory: () => new FavoritesService(inject(StoragePort)),
       },
     ];
   }
   ```

   When Capacitor lands, this is where the platform branch goes
   (`Capacitor.isNativePlatform() ? CapacitorPreferencesAdapter : LocalStorageAdapter`) —
   feature code never changes.
6. **Angular stays Angular in the view layer.** Signal stores, `resource()`, signal forms,
   router — use them fully. The boundary adapts `Promise`-based business results into signals:

   ```ts
   @Component({ /* … */ })
   export class RecipeList {
     private readonly favorites = inject(FavoritesService);
     protected readonly ids = resource({ loader: () => this.favorites.getAll() });
   }
   ```
7. **`@Service` / `providedIn: 'root'` are for Angular-side services only** — signal stores and
   UI orchestration that legitimately import Angular. Never on ports, adapters, or `domain/` code.
8. **What we deliberately do NOT do** (over-engineering for this roadmap — do not introduce
   without an ADR here): use-case/interactor classes per operation, DTO mapping layers between
   every boundary, framework-agnostic state management, layer-first top-level folders.

## Folder structure

Feature-first (per the official style guide), with layers *inside* each feature:

```
src/app/
├─ core/                          # cross-cutting infrastructure, one folder per capability
│  └─ storage/
│     ├─ storage-port.ts
│     ├─ local-storage-adapter.ts
│     └─ provide-storage.ts
├─ features/
│  └─ recipes/
│     ├─ domain/                  # plain TS: entities, rules, feature services
│     ├─ data/                    # feature-specific ports + adapters (e.g. RecipeRepository)
│     ├─ recipe-list.ts/.html     # view layer lives at the feature root (or subfeature folders)
│     ├─ provide-recipes.ts       # feature composition
│     └─ recipes.routes.ts        # lazy-loaded
├─ ui/                            # shared view-layer primitives (design-system kit): pure
│                                 # presentation directives, no services/ports (ui-styling skill)
├─ app.config.ts                  # app composition root
└─ app.routes.ts
```

- `domain/` and `data/` are the only reserved layer folders; everything else in a feature is view.
- File naming follows repo convention: hyphenated, matching the identifier
  (`StoragePort` → `storage-port.ts`), no `.component.`-style dotted type suffixes.
- `ng generate` for view-layer artifacts only; `domain/`, `data/`, and `core/` files are written
  by hand (the CLI would stamp Angular decorators onto them).

## Testing

- `domain/`, `data/` ports, and business services: plain Vitest, no `TestBed` — construct the
  class with a hand-rolled fake port. This is the payoff of the whole setup; keep it.
- Adapters: test against the real platform API where the test environment provides it
  (e.g. `localStorage` in the browser-mode/jsdom test runner).
- Components: `TestBed` with fake ports/services in `providers`.

## Decision log

Discrepancies with generic Angular guidance, resolved deliberately (2026-07):

| Generic guidance | Our resolution | Why |
|---|---|---|
| Style guide: "avoid type-based directories" | Layer folders (`domain/`, `data/`) live *inside* features; top level stays feature-first | Keeps the style guide's intent (navigate by feature) while making the dependency rule visible |
| Best practices: prefer `@Service`/`providedIn: 'root'` for singletons | Only for Angular-side services; ports/adapters/domain are bound manually at composition roots | Self-registering decorators couple classes to Angular DI and to one concrete implementation |
| "Scaffold with `ng generate`" | View-layer artifacts only | The CLI generates Angular-decorated code; business/infra layers must stay Angular-free |
| Signals-first state everywhere | Signals confined to the view layer; business API is `Promise`/plain values, adapted via `resource()` | Keeps business code portable and trivially testable; the adaptation cost is paid once at the boundary |
| Direct `localStorage` usage in examples/docs | Banned outside `core/storage/` adapters | PWA (IndexedDB) and Capacitor (Preferences/SQLite) migrations become provider swaps |

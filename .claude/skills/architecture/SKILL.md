---
name: architecture
description: ChefMate's hexagonal architecture patterns. Use when creating a feature, service, port, adapter, repository, or store; when code needs storage, HTTP, or device/platform APIs; or when deciding where a file goes. Covers layer boundaries, DI wiring at composition roots, and folder placement.
---

# ChefMate Architecture Skill

Canonical rules and rationale live in `ARCHITECTURE.md` at the repo root — consult it for the
decision log and the full dependency rule. This skill is the operational checklist.

**Layering:** Angular view layer → plain-TS business layer → ports (abstract classes) ← adapters.
Only composition roots (`src/app/app.config.ts`, feature `provide-*.ts`) import adapters.

## Decision table: where does this code go?

| You are writing… | It goes in… | It is… |
|---|---|---|
| Component, template, signal store, signal form | feature root (e.g. `features/recipes/`) | Angular (`@Component`, `@Service`) |
| Entity, business rule, calculation, feature service | `features/<name>/domain/` | plain TS, zero Angular imports |
| Feature-specific port + adapter (e.g. `RecipeRepository`) | `features/<name>/data/` | plain TS, zero Angular imports |
| Cross-cutting capability (storage, clock, analytics…) | `core/<capability>/` | plain TS port + adapter + `provide-*.ts` |
| DI wiring (`useClass`/`useFactory` bindings) | `app.config.ts` or feature `provide-*.ts` | the ONLY place adapters are imported |

## Templates

**Port** — abstract class = contract + DI token. Async from day one (Capacitor/IndexedDB are async):

```ts
// core/storage/storage-port.ts
export abstract class StoragePort {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T): Promise<void>;
  abstract remove(key: string): Promise<void>;
}
```

**Adapter** — plain class, no decorators, extends the port:

```ts
// core/storage/local-storage-adapter.ts
export class LocalStorageAdapter extends StoragePort { /* … */ }
```

**Business service** — plain class, ports via constructor:

```ts
// features/recipes/domain/favorites-service.ts
export class FavoritesService {
  constructor(private readonly storage: StoragePort) {}
}
```

**Composition** — `provide*()` functions returning `Provider[]`:

```ts
// core/storage/provide-storage.ts
export function provideStorage(): Provider[] {
  return [{ provide: StoragePort, useClass: LocalStorageAdapter }];
}

// features/recipes/provide-recipes.ts
export function provideRecipes(): Provider[] {
  return [{ provide: FavoritesService, useFactory: () => new FavoritesService(inject(StoragePort)) }];
}
```

App-wide providers go in `app.config.ts`; feature-scoped ones in the feature's lazy routes file.

**View boundary** — adapt Promises to signals with `resource()`:

```ts
export class RecipeList {
  private readonly favorites = inject(FavoritesService);
  protected readonly ids = resource({ loader: () => this.favorites.getAll() });
}
```

## Checklist before finishing

- [ ] No `localStorage`/`fetch`/`navigator.*`/Capacitor calls outside adapters
- [ ] No Angular imports in `domain/`, `data/`, or `core/` ports/adapters (`inject()` only in `provide-*.ts`)
- [ ] No adapter imported outside a composition root or its own spec
- [ ] Ports/adapters/business services carry no `@Injectable`/`@Service` decorator
- [ ] Business-layer tests use plain Vitest with fake ports — no `TestBed`
- [ ] Files hand-written for non-view layers (`ng generate` is view-only), hyphenated names matching the identifier

## Anti-patterns (deliberately rejected — do not introduce)

Use-case/interactor classes per operation; DTO mapping layers between every boundary;
framework-agnostic state management; top-level `domain/`/`infrastructure/` layer folders.
If one seems needed, add an entry to the decision log in `ARCHITECTURE.md` first.

---
name: ui-styling
description: ChefMate's Tailwind theming, responsive-breakpoint, and UI-kit rules. Use when writing any template or component styling, doing responsive/adaptive layout (mobile, tablet, desktop breakpoints), creating or changing src/app/ui/ primitives, adding design tokens, handling colors or dark mode, or deciding how a component should look.
---

# ChefMate UI & Styling

The app is **function-first**: components never make visual decisions. All appearance flows
from semantic design tokens in `src/styles.css`, consumed through a small owned UI kit in
`src/app/ui/`. Retheming the app (including dark mode) means editing `src/styles.css` only.

Enforced mechanically: `npm run lint:styles` (`scripts/check-styling.mjs`) runs in a Claude Code
PostToolUse hook on every Edit/Write and can run in CI. If it flags your change, fix the class —
do not work around the checker.

## The rules

1. **Semantic tokens only.** Raw palette utilities (`bg-red-500`, `text-blue-600`, `bg-white`,
   `bg-black`) and arbitrary color literals (`bg-[#ff0000]`, `text-[oklch(...)]`) are banned
   everywhere except `src/styles.css`. If no token fits, add a token (see below) — don't inline.
2. **Layout vs. skin split.** Feature templates may freely use _layout_ utilities (`flex`, `grid`,
   `gap-*`, `p-*`, `w-*`, `max-w-*`) but not _appearance_ (colors, shadows, radius, font styling
   beyond size adjustments). Appearance belongs to `ui/` primitives and tokens. Exception:
   semantic text/background utilities (`text-muted-foreground`, `bg-muted`) are fine in features
   for prose and page chrome.
3. **Never `dark:`.** Dark mode is a theme; themes are token values flipped under `.dark` in
   `src/styles.css`. Components must be theme-agnostic. (Enforced by the checker.)
4. **State styling via ARIA/data attributes** — `aria-expanded:rotate-180`,
   `aria-selected:bg-muted`, `disabled:opacity-50`. Angular Aria directives set these attributes;
   never mirror interactive state into extra CSS classes by hand.
5. **Behavior is never hand-rolled** for patterns `@angular/aria` covers (accordion, listbox,
   combobox/select, menu, tabs, toolbar, tree, grid); presentation is never imported from a styled
   component library. Native elements (`<button>`, `<dialog>`, popover) before custom widgets.
6. **Variants are closed unions.** Primitives expose `input<keyof typeof VARIANTS>`, not free-form
   class inputs. If a screen needs a new look, add a variant to the primitive.
7. **Component CSS files stay near-empty.** Tailwind utilities first; per-component CSS only for
   what utilities can't express, and then only with `var(--color-*)` references — no color
   literals (enforced by the checker).
8. **Mobile-first, three device tiers.** Unprefixed utilities style phones; `md:` adapts for
   tablets/iPads; `lg:` adapts for desktop. No other responsive variants (see below; enforced
   by the checker).

## Responsive layout (three device tiers)

The app targets exactly three devices, in priority order: **phones → tablets/iPads → desktop**.
Tailwind is mobile-first, so this maps directly:

| Tier          | Variant        | Width    | Meaning                                           |
| ------------- | -------------- | -------- | ------------------------------------------------- |
| Mobile        | _(unprefixed)_ | < 768px  | the default — every screen is designed here first |
| Tablet / iPad | `md:`          | ≥ 768px  | layout upgrades: more columns, side-by-side panes |
| Desktop       | `lg:`          | ≥ 1024px | max widths, denser grids, hover affordances       |

```html
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">…</div>
```

Rules:

- **Write the unprefixed classes for the phone layout first**, then enhance upward. If a template
  has `md:`/`lg:` classes but looks broken on a narrow viewport, the base tier was skipped — fix
  the base, don't add more breakpoints.
- **Only `md:` and `lg:` exist.** `sm:`, `xl:`, and `2xl:` are removed from the theme
  (`--breakpoint-*: initial` in `src/styles.css`) and flagged by `lint:styles`. If a design
  genuinely needs a fourth tier someday, that's a `src/styles.css` + this-skill change, not an
  inline exception.
- **Never `max-*:` variants** (`max-md:hidden`) — styling downward inverts mobile-first and
  hides bugs in the base tier. Enforced by the checker.
- **Responsiveness is a feature-layout concern.** `ui/` primitives stay viewport-agnostic — they
  fill their container; features decide widths, columns, and visibility with layout utilities
  (`w-full md:w-auto`, `hidden lg:block`). Don't put `md:`/`lg:` inside a primitive's variant
  maps. For the rare component that must adapt to its _container_ rather than the viewport, use
  container queries (`@container` + `@md:`) instead of viewport tiers.
- Touch first: interactive targets are sized for fingers at the base tier (min ~44px hit area —
  the kit's `h-10`+ buttons and inputs already comply); never shrink them at `md:`/`lg:`.

## Token vocabulary (shadcn-compatible)

Deliberately the shadcn/ui naming so themes from that ecosystem (tweakcn, etc.) can be pasted in
later, and Spartan UI components can be adopted incrementally if hand-writing primitives gets old.

| Token                                    | Utility examples                         | Role                             |
| ---------------------------------------- | ---------------------------------------- | -------------------------------- |
| `background` / `foreground`              | `bg-background`, `text-foreground`       | page surface / default text      |
| `muted` / `muted-foreground`             | `bg-muted`, `text-muted-foreground`      | subdued surfaces, secondary text |
| `card` / `card-foreground`               | `bg-card`, `text-card-foreground`        | elevated surfaces                |
| `border`, `input`                        | `border` (default color), `border-input` | hairlines, control borders       |
| `primary` / `primary-foreground`         | `bg-primary`, `text-primary-foreground`  | brand actions                    |
| `destructive` / `destructive-foreground` | `bg-destructive`                         | dangerous actions                |
| `ring`                                   | `focus-visible:outline-ring`             | focus indicator                  |
| `radius`                                 | `rounded-sm/md/lg/xl`                    | one knob, derived scale          |

Spacing and type scale stay on Tailwind defaults — don't tokenize them.

### Adding a token

Three places in `src/styles.css`, or it doesn't exist:

1. Value in `:root` (light) — and in `.dark` if it differs.
2. Mapping in `@theme inline` (`--color-<name>: var(--<name>)`) so utilities generate.
3. Use it via the utility, never via `var(--<name>)` in templates.

## The UI kit (`src/app/ui/`)

Primitives are **attribute directives on native elements** — no wrapper templates, no services,
no ports. Current set: `button.ts` (Button), `text-input.ts` (TextInput), `card.ts` (Card +
sections), `badge.ts` (Badge). Scaffold new ones with `ng generate directive ui/<name>`, then
follow this shape:

```ts
import { Directive, computed, input } from '@angular/core';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-input bg-transparent hover:bg-muted',
} as const;

export type ThingVariant = keyof typeof VARIANTS;

@Directive({
  selector: 'button[app-thing]', // constrain to native elements that carry the semantics
  host: { '[class]': 'classes()' }, // static `host: { class: '...' }` when there are no variants
})
export class Thing {
  readonly variant = input<ThingVariant>('primary');
  protected readonly classes = computed(() => `inline-flex … ${VARIANTS[this.variant()]}`);
}
```

Conventions:

- Selector prefix `app-`, hyphenated attribute (`app-button`), file named after the class.
- Consumer templates may add layout classes next to the attribute
  (`<button app-button class="w-full">`) — Angular merges them; appearance classes there are
  a rule-2 violation.
- Every interactive primitive styles `focus-visible:outline-ring` and disabled states.
- Test with a host component + `TestBed` (see `ui/button.spec.ts`); directives using `input()`
  cannot be `new`-ed directly.

## When you're asked to "make it look good" later

That work happens in `src/styles.css` (token values, radius, fonts) and by adding variants to
primitives — not by scattering utilities through feature templates. If a redesign genuinely needs
a new primitive or token, add it here and update this skill's vocabulary table.

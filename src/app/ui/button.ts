import { Directive, computed, input } from '@angular/core';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'aria-disabled:pointer-events-none aria-disabled:opacity-50';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-input bg-transparent hover:bg-muted',
  ghost: 'hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
} as const;

const SIZES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

/**
 * Styles a native `<button>` or `<a>` — keeps the element's own semantics,
 * keyboard handling, and form behavior.
 *
 * `<button app-button variant="outline" size="sm">…</button>`
 */
@Directive({
  selector: 'button[app-button], a[app-button]',
  host: { '[class]': 'classes()' },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');

  protected readonly classes = computed(
    () => `${BASE} ${VARIANTS[this.variant()]} ${SIZES[this.size()]}`,
  );
}

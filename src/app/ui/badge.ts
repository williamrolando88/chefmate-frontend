import { Directive, computed, input } from '@angular/core';

const VARIANTS = {
  default: 'bg-primary text-primary-foreground',
  muted: 'bg-muted text-muted-foreground',
  outline: 'border text-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
} as const;

export type BadgeVariant = keyof typeof VARIANTS;

/**
 * `<span app-badge variant="muted">Draft</span>`
 */
@Directive({
  selector: '[app-badge]',
  host: { '[class]': 'classes()' },
})
export class Badge {
  readonly variant = input<BadgeVariant>('default');

  protected readonly classes = computed(
    () =>
      `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[this.variant()]}`,
  );
}

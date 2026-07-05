import { Directive } from '@angular/core';

/**
 * Card surface and its sections. Applied to plain elements so the DOM stays flat:
 *
 * ```html
 * <section app-card>
 *   <header app-card-header>
 *     <h2 app-card-title>Title</h2>
 *     <p app-card-description>Supporting copy</p>
 *   </header>
 *   <div app-card-content>…</div>
 *   <footer app-card-footer>…</footer>
 * </section>
 * ```
 */
@Directive({
  selector: '[app-card]',
  host: { class: 'block rounded-lg border bg-card text-card-foreground shadow-sm' },
})
export class Card {}

@Directive({
  selector: '[app-card-header]',
  host: { class: 'flex flex-col gap-1.5 p-6' },
})
export class CardHeader {}

@Directive({
  selector: '[app-card-title]',
  host: { class: 'text-lg leading-none font-semibold tracking-tight' },
})
export class CardTitle {}

@Directive({
  selector: '[app-card-description]',
  host: { class: 'text-sm text-muted-foreground' },
})
export class CardDescription {}

@Directive({
  selector: '[app-card-content]',
  host: { class: 'block p-6 pt-0' },
})
export class CardContent {}

@Directive({
  selector: '[app-card-footer]',
  host: { class: 'flex items-center gap-2 p-6 pt-0' },
})
export class CardFooter {}

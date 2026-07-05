import { Directive } from '@angular/core';

/**
 * Styles native text controls. Apply to `<input>`, `<textarea>`, or `<select>`:
 *
 * `<input app-input type="text" />`
 */
@Directive({
  selector: 'input[app-input], textarea[app-input], select[app-input]',
  host: {
    class:
      'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ' +
      'placeholder:text-muted-foreground ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
      'disabled:cursor-not-allowed disabled:opacity-50',
  },
})
export class TextInput {}

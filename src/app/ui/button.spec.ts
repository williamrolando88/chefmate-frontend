import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button, ButtonVariant } from './button';

@Component({
  imports: [Button],
  template: '<button app-button [variant]="variant()">Save</button>',
})
class Host {
  readonly variant = signal<ButtonVariant>('primary');
}

describe('Button', () => {
  it('applies the variant classes to the native button', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.className).toContain('bg-primary');

    fixture.componentInstance.variant.set('destructive');
    await fixture.whenStable();

    expect(button.className).toContain('bg-destructive');
    expect(button.className).not.toContain('bg-primary');
  });
});

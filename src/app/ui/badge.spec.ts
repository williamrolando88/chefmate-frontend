import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Badge, BadgeVariant } from './badge';

@Component({
  imports: [Badge],
  template: '<span app-badge [variant]="variant()">Draft</span>',
})
class Host {
  readonly variant = signal<BadgeVariant>('default');
}

describe('Badge', () => {
  it('applies the variant classes', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const badge = fixture.nativeElement.querySelector('span') as HTMLSpanElement;

    expect(badge.className).toContain('bg-primary');

    fixture.componentInstance.variant.set('muted');
    await fixture.whenStable();

    expect(badge.className).toContain('bg-muted');
  });
});

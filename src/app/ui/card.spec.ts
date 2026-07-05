import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Card, CardContent, CardHeader, CardTitle } from './card';

@Component({
  imports: [Card, CardHeader, CardTitle, CardContent],
  template: `
    <section app-card>
      <header app-card-header>
        <h2 app-card-title>Recipes</h2>
      </header>
      <div app-card-content>Body</div>
    </section>
  `,
})
class Host {}

describe('Card', () => {
  it('styles the host elements without adding wrapper DOM', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('section')?.className).toContain('bg-card');
    expect(host.querySelector('h2')?.textContent).toContain('Recipes');
  });
});

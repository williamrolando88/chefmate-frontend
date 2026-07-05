import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TextInput } from './text-input';

@Component({
  imports: [TextInput],
  template: '<input app-input placeholder="Name" />',
})
class Host {}

describe('TextInput', () => {
  it('styles the native input with token utilities', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.className).toContain('border-input');
    expect(input.className).toContain('bg-background');
  });
});
